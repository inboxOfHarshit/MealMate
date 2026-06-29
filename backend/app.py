"""
MealMate - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

from backend.routes.api import router as api_router
from backend.services.rag_service import rag_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    print("\n" + "=" * 55)
    print("  MealMate - AI Nutritionist with RAG")
    print("=" * 55)
    try:
        rag_service.initialize()
        stats = rag_service.get_stats()
        doc_count = stats.get("total_documents", 0)
        files = stats.get("loaded_files", [])
        if doc_count > 0:
            print(f"  Ready: {doc_count} knowledge chunks from {len(files)} file(s)")
            for f in files:
                print(f"    {f}")
        else:
            print("  No documents found. Place .txt files in backend/data/")
    except Exception as e:
        print(f"  Warning: RAG initialization issue: {e}")
        print("  App will still work but without knowledge base context.")
    print("=" * 55 + "\n")

    yield

    # --- SHUTDOWN ---
    print("MealMate shutting down...")


app = FastAPI(
    title="MealMate",
    description="AI Nutritionist with RAG",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/css", StaticFiles(directory=str(frontend_dir / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(frontend_dir / "js")), name="js")


@app.get("/")
async def serve_index():
    if frontend_dir.exists():
        return FileResponse(str(frontend_dir / "index.html"))
    return {"message": "MealMate API is running. Frontend not found."}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port)