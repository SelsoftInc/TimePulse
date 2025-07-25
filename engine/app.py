from fastapi import FastAPI, HTTPException
from langchain_community.chat_models import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_community.callbacks import get_openai_callback
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Retrieve Azure OpenAI credentials from environment variables
azure_openai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
azure_openai_api_key = os.getenv("AZURE_OPENAI_API_KEY")
azure_openai_deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
azure_openai_api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2023-06-01-preview")

if not azure_openai_endpoint or not azure_openai_api_key or not azure_openai_deployment_name:
    raise ValueError("Azure OpenAI endpoint, API key, and deployment name must be set in the .env file.")

# Initialize Azure OpenAI GPT model with LangChain
chat_model = AzureChatOpenAI(
    azure_deployment=azure_openai_deployment_name,
    api_version=azure_openai_api_version,
    temperature=0.7,
    max_tokens=None,
    max_retries=2
)

@app.post("/process-document")
async def process_document(document_content: str):
    """
    Process a document's content using Azure OpenAI GPT model via LangChain.
    The document content should be passed as a string in the request body.
    """
    try:
        # Define a prompt for GPT
        prompt_template = PromptTemplate(
            input_variables=["document"],
            template="""
            You are a language model tasked with analyzing and summarizing the following document content:
            {document}
            Provide a concise summary of the content.
            """
        )

        with get_openai_callback() as cb:
            # Generate a response
            response = chat_model.invoke(
                prompt_template.format(document=document_content)
            )

            cost = cb.total_cost

        return {
            "summary": response.content,
            "cost": f"Total Cost (USD): ${format(cost, '.6f')}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
