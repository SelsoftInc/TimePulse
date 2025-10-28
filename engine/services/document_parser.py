from langchain_community.document_loaders import (
    PyPDFLoader,
    UnstructuredImageLoader,
    UnstructuredWordDocumentLoader,
    CSVLoader
)
try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
except Exception:
    # Fallback: provide a minimal splitter if langchain is not installed.
    class RecursiveCharacterTextSplitter:
        def __init__(self, chunk_size=4000, chunk_overlap=200, length_function=len):
            self.chunk_size = int(chunk_size)
            self.chunk_overlap = int(chunk_overlap)
            self.length_function = length_function

        def split_text(self, text: str):
            """A very small fallback splitter that splits by characters with overlap.

            This is intentionally simple and only used when LangChain isn't available.
            """
            if not text:
                return []
            chunks = []
            step = max(1, self.chunk_size - self.chunk_overlap)
            for i in range(0, len(text), step):
                chunk = text[i:i + self.chunk_size]
                chunks.append(chunk)
                if i + self.chunk_size >= len(text):
                    break
            return chunks
from typing import List, Dict
import os
import tempfile
from pathlib import Path
from loguru import logger
import pandas as pd
from PIL import Image
import numpy as np
import boto3
from botocore.exceptions import ClientError
import json
from config import get_settings
import io
try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None


class DocumentParser:
    """Handle parsing of different document types"""
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=4000,
            chunk_overlap=200,
            length_function=len,
        )
        # Initialize Bedrock client (boto3). If AWS creds are provided in env, boto3 will use them.
        self.settings = get_settings()
        self.bedrock_runtime = None
        try:
            # If explicit AWS credentials provided in settings, pass them; otherwise rely on default chain
            if self.settings.AWS_ACCESS_KEY_ID and self.settings.AWS_SECRET_ACCESS_KEY:
                self.bedrock_runtime = boto3.client(
                    service_name='bedrock-runtime',
                    region_name=self.settings.AWS_REGION,
                    aws_access_key_id=self.settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=self.settings.AWS_SECRET_ACCESS_KEY,
                )
            else:
                self.bedrock_runtime = boto3.client(
                    service_name='bedrock-runtime',
                    region_name=self.settings.AWS_REGION,
                )
            logger.info("Initialized Bedrock runtime client for IDP")
        except Exception as e:
            logger.warning(f"Failed to initialize Bedrock client: {e}")
            self.bedrock_runtime = None
    
    async def parse_document(self, file_path: str, file_extension: str) -> str:
        """
        Parse document based on file type and extract text
        
        Args:
            file_path: Path to the document
            file_extension: File extension (pdf, png, docx, etc.)
        
        Returns:
            Extracted text content
        """
        try:
            logger.info(f"Parsing document: {file_path} with extension: {file_extension}")
            
            # Always prefer Bedrock IDP / Claude analyze for supported file types
            if file_extension in ['png', 'jpg', 'jpeg', 'pdf', 'docx', 'csv', 'xlsx', 'xls', 'doc']:
                text = await self.analyze_document(file_path)
            else:
                raise ValueError(f"Unsupported file extension: {file_extension}")
            
            logger.info(f"Successfully extracted {len(text)} characters from document")
            return text
            
        except Exception as e:
            logger.error(f"Error parsing document: {str(e)}")
            raise
    
    async def _parse_image(self, file_path: str) -> str:
        """Deprecated: image parsing should use `analyze_document`. Kept for compatibility."""
        return await self.analyze_document(file_path)

    async def analyze_document(self, file_path: str, user_prompt: str | None = None) -> str:
        """Send a document (image/pdf/doc/spreadsheet) to Bedrock Claude via boto3 converse.

        Returns the textual analysis returned by the model.
        """
        if not self.bedrock_runtime:
            raise RuntimeError("Bedrock runtime client not initialized. Check AWS credentials and settings.")

        # Default prompt if none provided
        if not user_prompt:
            user_prompt = "Please analyze this document and extract all important information. Provide a structured response including type, key fields, tables, and a short summary."

        try:
            file_content, doc_format, is_image = self._encode_file(file_path)

            if is_image:
                content_block = {
                    "image": {
                        "format": doc_format,
                        "source": {"bytes": file_content}
                    }
                }
            else:
                content_block = {
                    "document": {
                        "format": doc_format,
                        "name": f"document-{doc_format}",
                        "source": {"bytes": file_content}
                    }
                }

            message = {
                "role": "user",
                "content": [
                    content_block,
                    {"text": user_prompt}
                ]
            }

            # Determine model id
            model_id = self.settings.CLAUDE_MODEL_ID or self.settings.BEDROCK_CLAUDE_MODEL or self.settings.LLM_MODEL_ID
            if not model_id:
                raise RuntimeError("No model id configured (CLAUDE_MODEL_ID, BEDROCK_CLAUDE_MODEL or LLM_MODEL_ID)")

            logger.info(f"Sending document to Bedrock model {model_id}")
            response = self.bedrock_runtime.converse(
                modelId=model_id,
                messages=[message],
                inferenceConfig={
                    "maxTokens": 4096,
                    "temperature": 0.1,
                    "topP": 0.9
                }
            )

            # Attempt to extract the textual response
            result = None
            try:
                result = response['output']['message']['content'][0]['text']
            except Exception:
                # Fallback: stringify the response
                result = json.dumps(response)

            logger.info(f"Bedrock returned {len(result)} characters")
            return result

        except FileNotFoundError:
            logger.error(f"File not found: {file_path}")
            raise
        except ClientError as e:
            logger.error(f"Bedrock API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Error analyzing document: {e}")
            raise

    def _encode_file(self, file_path: str):
        """Read file and return bytes, format and whether it's an image.

        Supports: pdf, csv, doc, docx, xls, xlsx, html, txt, md, png, jpg, jpeg, gif, webp
        """
        file_ext = Path(file_path).suffix.lower()

        format_mapping = {
            '.pdf': 'pdf',
            '.csv': 'csv',
            '.doc': 'doc',
            '.docx': 'docx',
            '.xls': 'xls',
            '.xlsx': 'xlsx',
            '.html': 'html',
            '.htm': 'html',
            '.txt': 'txt',
            '.md': 'md',
            '.png': 'png',
            '.jpg': 'jpeg',
            '.jpeg': 'jpeg',
            '.gif': 'gif',
            '.webp': 'webp'
        }

        doc_format = format_mapping.get(file_ext)
        if not doc_format:
            raise ValueError(f"Unsupported file type: {file_ext}. Supported: pdf, csv, doc, docx, xls, xlsx, html, txt, md, png, jpg")

        with open(file_path, 'rb') as f:
            content = f.read()

        is_image = file_ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        return content, doc_format, is_image
    
    async def _parse_pdf(self, file_path: str) -> str:
        """Parse PDF document"""
        # Prefer Bedrock IDP for PDFs
        return await self.analyze_document(file_path)
    
    async def _parse_docx(self, file_path: str) -> str:
        """Parse DOCX document"""
        return await self.analyze_document(file_path)
    
    async def _parse_spreadsheet(self, file_path: str, file_extension: str) -> str:
        """Parse CSV or XLSX spreadsheet"""
        return await self.analyze_document(file_path)
    
    def chunk_text(self, text: str) -> List[str]:
        """Split text into chunks for processing"""
        chunks = self.text_splitter.split_text(text)
        return chunks

    async def analyze_image_bytes(self, image_bytes: bytes, image_format: str = "png", user_prompt: str | None = None) -> str:
        if not self.bedrock_runtime:
            raise RuntimeError("Bedrock runtime client not initialized. Check AWS credentials and settings.")
        if not user_prompt:
            user_prompt = "Please analyze this document and extract all important information. Provide a structured response including type, key fields, tables, and a short summary."
        try:
            content_block = {
                "image": {
                    "format": image_format,
                    "source": {"bytes": image_bytes}
                }
            }
            message = {
                "role": "user",
                "content": [
                    content_block,
                    {"text": user_prompt}
                ]
            }
            model_id = self.settings.CLAUDE_MODEL_ID or self.settings.BEDROCK_CLAUDE_MODEL or self.settings.LLM_MODEL_ID
            if not model_id:
                raise RuntimeError("No model id configured (CLAUDE_MODEL_ID, BEDROCK_CLAUDE_MODEL or LLM_MODEL_ID)")
            response = self.bedrock_runtime.converse(
                modelId=model_id,
                messages=[message],
                inferenceConfig={
                    "maxTokens": 4096,
                    "temperature": 0.1,
                    "topP": 0.9
                }
            )
            result = None
            try:
                result = response['output']['message']['content'][0]['text']
            except Exception:
                result = json.dumps(response)
            return result
        except Exception as e:
            logger.error(f"Error analyzing image bytes: {e}")
            raise

    def _pdf_to_png_pages(self, file_path: str, dpi: int = 180) -> List[bytes]:
        if not fitz:
            raise RuntimeError("PyMuPDF (fitz) not installed; cannot render PDF to PNG.")
        try:
            doc = fitz.open(file_path)
            images: List[bytes] = []
            for page_index in range(len(doc)):
                page = doc.load_page(page_index)
                zoom = dpi / 72.0
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat, alpha=False)
                img_bytes = pix.tobytes("png")
                images.append(img_bytes)
            doc.close()
            logger.info(f"Rendered {len(images)} PNG page(s) from PDF")
            return images
        except Exception as e:
            logger.error(f"Failed to render PDF to PNG: {e}")
            raise

    async def analyze_document_pages_as_png(self, file_path: str, user_prompt: str | None = None) -> str:
        ext = Path(file_path).suffix.lower().lstrip('.')
        if ext != 'pdf':
            return await self.analyze_document(file_path, user_prompt)
        pages = self._pdf_to_png_pages(file_path)
        if not pages:
            return ""
        aggregated = []
        for idx, img in enumerate(pages, start=1):
            try:
                text = await self.analyze_image_bytes(img, "png", user_prompt)
                aggregated.append(text)
            except Exception as e:
                logger.warning(f"Skipping page {idx} due to error: {e}")
        return "\n\n".join(aggregated).strip()
