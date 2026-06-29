"""
MealMate - Configuration
"""
import os
from dotenv import load_dotenv

# Load .env only if it exists (won't exist on HF Spaces)
if os.path.exists(".env"):
    load_dotenv()


class Settings:
    PORT: int = int(os.getenv("PORT", 7860))
    DEFAULT_API_KEY: str = os.getenv("DEFAULT_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    APP_URL: str = os.getenv("APP_URL", "http://localhost:7860")
    OPENROUTER_URL: str = "https://openrouter.ai/api/v1/chat/completions"


settings = Settings()
