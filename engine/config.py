from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application configuration settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields in .env file
    )
    
    # Application
    APP_NAME: str = "Timesheet Generator API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Legacy Gemini settings removed. Use Bedrock/Claude or LLM_API_* env vars instead.
    
    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: str = "png,jpg,jpeg,pdf,csv,docx,xlsx,xls,doc,html,htm,txt,md,gif,webp"
    
    # Image Processing and Upscaling
    ENABLE_IMAGE_UPSCALING: bool = True
    UPSCALING_METHOD: str = "lanczos"  # Options: lanczos, cubic, linear, bicubic, bilinear
    UPSCALING_SCALE_FACTOR: float = 2.0
    PDF_TO_PNG_DPI: int = 300
    
    # CORS
    CORS_ORIGINS: str = "https://goggly-casteless-torri.ngrok-free.dev,http://44.222.217.57:8000"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "app.log"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 30
    
    # AWS Bedrock / Claude (optional)
    # BEDROCK_CLAUDE_API_KEY should be set to credentials or an API key used by your Bedrock setup
    BEDROCK_CLAUDE_API_KEY: str | None = None
    BEDROCK_CLAUDE_MODEL: str = "anthropic.claude-v1"  # default model id placeholder
    
    # Bedrock IDP endpoint (for document OCR/IDP). Example: https://bedrock-runtime.region.amazonaws.com/idp/your-endpoint
    BEDROCK_IDP_ENDPOINT: str = ""
    # AWS credentials (optional - used by boto3 if provided)
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "us-east-1"
    # Specific Claude model id for boto3 converse usage
    CLAUDE_MODEL_ID: str | None = None
    
    # LLM API (for direct HTTP calls to a runtime/proxy)
    API_KEY: str | None = None
    LLM_MODEL_ID: str | None = None
    LLM_API_URL: str | None = None
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
