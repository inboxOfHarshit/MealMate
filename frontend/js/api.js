/* ═══════════════════════════════════════════════════════════════
   MealMate — API Module
   ═══════════════════════════════════════════════════════════════ */

const MealMateAPI = {

  BASE_URL: '',

  // ─── Upload Nutrition Document ───────────────────────────
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${this.BASE_URL}/api/upload-document`, {
      method: 'POST',
      body: formData   // Don't set Content-Type — browser sets it with boundary
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || 'Failed to upload document');
    }

    return data;
  },

  // ─── Get Knowledge Base Status ───────────────────────────
  async getKnowledgeBaseStatus() {
    const res = await fetch(`${this.BASE_URL}/api/knowledge-base/status`);
    return res.json();
  },

  // ─── Reload Knowledge Base ───────────────────────────────
  async reloadKnowledgeBase() {
    const res = await fetch(`${this.BASE_URL}/api/knowledge-base/reload`, {
      method: 'POST'
    });
    return res.json();
  },

  // ─── Generate Meal Plan ──────────────────────────────────
  async generatePlan(profile, useDefaultKey, customApiKey) {
    const res = await fetch(`${this.BASE_URL}/api/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, useDefaultKey, customApiKey })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || data.error || 'Failed to generate plan');
    }

    return data;
  },

  // ─── Generate Recipe ─────────────────────────────────────
  async generateRecipe(itemName, mealLabel, profile, useDefaultKey, customApiKey) {
    const res = await fetch(`${this.BASE_URL}/api/generate-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemName, mealLabel, profile, useDefaultKey, customApiKey })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || data.error || 'Failed to generate recipe');
    }

    return data;
  },

  // ─── Health Check ────────────────────────────────────────
  async healthCheck() {
    const res = await fetch(`${this.BASE_URL}/api/health`);
    return res.json();
  }
};
