"""
MealMate - Entry Point
"""
import uvicorn
from dotenv import load_dotenv
import os

if os.path.exists(".env"):
    load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(
        "backend.app:app",
        host="0.0.0.0",
        port=port,
    )
