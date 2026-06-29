/* MealMate - Step Renderers */

const STEPS_LIST = [
  'API Setup', 'Basic Info', 'Health Goals',
  'Medical & Allergies', 'Diet & Activity', 'Your Plan'
];

const Steps = {

  renderApi(state) {
    const isDefault = state.apiMode === 'default';

    return `<div class="card" style="max-width:520px;margin:0 auto;">
      <div class="section-title">Welcome to MealMate</div>
      <p class="section-sub">Your AI-powered personal nutritionist. Personalized meal plans and detailed recipes tailored to your health profile.</p>

      <div class="mode-toggle">
        <button class="mode-btn ${isDefault ? 'active' : ''}" id="btn-default" onclick="App.setApiMode('default')">
          <span class="mode-icon">⚡</span>
          <span class="mode-label">Use Default Key</span>
          <span class="mode-desc">Quick start — no API key needed</span>
        </button>
        <button class="mode-btn ${!isDefault ? 'active' : ''}" id="btn-custom" onclick="App.setApiMode('custom')">
          <span class="mode-icon">🔑</span>
          <span class="mode-label">Use My Own Key</span>
          <span class="mode-desc">Enter your OpenRouter key</span>
        </button>
      </div>

      <div id="panel-custom" style="${!isDefault ? '' : 'display:none'}">
        <div class="form-group">
          <label>Your OpenRouter API Key</label>
          <div class="input-wrap">
            <input type="password" id="api-key-input" placeholder="sk-or-v1-xxxxxxxxxxxxxxxx" value="${state.apiKey}">
            <button class="toggle-vis" onclick="Steps.toggleKeyVis()">👁</button>
          </div>
          <p class="key-hint">Get a free key at <a href="https://openrouter.ai/keys" target="_blank">openrouter.ai/keys</a></p>
        </div>
      </div>

      <div class="btn-row" style="margin-top:24px;">
        <button class="btn-primary" onclick="App.submitApiStep()" style="flex:1;justify-content:center;">Continue →</button>
      </div>

      <div class="privacy-note" style="margin-top:20px;">
        🔒 Your health data stays in your browser. Nothing is stored or shared.
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px;">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="font-size:18px;">🤖</span>
          <div><div style="font-size:12px;font-weight:500;">AI-Generated</div><div style="font-size:11px;color:var(--mid-gray);">No static templates</div></div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="font-size:18px;">📖</span>
          <div><div style="font-size:12px;font-weight:500;">Detailed Recipes</div><div style="font-size:11px;color:var(--mid-gray);">Step-by-step with tips</div></div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="font-size:18px;">📊</span>
          <div><div style="font-size:12px;font-weight:500;">Calorie Tracked</div><div style="font-size:11px;color:var(--mid-gray);">Per-ingredient breakdown</div></div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="font-size:18px;">🏥</span>
          <div><div style="font-size:12px;font-weight:500;">Condition-Aware</div><div style="font-size:11px;color:var(--mid-gray);">PCOS, diabetes & more</div></div>
        </div>
      </div>
    </div>`;
  },

  renderBasic(state) {
    const p = state.profile;
    return `<div class="card">
      <div class="section-title">Basic Information</div>
      <p class="section-sub">Tell us about yourself so MealMate can personalize your nutrition plan.</p>
      <div class="form-grid">
        <div class="form-group">
          <label>Age (years)</label>
          <input type="number" id="age" min="10" max="100" placeholder="e.g. 28" value="${p.age || ''}">
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select id="gender">
            <option value="" ${!p.gender ? 'selected' : ''}>Select gender</option>
            <option value="Male" ${p.gender === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Female" ${p.gender === 'Female' ? 'selected' : ''}>Female</option>
            <option value="Non-binary" ${p.gender === 'Non-binary' ? 'selected' : ''}>Non-binary</option>
            <option value="Prefer not to say" ${p.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
          </select>
        </div>
        <div class="form-group">
          <label>Height (cm)</label>
          <input type="number" id="height" min="100" max="250" placeholder="e.g. 165" value="${p.height || ''}">
        </div>
        <div class="form-group">
          <label>Weight (kg)</label>
          <input type="number" id="weight" min="30" max="300" placeholder="e.g. 70" value="${p.weight || ''}">
        </div>
        <div class="form-group full">
          <label>Target Weight (kg) — optional</label>
          <input type="number" id="target_weight" min="30" max="300" placeholder="e.g. 60" value="${p.targetWeight || ''}">
        </div>
      </div>
      <div class="btn-row">
        <button class="btn-outline" onclick="App.goBack()">← Back</button>
        <button class="btn-primary" onclick="App.submitBasicInfo()">Continue →</button>
      </div>
    </div>`;
  },

  renderGoals(state) {
    const goals = [
      'Weight Loss', 'Weight Gain', 'Muscle Gain', 'Maintain Weight',
      'Improve Metabolism', 'Heart Health', 'Gut Health', 'Anti-Inflammatory',
      'Energy Boost', 'Athletic Performance', 'Bone Strength', 'Mental Clarity',
      'Longevity', 'Improve Sleep', 'Detox & Cleanse', 'Skin Health',
      'Postpartum Recovery', 'Manage Stress'
    ];

    return `<div class="card">
      <div class="section-title">Health Goals</div>
      <p class="section-sub">Select all that apply.</p>
      <div class="pill-group">
        ${goals.map(g => `<div class="pill ${state.goals.includes(g) ? 'selected' : ''}" onclick="App.togglePill('goals','${g}',this)">${g}</div>`).join('')}
      </div>
      <div class="btn-row">
        <button class="btn-outline" onclick="App.goBack()">← Back</button>
        <button class="btn-primary" onclick="App.submitGoals()">Continue →</button>
      </div>
    </div>`;
  },

  renderMedical(state) {
    const conditions = [
      'Type 2 Diabetes', 'Type 1 Diabetes', 'Pre-Diabetes', 'PCOS / PCOD',
      'Hypothyroidism', 'Hyperthyroidism', 'Hypertension (High BP)', 'High Cholesterol',
      'IBS / Irritable Bowel Syndrome', "Crohn's Disease / IBD", 'Celiac Disease',
      'Renal / Kidney Disease', 'Liver Disease / Fatty Liver', 'Lactose Intolerance',
      'Acid Reflux / GERD', 'Iron Deficiency Anemia', 'Vitamin D Deficiency',
      'Prenatal / Pregnancy', 'Postnatal / Breastfeeding', 'Osteoporosis / Low Bone Density',
      'Hormonal Imbalance', 'Insulin Resistance', 'Sleep Apnea', 'Migraine',
      'Arthritis / Joint Pain', 'None'
    ];

    const allergies = [
      'Peanuts', 'Tree Nuts', 'Dairy / Milk', 'Eggs', 'Wheat / Gluten', 'Soy',
      'Fish', 'Shellfish', 'Sesame', 'Corn', 'Mustard', 'Sulphites', 'None'
    ];

    return `<div class="card">
      <div class="section-title">Medical Conditions & Allergies</div>
      <p class="section-sub">Help us ensure every meal is safe and beneficial for you.</p>

      <p style="font-size:13px;font-weight:500;margin-bottom:10px;">Medical Conditions</p>
      <div class="pill-group">
        ${conditions.map(c => `<div class="pill ${state.medConditions.includes(c) ? 'selected' : ''}" onclick="App.togglePill('med','${c}',this)">${c}</div>`).join('')}
      </div>

      <div class="form-group" style="margin-top:16px;">
        <label>Other conditions (free text)</label>
        <input type="text" id="other-conditions" placeholder="e.g. autoimmune disorder..." value="${state.profile.otherConditions || ''}">
      </div>

      <p style="font-size:13px;font-weight:500;margin:20px 0 10px;">Food Allergies & Intolerances</p>
      <div class="pill-group">
        ${allergies.map(a => `<div class="pill red ${state.allergies.includes(a) ? 'selected' : ''}" onclick="App.togglePill('allergy','${a}',this)">${a}</div>`).join('')}
      </div>

      <div class="form-group" style="margin-top:16px;">
        <label>Other allergies (free text)</label>
        <input type="text" id="other-allergies" placeholder="e.g. strawberries, MSG..." value="${state.profile.otherAllergies || ''}">
      </div>

      <div class="btn-row">
        <button class="btn-outline" onclick="App.goBack()">← Back</button>
        <button class="btn-primary" onclick="App.submitMedical()">Continue →</button>
      </div>
    </div>`;
  },

  renderDiet(state) {
    const diets = [
      'Vegetarian', 'Vegan', 'Non-Vegetarian', 'Eggetarian', 'Pescatarian',
      'Jain', 'Satvik', 'Keto', 'Paleo', 'Mediterranean', 'Low Carb',
      'High Protein', 'Raw Food', 'Flexitarian'
    ];

    const activities = [
      { val: 'Sedentary', desc: 'Desk job, little/no exercise' },
      { val: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
      { val: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
      { val: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
      { val: 'Extremely Active', desc: 'Physical job + intense daily training' }
    ];

    const meals = [
      '2 Meals/Day', '3 Meals/Day', '4 Meals/Day', '5+ Small Meals',
      'Intermittent Fasting (16:8)', 'Intermittent Fasting (18:6)', 'One Meal a Day (OMAD)'
    ];

    return `<div class="card">
      <div class="section-title">Diet & Lifestyle</div>
      <p class="section-sub">Last step before generating your plan.</p>

      <p style="font-size:13px;font-weight:500;margin-bottom:10px;">Diet Type</p>
      <div class="pill-group" id="diet-group">
        ${diets.map(d => `<div class="pill ${state.dietType === d ? 'selected' : ''}" onclick="App.selectDiet('${d}',this)">${d}</div>`).join('')}
      </div>

      <p style="font-size:13px;font-weight:500;margin:20px 0 10px;">Activity Level</p>
      <div style="display:flex;flex-direction:column;gap:10px;" id="activity-group">
        ${activities.map(a => `<div class="pill" style="border-radius:12px;padding:12px 18px;${state.activityLevel === a.val ? 'border-color:var(--sage);background:var(--sage);color:white;' : ''}" onclick="App.selectActivity('${a.val}',this)">
          <strong>${a.val}</strong><span style="font-size:12px;opacity:0.75;margin-left:8px;">${a.desc}</span>
        </div>`).join('')}
      </div>

      <p style="font-size:13px;font-weight:500;margin:20px 0 10px;">Meal Frequency</p>
      <div class="pill-group" id="meal-freq-group">
        ${meals.map(m => `<div class="pill ${state.profile.mealFreq === m ? 'selected' : ''}" onclick="App.selectMealFreq('${m}',this)">${m}</div>`).join('')}
      </div>

      <div class="form-group" style="margin-top:18px;">
        <label>Cuisine Preferences (optional)</label>
        <input type="text" id="cuisine-pref" placeholder="e.g. South Indian, Mediterranean..." value="${state.profile.cuisinePref || ''}">
      </div>

      <div class="form-group" style="margin-top:12px;">
        <label>Specific requests or dislikes (optional)</label>
        <textarea id="special-req" placeholder="e.g. dislike bitter gourd, prefer quick meals...">${state.profile.specialReq || ''}</textarea>
      </div>

      <div class="btn-row">
        <button class="btn-outline" onclick="App.goBack()">← Back</button>
        <button class="btn-primary" onclick="App.generatePlan()">🍽 Generate My Plan</button>
      </div>
    </div>`;
  },

  renderPlan(state) {
    if (state.loadingPlan) {
      return `<div class="loading-screen">
        <div class="loading-orb"></div>
        <div class="loading-title">Crafting your personal meal plan</div>
        <p class="loading-sub">Analyzing your profile with nutrition knowledge...</p>
        <p style="margin-top:14px;" class="loading-dots"><span>●</span><span>●</span><span>●</span></p>
      </div>`;
    }

    if (state.error) {
      return `<div class="card" style="max-width:500px;margin:0 auto;text-align:center;">
        <div style="font-size:40px;margin-bottom:16px;">😟</div>
        <div class="section-title">Something went wrong</div>
        <div class="error-box" style="margin-top:12px;">${state.error}</div>
        <div class="btn-row" style="justify-content:center;margin-top:20px;">
          <button class="btn-outline" onclick="App.setStep(4)">← Edit Profile</button>
          <button class="btn-primary" onclick="App.generatePlan()">Try Again</button>
        </div>
      </div>`;
    }

    if (!state.dietPlan) return '';

    const plan = state.dietPlan;
    const p = state.profile;
    const bmi = (p.weight / ((p.height / 100) ** 2)).toFixed(1);
    const tags = [state.dietType, state.activityLevel, ...(state.goals.slice(0, 2))].filter(Boolean);

    const mealTypes = [
      { key: 'breakfast', icon: '🌅', label: 'Breakfast', time: '7:00 – 9:00 AM', cls: 'breakfast' },
      { key: 'morning_snack', icon: '🥤', label: 'Morning Snack', time: '10:30 – 11:00 AM', cls: 'snacks' },
      { key: 'lunch', icon: '☀️', label: 'Lunch', time: '12:30 – 2:00 PM', cls: 'lunch' },
      { key: 'evening_snack', icon: '🍵', label: 'Evening Snack', time: '4:30 – 5:30 PM', cls: 'snacks' },
      { key: 'dinner', icon: '🌙', label: 'Dinner', time: '7:00 – 8:30 PM', cls: 'dinner' },
    ];

    let mealsHtml = '';
    mealTypes.forEach(mt => {
      const items = plan[mt.key];
      if (!items || !items.length) return;

      mealsHtml += `<div class="meal-section">
        <div class="meal-header">
          <div class="meal-icon ${mt.cls}">${mt.icon}</div>
          <div>
            <div class="meal-name">${mt.label}</div>
            <div class="meal-time">${mt.time}</div>
          </div>
        </div>
        <div class="food-grid">
          ${items.map(item => `<div class="food-card" onclick='Recipes.open(${JSON.stringify(item).replace(/'/g, "&#39;")}, "${mt.label}")'>
            <div class="food-name">${item.name}</div>
            <div class="food-detail">${item.portion || ''}</div>
            ${item.calories ? `<div class="food-badge badge-gold">~${item.calories} kcal</div>` : ''}
            ${item.highlight ? `<div class="food-detail" style="margin-top:5px;font-size:11px;color:var(--sage-dark);">${item.highlight}</div>` : ''}
          </div>`).join('')}
        </div>
      </div>`;
    });

    return `
      <div class="plan-header">
        <div class="plan-title">Your Personal Meal Plan</div>
        <div class="plan-subtitle">BMI ${bmi} · ${p.age} yrs · ${p.weight}kg · ${p.gender}</div>
        <div class="plan-tags">${tags.map(t => `<span class="plan-tag">${t}</span>`).join('')}</div>
        ${state.ragUsed ? `<div class="rag-badge"><div class="rag-dot"></div>RAG-enhanced · ${state.ragRefCount} references</div>` : ''}
      </div>

      ${plan.summary ? `<div class="summary-box">
        <div class="summary-title">🥗 MealMate Nutritionist's Note</div>
        <div class="summary-text">${plan.summary}</div>
      </div>` : ''}

      ${plan.daily_calories ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:28px;">
        ${[{ l: 'Daily Calories', v: plan.daily_calories }, { l: 'Protein', v: plan.daily_protein + 'g' }, { l: 'Carbs', v: plan.daily_carbs + 'g' }, { l: 'Fats', v: plan.daily_fats + 'g' }]
          .map(n => `<div class="nutrition-pill"><div class="nutrition-value">${n.v || '—'}</div><div class="nutrition-label">${n.l}</div></div>`).join('')}
      </div>` : ''}

      <div class="card" style="padding:28px 32px;">${mealsHtml}</div>

      ${plan.tips ? `<div class="card" style="padding:24px 32px;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--sage-dark);margin-bottom:12px;font-weight:500;">💡 Key Recommendations</div>
        <p style="font-size:14px;line-height:1.9;">${plan.tips}</p>
      </div>` : ''}

      <div class="regen-btn">
        <button class="btn-outline" onclick="App.setStep(1)">← Edit Profile</button>
        <button class="btn-primary" onclick="App.generatePlan()">🔄 Regenerate Plan</button>
      </div>`;
  },

  toggleKeyVis() {
    const inp = document.getElementById('api-key-input');
    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
  }
};
