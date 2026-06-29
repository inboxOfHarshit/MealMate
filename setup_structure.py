import os

base_dir = r"c:\Users\Harshit\My Files\projects\MealMate"

structure = [
    ".env",
    ".gitignore",
    "requirements.txt",
    "run.py",
    "backend/__init__.py",
    "backend/app.py",
    "backend/config.py",
    "backend/routes/__init__.py",
    "backend/routes/api.py",
    "backend/services/__init__.py",
    "backend/services/llm_service.py",
    "backend/services/rag_service.py",
    "backend/services/vector_store.py",
    "backend/data/nutrition_kb.json",
    "frontend/index.html",
    "frontend/css/styles.css",
    "frontend/js/app.js",
    "frontend/js/steps.js",
    "frontend/js/recipes.js",
    "frontend/js/api.js"
]

for item in structure:
    path = os.path.join(base_dir, item.replace("/", "\\"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        if item == "backend/data/nutrition_kb.json":
            f.write("{}")
        else:
            f.write("")
print("Creation successful!")
