from fastapi import FastAPI, Header, HTTPException
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.exceptions import HttpResponseError
from langchain_community.chat_models import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_community.callbacks import get_openai_callback
from dotenv import load_dotenv
import os
import json 

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

# Retrieve Azure credentials from environment variables
endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")

if not endpoint or not key:
    raise ValueError("Azure endpoint and key must be set in the .env file.")

document_intelligence_client = DocumentIntelligenceClient(endpoint=endpoint, credential=AzureKeyCredential(key))

@app.get("/analyze-document")
async def analyze_document(document_url: str = Header(...)):
    """
    Analyze a document from the provided URL using Azure Document Intelligence service.
    The URL should be passed as a header: `document-url`
    """
    try:
        poller = document_intelligence_client.begin_analyze_document(
            "prebuilt-read",
            {"urlSource": document_url}
        )
        result = poller.result()

        # Extract content
        content = "\n".join(paragraph.content for paragraph in result.paragraphs)
        print("content",content)
        prompt_template = PromptTemplate(
            input_variables=content,
            template="""
            You are a language model tasked with analyzing and summarizing the following time sheet document content extracted using OCR:
            {document}
            Provide a JSON response consiting of the name of vendor, their dates and hours in the below format.
            {{
                "Entry": [
            "Vendor_Name": Name,
                "Total Hours": Hours,
                "Duration":From date to end date
                ]
                ...
            }}
            """
        )

        with get_openai_callback() as cb:
            # Generate a response
            response = chat_model.invoke(
                prompt_template.format(document=content)
            )

            cost = cb.total_cost
            feedback = response.content
            json_start = feedback.find('{')
            json_end = feedback.rfind('}') + 1
        
            json_string = feedback[json_start:json_end]
            
            results = json.loads(json_string)
        

        return {"status": "Processed successfully", "results": results,}
        # return {
        #     "summary": response.content,
        #     "cost": f"Total Cost (USD): ${format(cost, '.6f')}"
        # }
        # return { "summary":content}
       
    except HttpResponseError as error:
        if error.error:
            return {"error": error.error.code, "message": error.error.message}
        return {"error": "HttpResponseError", "message": str(error)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
