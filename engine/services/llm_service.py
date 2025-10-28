import json
import boto3
from botocore.exceptions import ClientError
from loguru import logger
from typing import List
from pathlib import Path
from config import get_settings
from models import EmployeeTimesheet


class LLMService:
    """Unified service using ONLY Bedrock Claude for direct document analysis and JSON extraction.
    
    This replaces the multi-step pipeline with a single model call for faster processing.
    """

    def __init__(self):
        self.settings = get_settings()
        
        # Initialize Bedrock client
        self.bedrock_runtime = None
        try:
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
            logger.info("✅ Initialized Bedrock runtime client for unified document processing")
        except Exception as e:
            logger.warning(f"⚠️ Failed to initialize Bedrock client: {e}")
            self.bedrock_runtime = None

    def _create_direct_analysis_prompt(self) -> str:
        """Prompt for direct document analysis - extracts AND structures in one go."""
        return """Analyze this timesheet document and extract ALL employee/client timesheet data.

YOUR TASK:
1. Read and understand the document (image/PDF/text)
2. Extract ALL timesheet information for EVERY person
3. Return ONLY valid JSON - no explanations, no markdown, no extra text

WHAT TO EXTRACT:
- Employee/Client names
- Daily hours (Mon-Sun)
- Total weekly hours
- Any IDs or period information
- Handle multiple employees if present

OUTPUT FORMAT (JSON ONLY):
{
  "employees": [
    {
      "client_id": null,
      "client_name": "Name Here",
      "employee_name": null,
      "period": null,
      "week_start": null,
      "week_end": null,
      "week_hours": [
        {"day": "Mon", "hours": 8.0},
        {"day": "Tue", "hours": 7.5},
        {"day": "Wed", "hours": 8.0},
        {"day": "Thu", "hours": 8.0},
        {"day": "Fri", "hours": 6.0},
        {"day": "Sat", "hours": 0.0},
        {"day": "Sun", "hours": 0.0}
      ],
      "total_hours": 37.5
    }
  ]
}

RULES:
- If day has no hours, use 0.0
- Convert all time formats to decimal (8h30m = 8.5)
- Days must be: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Return empty array if NO timesheet data found: {"employees": []}
- ONLY return valid JSON, nothing else"""

    async def extract_timesheet_from_document(self, file_path: str, file_extension: str) -> List[EmployeeTimesheet]:
        """
        UNIFIED PIPELINE: Analyze document and extract structured timesheet data in ONE call.
        
        This replaces the old two-step process (IDP + LLM) with a single model call.
        Much faster and simpler!
        """
        if not self.bedrock_runtime:
            raise RuntimeError("❌ Bedrock runtime not initialized. Check AWS credentials.")
        
        logger.info(f"🚀 Starting UNIFIED document analysis: {file_path}")
        
        try:
            # Read and encode the file
            file_content, doc_format, is_image = self._encode_file(file_path, file_extension)
            
            logger.info(f"📄 File encoded: format={doc_format}, is_image={is_image}, size={len(file_content):,} bytes")
            
            # Validate file content
            if not file_content or len(file_content) == 0:
                raise ValueError(f"File is empty: {file_path}")
            
            # Build the message with document/image
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
                        "name": "timesheet-doc",
                        "source": {"bytes": file_content}
                    }
                }
            
            # Get the analysis prompt
            prompt = self._create_direct_analysis_prompt()
            
            message = {
                "role": "user",
                "content": [
                    content_block,
                    {"text": prompt}
                ]
            }
            
            # Determine model ID
            model_id = (
                self.settings.CLAUDE_MODEL_ID or 
                self.settings.BEDROCK_CLAUDE_MODEL or 
                self.settings.LLM_MODEL_ID
            )
            if not model_id:
                raise RuntimeError("No model ID configured")
            
            logger.info(f"📡 Sending to Bedrock model: {model_id}")
            
            # Single API call does EVERYTHING
            response = self.bedrock_runtime.converse(
                modelId=model_id,
                messages=[message],
                inferenceConfig={
                    "maxTokens": 4096,
                    "temperature": 0.1,
                    "topP": 0.9
                }
            )
            
            # Extract response text
            response_text = self._extract_response_text(response)
            
            logger.info(f"📥 Received response: {len(response_text)} characters")
            logger.info(f"\n{'='*80}\n🔍 FULL MODEL RESPONSE:\n{'='*80}\n{response_text}\n{'='*80}\n")
            
            # Parse the JSON response
            timesheets = self._parse_response(response_text)
            
            logger.info(f"✅ Extracted {len(timesheets)} employee timesheet(s)")
            return timesheets
            
        except Exception as e:
            logger.error(f"❌ Unified document analysis failed: {e}")
            raise
    
    def _encode_file(self, file_path: str, file_extension: str):
        """Read and encode file for Bedrock."""
        file_ext = file_extension if file_extension.startswith('.') else f'.{file_extension}'
        
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
            '.jpg': 'jpg',
            '.jpeg': 'jpeg',
            '.gif': 'gif',
            '.webp': 'webp'
        }
        
        doc_format = format_mapping.get(file_ext.lower())
        if not doc_format:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        with open(file_path, 'rb') as f:
            content = f.read()
        
        is_image = file_ext.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        return content, doc_format, is_image
    
    def _extract_response_text(self, response: dict) -> str:
        """Extract text from Bedrock response."""
        try:
            return response['output']['message']['content'][0]['text'].strip()
        except Exception as e:
            logger.error(f"Failed to extract response text: {e}")
            logger.error(f"Response structure: {json.dumps(response, indent=2)[:500]}")
            raise ValueError("Could not extract text from model response")
    
    def _parse_response(self, response_text: str) -> List[EmployeeTimesheet]:
        """Parse JSON response into EmployeeTimesheet objects."""
        # Log the FULL raw response first
        logger.info(f"\n{'='*80}\n🔍 PARSING RESPONSE\n{'='*80}")
        
        # Helper to try parse a candidate json string
        def try_parse(s: str):
            try:
                return json.loads(s)
            except Exception:
                return None

        text = response_text.strip()
        logger.info(f"Response text length: {len(text)} characters")

        # 1) Try to parse entire text directly
        data = try_parse(text)
        if data is not None:
            logger.info("✅ Successfully parsed entire response as JSON")

        # 2) Try any fenced code blocks anywhere
        if data is None:
            parts = []
            idx = 0
            while True:
                start = text.find("```", idx)
                if start == -1:
                    break
                end = text.find("```", start + 3)
                if end == -1:
                    break
                inner = text[start + 3:end]
                # remove optional language tag like 'json\n'
                if "\n" in inner:
                    first_line, rest = inner.split("\n", 1)
                    if first_line.strip().lower() in ("json", "javascript", "js", "python"):
                        inner = rest
                parts.append(inner.strip())
                idx = end + 3
            for p in parts:
                data = try_parse(p)
                if data is not None:
                    logger.info(f"✅ Successfully parsed JSON from code fence block")
                    break

        # 3) Scan for first balanced JSON object/array and parse it
        if data is None:
            def scan_balanced(src: str):
                results = []
                n = len(src)
                i = 0
                while i < n:
                    if src[i] in '{[':
                        stack = [src[i]]
                        in_str = False
                        esc = False
                        j = i + 1
                        while j < n:
                            ch = src[j]
                            if in_str:
                                if esc:
                                    esc = False
                                elif ch == '\\':
                                    esc = True
                                elif ch == '"':
                                    in_str = False
                            else:
                                if ch == '"':
                                    in_str = True
                                elif ch in '{[':
                                    stack.append(ch)
                                elif ch in '}]':
                                    if not stack:
                                        break
                                    top = stack[-1]
                                    if (top == '{' and ch == '}') or (top == '[' and ch == ']'):
                                        stack.pop()
                                        if not stack:
                                            # candidate from i..j
                                            results.append(src[i:j+1])
                                            break
                                    else:
                                        # mismatched, abort this start
                                        break
                            j += 1
                        i = j
                    i += 1
                return results

            candidates = scan_balanced(text)
            logger.info(f"Found {len(candidates)} balanced JSON candidates")
            for idx, c in enumerate(candidates):
                logger.info(f"Trying candidate {idx+1}: {c[:100]}...")
                data = try_parse(c)
                if data is not None:
                    logger.info(f"✅ Successfully parsed JSON from candidate {idx+1}")
                    break

        if data is None:
            logger.error("❌ Failed to parse LLM response: could not locate valid JSON")
            logger.error(f"Tried to parse this text:\n{text}")
            return []
        
        logger.info(f"✅ Parsed JSON structure: {json.dumps(data, indent=2)[:500]}...")

        timesheets = []
        employees = None
        # Accept top-level array
        if isinstance(data, list):
            employees = data
        elif isinstance(data, dict):
            # Preferred key
            if isinstance(data.get("employees"), list):
                employees = data.get("employees")
            else:
                # Try common alternative container keys
                for key in ["results", "records", "data", "items"]:
                    if isinstance(data.get(key), list):
                        employees = data.get(key)
                        break
                # If still None and dict itself looks like a single entry, wrap it
                if employees is None:
                    candidate = data
                    if any(k in candidate for k in ["total_hours", "week_hours", "period", "employee_name", "client_name"]):
                        employees = [candidate]
        if not isinstance(employees, list):
            logger.warning("LLM response missing or invalid 'employees' list: " + (json.dumps(data) if isinstance(data, dict) else str(type(data))))
            return []

        for emp_data in employees:
            try:
                # Expand nested weeks array if present (normalize to one entry per period)
                if isinstance(emp_data, dict) and isinstance(emp_data.get("weeks"), list):
                    base = {k: v for k, v in emp_data.items() if k != "weeks"}
                    for wk in emp_data["weeks"]:
                        merged = {**base, **wk}
                        timesheet = EmployeeTimesheet(**merged)
                        timesheets.append(timesheet)
                else:
                    timesheet = EmployeeTimesheet(**emp_data)
                    timesheets.append(timesheet)
            except Exception as e:
                logger.warning("Skipping invalid employee data: " + json.dumps(emp_data) + " Error: " + str(e))

        return timesheets


