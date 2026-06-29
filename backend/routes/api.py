"""
MealMate - API Routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from backend.services.llm_service import llm_service
from backend.services.rag_service import rag_service
from backend.config import settings

router = APIRouter()


class UserProfile(BaseModel):
    age: int
    gender: str
    height: float
    weight: float
    targetWeight: Optional[float] = None
    goals: List[str] = []
    medConditions: List[str] = []
    otherConditions: Optional[str] = ""
    allergies: List[str] = []
    otherAllergies: Optional[str] = ""
    dietType: str
    activityLevel: str
    mealFreq: Optional[str] = "3 Meals/Day"
    cuisinePref: Optional[str] = ""
    specialReq: Optional[str] = ""


class PlanRequest(BaseModel):
    profile: UserProfile
    useDefaultKey: bool = True
    customApiKey: Optional[str] = ""


class RecipeRequest(BaseModel):
    itemName: str
    mealLabel: str
    profile: UserProfile
    useDefaultKey: bool = True
    customApiKey: Optional[str] = ""


def resolve_api_key(use_default: bool, custom_key: str) -> str:
    if use_default:
        key = settings.DEFAULT_API_KEY
        if not key or "YOUR_DEFAULT_KEY_HERE" in key:
            raise HTTPException(
                status_code=400,
                detail="Default API key not configured. Please use your own key."
            )
        return key
    if not custom_key:
        raise HTTPException(status_code=400, detail="No API key provided.")
    return custom_key


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "app": "MealMate",
        "knowledge_base": rag_service.get_stats()
    }


@router.post("/generate-plan")
async def generate_plan(request: PlanRequest):
    try:
        api_key = resolve_api_key(request.useDefaultKey, request.customApiKey)
        profile = request.profile.model_dump()

        rag_context = rag_service.retrieve_for_profile(profile)
        plan = await llm_service.generate_meal_plan(profile, rag_context, api_key)

        return {
            "success": True,
            "plan": plan,
            "rag_context_used": len(rag_context) > 0,
            "rag_references": rag_context.count("[Ref") if rag_context else 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-recipe")
async def generate_recipe(request: RecipeRequest):
    try:
        api_key = resolve_api_key(request.useDefaultKey, request.customApiKey)
        profile = request.profile.model_dump()

        rag_context = rag_service.retrieve_for_recipe(request.itemName, profile)
        recipe = await llm_service.generate_recipe(
            request.itemName,
            request.mealLabel,
            profile,
            rag_context,
            api_key
        )

        return {
            "success": True,
            "recipe": recipe,
            "rag_context_used": len(rag_context) > 0,
            "rag_references": rag_context.count("[Ref") if rag_context else 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
