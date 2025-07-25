import pytesseract
import pandas as pd
import json
import openai
import pdfplumber
import docx
import os
import re
from PIL import Image
from io import BytesIO
from flask import Flask, request, render_template
from werkzeug.utils import secure_filename
from langchain.chains import LLMChain
from langchain_community.chat_models import ChatOpenAI
from langchain_community.chat_models import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_community.callbacks import get_openai_callback
import logging
from dotenv import load_dotenv
import warnings

# Ignore warnings
warnings.filterwarnings("ignore")

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI LLM
#llm = ChatOpenAI(model="gpt-4o", openai_api_key=os.getenv("OPENAI_API_KEY"), verbose=True)

llm = AzureChatOpenAI(
    openai_api_base=os.getenv("AZURE_OPENAI_API_ENDPOINT"),
    openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    openai_api_version="2024-11-20",  # Use the API version you're using
    deployment_name=os.getenv("AZURE_DEPLOYMENT_NAME"),
    model_name="gpt-4o",  # Optional, depends on version
    verbose=True
)

# Flask app setup
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = "uploads"
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file types
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "docx", "xlsx"}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_image(image_path):
    image = Image.open(image_path)
    return pytesseract.image_to_string(image)

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(docx_path):
    doc = docx.Document(docx_path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_text_from_xlsx(xlsx_path):
    df = pd.read_excel(xlsx_path)
    return df.to_string()

def process_file(file_path):
    ext = file_path.rsplit('.', 1)[1].lower()
    if ext in ["png", "jpg", "jpeg"]:
        return extract_text_from_image(file_path)
    elif ext == "pdf":
        return extract_text_from_pdf(file_path)
    elif ext == "docx":
        return extract_text_from_docx(file_path)
    elif ext == "xlsx":
        return extract_text_from_xlsx(file_path)
    else:
        raise ValueError("Unsupported file format")

def process_with_llm(text):
    prompt_template = PromptTemplate(
        input_variables=["text"],
        template="""
        Extract the following details from the timesheet provided:
        - Vendor Name (Infer from document headers or context)
        - Start Date
        - End Date
        - Total Hours (Billable, Non-Billable, Holiday Hours)
        - Invoice Amount
        Ensure the response is formatted as **valid JSON**.
        Timesheet Data:
        {text}
        
        JSON format is below
        {{
    "Vendor Name": ,
    "Start Date": ,
    "End Date": ",
    "Total Hours": [
        "Billable Project Hrs": ,
        "Non-Billable Project Hrs": ,
        "Time off/Holiday Hrs": 
    ],
    "Invoice Amount": 
}}
        """
    )

    chain = LLMChain(llm=llm, prompt=prompt_template)
    with get_openai_callback() as cb:
        feedback = chain.invoke({"text": text}, return_full_output=True)
    
    feedback_text = feedback.get("text", "")
    print("feedback",feedback_text)
    json_match = re.search(r"\{.*\}", feedback_text, re.DOTALL)
    json_string = json_match.group(0) if json_match else "{}"
    try:
        results = json.loads(json_string)
    except json.JSONDecodeError:
        logger.error("Invalid JSON extracted from GPT response.")
        results = {}
    return results

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            return render_template('index.html', error="No file uploaded")
        file = request.files['file']
        if file.filename == '':
            return render_template('index.html', error="No selected file")
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            raw_text = process_file(file_path)
            print("raw_text",raw_text)
            structured_data = process_with_llm(raw_text)
            print("structured_data",structured_data)
            return render_template('index.html', data=structured_data)
    return render_template('index.html', data=None)

if __name__ == "__main__":
    app.run(debug=True)
