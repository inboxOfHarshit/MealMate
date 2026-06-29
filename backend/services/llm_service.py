"""
MealMate - LLM Service
Handles all communication with OpenRouter API.
Optimized for speed: shorter prompts, fewer tokens, faster responses.
"""
import httpx
import json
from typing import Dict, Any

from backend.config import settings


class LLMService:
    """Service for calling LLM via OpenRouter with RAG-augmented prompts."""

    async def generate_meal_plan(self, profile: Dict, rag_context: str, api_key: str) -> Dict:
        prompt = self._build_plan_prompt(profile, rag_context)
        response_text = await self._call_llm(prompt, api_key, max_tokens=4000)
        return self._parse_json_response(response_text)

    async def generate_recipe(self, dish_name: str, meal_label: str, profile: Dict, rag_context: str, api_key: str) -> Dict:
        prompt = self._build_recipe_prompt(dish_name, meal_label, profile, rag_context)
        response_text = await self._call_llm(prompt, api_key, max_tokens=6000)
        return self._parse_json_response(response_text)

    async def _call_llm(self, prompt: str, api_key: str, max_tokens: int = 4000) -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": settings.APP_URL,
            "X-Title": "MealMate"
        }

        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                settings.OPENROUTER_URL,
                headers=headers,
                json=payload
            )

            if response.status_code != 200:
                error_body = response.json()
                error_msg = error_body.get("error", {}).get("message", f"API error {response.status_code}")
                raise Exception(f"OpenRouter error: {error_msg}")

            data = response.json()

            if "choices" not in data or not data["choices"]:
                raise Exception("Invalid response from OpenRouter")

            return data["choices"][0]["message"]["content"]

    def _parse_json_response(self, text: str) -> Dict:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse LLM response as JSON: {str(e)}")

    def _build_plan_prompt(self, profile: Dict, rag_context: str) -> str:
        conditions = ", ".join(
            [c for c in profile.get("medConditions", []) if c and c != "None"]
        ) or "None"
        other_cond = profile.get("otherConditions", "")
        if other_cond:
            conditions += f", {other_cond}"

        allergies = ", ".join(
            [a for a in profile.get("allergies", []) if a and a != "None"]
        ) or "None"
        other_allergy = profile.get("otherAllergies", "")
        if other_allergy:
            allergies += f", {other_allergy}"

        goals = ", ".join(profile.get("goals", [])) or "General wellness"
        cuisine = profile.get("cuisinePref", "Indian")
        special_req = profile.get("specialReq", "None")
        bmi = round(profile["weight"] / ((profile["height"] / 100) ** 2), 1)

        rag_section = ""
        if rag_context:
            rag_section = f"\nKNOWLEDGE BASE:\n{rag_context}\n"

        return f"""Create a daily meal plan as JSON. User: {profile['age']}yr {profile['gender']}, {profile['height']}cm, {profile['weight']}kg, BMI {bmi}, target {profile.get('targetWeight', 'N/A')}kg.
Goals: {goals}. Conditions: {conditions}. Allergies: {allergies}. Diet: {profile['dietType']}. Activity: {profile['activityLevel']}. Meals: {profile.get('mealFreq', '3/day')}. Cuisine: {cuisine}. Requests: {special_req}.
{rag_section}
Rules: Calculate calories via Mifflin-St Jeor. NO allergens. Safe for all conditions. Use named dishes. Low GI for diabetes. Low sodium for hypertension. Anti-inflammatory for PCOS.

JSON format only (no markdown):
{{"summary":"4-5 sentence note","daily_calories":N,"daily_protein":N,"daily_carbs":N,"daily_fats":N,"breakfast":[{{"name":"dish","portion":"size","calories":N,"highlight":"benefit"}}],"morning_snack":[{{...}}],"lunch":[{{...}},{{...}}],"evening_snack":[{{...}}],"dinner":[{{...}},{{...}}],"tips":"5-6 recommendations"}}"""

    def _build_recipe_prompt(self, dish_name: str, meal_label: str, profile: Dict, rag_context: str) -> str:
        conditions = ", ".join(
            [c for c in profile.get("medConditions", []) if c and c != "None"]
        ) or "None"
        allergies = ", ".join(
            [a for a in profile.get("allergies", []) if a and a != "None"]
        ) or "None"
        cuisine = profile.get("cuisinePref", "Indian")

        rag_section = ""
        if rag_context:
            rag_section = f"\nKNOWLEDGE BASE:\n{rag_context}\n"

        return f"""Write a detailed recipe for "{dish_name}" ({meal_label}) as JSON.
User: {profile['dietType']}, conditions: {conditions}, allergies: {allergies}, cuisine: {cuisine}.
{rag_section}
Rules: Strictly {profile['dietType']}. NO allergens. Safe for {conditions}.

JSON format only (no markdown):
{{"name":"{dish_name}","description":"3-4 sentence description","servings":1,"prep_time":"X mins","cook_time":"X mins","total_time":"X mins","difficulty":"Easy/Medium/Hard","ingredients":[{{"name":"item","quantity":"amount","calories":N,"protein":"Xg","carbs":"Xg","fats":"Xg","notes":"prep note"}}],"total_nutrition":{{"calories":N,"protein":"Xg","carbs":"Xg","fats":"Xg","fiber":"Xg","sodium":"Xmg"}},"steps":["Step Title - 2-4 sentence instruction with technique and timing"],"health_benefits":"3-4 sentences on health benefits","chef_tips":"3-4 tips","meal_prep_tip":"1-2 sentences"}}

Requirements: 8-12 ingredients. 10-15 detailed steps. Each step 2-4 sentences covering technique, timing, and reasoning."""


# Singleton
llm_service = LLMService()
