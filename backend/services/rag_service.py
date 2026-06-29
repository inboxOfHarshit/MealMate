"""
MealMate - RAG Service
Auto-loads nutrition knowledge from .txt files in backend/data/.
No user upload needed.
"""
from pathlib import Path
from typing import List, Dict

from backend.services.vector_store import vector_store
from backend.services.text_chunker import smart_chunk
from backend.config import settings


class RAGService:

    def __init__(self):
        self.DATA_DIR = Path(__file__).parent.parent / "data"
        self._initialized = False
        self._loaded_files: List[str] = []

    def initialize(self):
        if self._initialized:
            return

        vector_store.initialize()
        self._load_data_files()
        self._initialized = True

    def _load_data_files(self):
        """Load all .txt files from backend/data/ directory."""
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)

        txt_files = sorted(self.DATA_DIR.glob("*.txt"))
        if not txt_files:
            print("   No .txt files found in backend/data/. Place your nutrition documents there.")
            return

        all_chunks = []
        for txt_file in txt_files:
            chunks = self._process_file(txt_file)
            all_chunks.extend(chunks)
            self._loaded_files.append(txt_file.name)

        if all_chunks:
            vector_store.add_documents(all_chunks)
            print(f"   Loaded {len(all_chunks)} chunks from {len(txt_files)} document(s)")

    def _process_file(self, file_path: Path) -> List[Dict]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                text = f.read()
        except Exception as e:
            print(f"   Warning: Error reading {file_path.name}: {e}")
            return []

        if not text.strip():
            return []

        chunks = smart_chunk(text, chunk_size=500, overlap=100, source_name=file_path.name)

        for chunk in chunks:
            chunk["metadata"]["filename"] = file_path.name

        return chunks

    def reload_all(self):
        if not self._initialized:
            self.initialize()

        vector_store.clear_collection()
        self._loaded_files = []
        self._load_data_files()

    def retrieve_for_profile(self, profile: Dict) -> str:
        if not self._initialized:
            self.initialize()

        if vector_store.collection is None or vector_store.collection.count() == 0:
            return ""

        queries = self._build_queries(profile)

        all_docs = []
        seen_texts = set()

        for query in queries:
            docs = vector_store.query(query, n_results=3)
            for doc in docs:
                if doc["text"] not in seen_texts:
                    seen_texts.add(doc["text"])
                    all_docs.append(doc)

        if not all_docs:
            return ""

        context_parts = []
        for i, doc in enumerate(all_docs[:8], 1):
            source = doc["metadata"].get("filename", "knowledge_base")
            context_parts.append(f"[Ref {i} - {source}]\n{doc['text']}")

        return "\n\n".join(context_parts)

    def retrieve_for_recipe(self, dish_name: str, profile: Dict) -> str:
        if not self._initialized:
            self.initialize()

        if vector_store.collection is None or vector_store.collection.count() == 0:
            return ""

        conditions = profile.get("medConditions", [])
        allergies = profile.get("allergies", [])

        queries = [
            f"recipe ingredients for {dish_name}",
            f"nutritional information for {dish_name}",
        ]

        for cond in conditions[:2]:
            if cond and cond != "None":
                queries.append(f"dietary guidelines for {cond}")

        for allergy in allergies[:2]:
            if allergy and allergy != "None":
                queries.append(f"substitutes for {allergy}")

        all_docs = []
        seen_texts = set()

        for query in queries:
            docs = vector_store.query(query, n_results=2)
            for doc in docs:
                if doc["text"] not in seen_texts:
                    seen_texts.add(doc["text"])
                    all_docs.append(doc)

        if not all_docs:
            return ""

        context_parts = []
        for i, doc in enumerate(all_docs[:6], 1):
            source = doc["metadata"].get("filename", "knowledge_base")
            context_parts.append(f"[Ref {i} - {source}]\n{doc['text']}")

        return "\n\n".join(context_parts)

    def _build_queries(self, profile: Dict) -> List[str]:
        queries = []

        goals = ", ".join(profile.get("goals", []))
        queries.append(
            f"meal plan for {profile.get('dietType', 'balanced')} diet goals {goals}"
        )

        conditions = profile.get("medConditions", [])
        for cond in conditions:
            if cond and cond != "None":
                queries.append(f"dietary guidelines for {cond} what to eat avoid")

        allergies = profile.get("allergies", [])
        for allergy in allergies:
            if allergy and allergy != "None":
                queries.append(f"foods to avoid {allergy} safe alternatives")

        queries.append(
            f"calorie protein needs {profile.get('activityLevel', 'moderate')} person"
        )

        cuisine = profile.get("cuisinePref", "")
        if cuisine:
            queries.append(f"healthy {cuisine} recipes nutrition")

        return queries

    def get_stats(self) -> Dict:
        stats = vector_store.get_stats()
        stats["loaded_files"] = self._loaded_files
        stats["data_dir"] = str(self.DATA_DIR)
        return stats


# Singleton
rag_service = RAGService()
