"""
MealMate - Vector Store Service (ChromaDB)
"""
import chromadb
from sentence_transformers import SentenceTransformer
from pathlib import Path
from typing import List, Dict, Any, Optional

from backend.config import settings


class VectorStore:
    """ChromaDB-backed vector store for nutrition knowledge."""

    COLLECTION_NAME = "nutrition_knowledge"

    def __init__(self):
        self.model = None
        self.client = None
        self.collection = None
        self._initialized = False

    def initialize(self):
        """Load embedding model and connect to ChromaDB."""
        if self._initialized:
            return

        print(f"   Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)

        persist_dir = Path(settings.CHROMA_PERSIST_DIR)
        persist_dir.mkdir(parents=True, exist_ok=True)

        self.client = chromadb.PersistentClient(path=str(persist_dir))

        self.collection = self.client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )

        self._initialized = True
        print(f"   Vector store ready ({self.collection.count()} documents)")

    def clear_collection(self):
        """Delete all documents from the collection."""
        if not self._initialized:
            self.initialize()

        try:
            self.client.delete_collection(self.COLLECTION_NAME)
        except Exception:
            pass

        self.collection = self.client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        print("   Collection cleared.")

    def add_documents(self, documents: List[Dict[str, Any]]):
        """
        Add documents to the vector store.
        Skips IDs that already exist. Uses upsert for safety.
        """
        if not self._initialized:
            self.initialize()

        if not documents:
            return

        # Filter out IDs that already exist
        new_docs = []
        for doc in documents:
            doc_id = doc["id"]
            try:
                existing = self.collection.get(ids=[doc_id])
                if existing and existing["ids"] and doc_id in existing["ids"]:
                    continue
            except Exception:
                pass
            new_docs.append(doc)

        if not new_docs:
            print("   All documents already exist in vector store, skipping.")
            return

        ids = [doc["id"] for doc in new_docs]
        texts = [doc["text"] for doc in new_docs]
        metadatas = [doc.get("metadata", {}) for doc in new_docs]

        print(f"   Generating embeddings for {len(texts)} new chunks...")
        embeddings = self.model.encode(texts, show_progress_bar=False).tolist()

        batch_size = 100
        for i in range(0, len(ids), batch_size):
            end = min(i + batch_size, len(ids))
            try:
                self.collection.upsert(
                    ids=ids[i:end],
                    documents=texts[i:end],
                    embeddings=embeddings[i:end],
                    metadatas=metadatas[i:end]
                )
            except Exception as e:
                print(f"   Warning: batch upsert error: {e}")
                # Fall back to adding one by one
                for j in range(i, end):
                    try:
                        self.collection.upsert(
                            ids=[ids[j]],
                            documents=[texts[j]],
                            embeddings=[embeddings[j]],
                            metadatas=[metadatas[j]]
                        )
                    except Exception:
                        pass

        print(f"   Added {len(ids)} documents to vector store")

    def query(
        self,
        query_text: str,
        n_results: int = 5,
        where: Optional[dict] = None
    ) -> List[Dict]:
        """Semantic search over the knowledge base."""
        if not self._initialized:
            self.initialize()

        if self.collection is None:
            return []

        if self.collection.count() == 0:
            return []

        query_embedding = self.model.encode([query_text]).tolist()

        kwargs = {
            "query_embeddings": query_embedding,
            "n_results": min(n_results, self.collection.count()),
            "include": ["documents", "metadatas", "distances"]
        }

        if where:
            kwargs["where"] = where

        results = self.collection.query(**kwargs)

        documents = []
        if results and results["documents"] and results["documents"][0]:
            for i in range(len(results["documents"][0])):
                documents.append({
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0
                })

        return documents

    def get_stats(self) -> Dict:
        """Return collection statistics."""
        if not self._initialized:
            return {"status": "not_initialized"}
        return {
            "status": "ready",
            "total_documents": self.collection.count(),
            "embedding_model": settings.EMBEDDING_MODEL
        }


# Singleton
vector_store = VectorStore()
