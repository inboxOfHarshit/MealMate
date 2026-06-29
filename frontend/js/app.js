/* MealMate - Main Application Controller */

const App = {

  state: {
    step: 0,
    apiKey: '',
    apiMode: 'default',
    profile: {},
    goals: [],
    medConditions: [],
    allergies: [],
    dietType: '',
    activityLevel: '',
    dietPlan: null,
    loadingPlan: false,
    error: null,
    ragUsed: false,
    ragRefCount: 0
  },

  init() {
    document.getElementById('recipe-modal').addEventListener('click', Recipes.closeOnOverlay.bind(Recipes));
    this.render();
  },

  render() {
    this.renderStepBar();
    const root = document.getElementById('app-root');

    switch (this.state.step) {
      case 0: root.innerHTML = Steps.renderApi(this.state); break;
      case 1: root.innerHTML = Steps.renderBasic(this.state); break;
      case 2: root.innerHTML = Steps.renderGoals(this.state); break;
      case 3: root.innerHTML = Steps.renderMedical(this.state); break;
      case 4: root.innerHTML = Steps.renderDiet(this.state); break;
      case 5: root.innerHTML = Steps.renderPlan(this.state); break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderStepBar() {
    const c = document.getElementById('step-bar');
    let h = '<div class="step-bar">';

    STEPS_LIST.forEach((s, i) => {
      const cls = i < this.state.step ? 'done' : i === this.state.step ? 'active' : '';
      h += `<div class="step-item">
        <div class="step-dot ${cls}">${i < this.state.step ? '✓' : i + 1}</div>
        <span class="step-label ${i === this.state.step ? 'active' : ''}">${s}</span>
      </div>`;
      if (i < STEPS_LIST.length - 1) h += '<div class="step-divider"></div>';
    });

    c.innerHTML = h + '</div>';
  },

  setStep(n) {
    this.state.step = n;
    this.render();
  },

  goBack() {
    this.state.step = Math.max(0, this.state.step - 1);
    this.render();
  },

  setApiMode(mode) {
    this.state.apiMode = mode;
    document.getElementById('btn-default').classList.toggle('active', mode === 'default');
    document.getElementById('btn-custom').classList.toggle('active', mode === 'custom');
    document.getElementById('panel-custom').style.display = mode === 'custom' ? '' : 'none';
  },

  submitApiStep() {
    if (this.state.apiMode === 'custom') {
      const key = document.getElementById('api-key-input')?.value?.trim() || '';
      if (!key) { alert('Please enter your OpenRouter API key.'); return; }
      this.state.apiKey = key;
    }
    this.state.step = 1;
    this.render();
  },

  submitBasicInfo() {
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;

    if (!age || !gender || !height || !weight) {
      alert('Please fill in all required fields.');
      return;
    }

    this.state.profile = {
      ...this.state.profile,
      age,
      gender,
      height,
      weight,
      targetWeight: document.getElementById('target_weight').value
    };

    this.state.step = 2;
    this.render();
  },

  submitGoals() {
    if (!this.state.goals.length) {
      alert('Please select at least one health goal.');
      return;
    }
    this.state.step = 3;
    this.render();
  },

  submitMedical() {
    this.state.profile.otherConditions = document.getElementById('other-conditions').value;
    this.state.profile.otherAllergies = document.getElementById('other-allergies').value;
    this.state.step = 4;
    this.render();
  },

  async generatePlan() {
    this.state.profile.cuisinePref = document.getElementById('cuisine-pref')?.value || this.state.profile.cuisinePref || '';
    this.state.profile.specialReq = document.getElementById('special-req')?.value || this.state.profile.specialReq || '';

    if (!this.state.dietType) { alert('Please select a diet type.'); return; }
    if (!this.state.activityLevel) { alert('Please select your activity level.'); return; }

    this.state.profile = {
      ...this.state.profile,
      goals: this.state.goals,
      medConditions: this.state.medConditions,
      allergies: this.state.allergies,
      dietType: this.state.dietType,
      activityLevel: this.state.activityLevel,
      mealFreq: this.state.profile.mealFreq || '3 Meals/Day'
    };

    this.state.step = 5;
    this.state.loadingPlan = true;
    this.state.error = null;
    this.render();

    try {
      const result = await MealMateAPI.generatePlan(
        this.state.profile,
        this.state.apiMode === 'default',
        this.state.apiKey
      );

      this.state.dietPlan = result.plan;
      this.state.ragUsed = result.rag_context_used || false;
      this.state.ragRefCount = result.rag_references || 0;
      this.state.loadingPlan = false;
      this.render();
    } catch (err) {
      this.state.loadingPlan = false;
      this.state.error = `${err.message}. Please check your API key and try again.`;
      this.render();
    }
  },

  togglePill(type, val, el) {
    const map = { goals: 'goals', med: 'medConditions', allergy: 'allergies' };
    const arr = this.state[map[type]];

    if (val === 'None') {
      this.state[map[type]] = arr.includes('None') ? [] : ['None'];
    } else {
      const ni = arr.indexOf('None');
      if (ni > -1) arr.splice(ni, 1);
      const idx = arr.indexOf(val);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push(val);
    }

    el.closest('.pill-group').querySelectorAll('.pill').forEach(p => {
      p.classList.toggle('selected', this.state[map[type]].includes(p.textContent.trim()));
    });
  },

  selectDiet(val) {
    this.state.dietType = val;
    document.querySelectorAll('#diet-group .pill').forEach(p => {
      p.classList.toggle('selected', p.textContent.trim() === val);
    });
  },

  selectActivity(val) {
    this.state.activityLevel = val;
    document.querySelectorAll('#activity-group .pill').forEach(p => {
      const isThis = p.querySelector('strong')?.textContent === val;
      p.style.borderColor = isThis ? 'var(--sage)' : '';
      p.style.background = isThis ? 'var(--sage)' : '';
      p.style.color = isThis ? 'white' : '';
    });
  },

  selectMealFreq(val) {
    this.state.profile.mealFreq = val;
    document.querySelectorAll('#meal-freq-group .pill').forEach(p => {
      p.classList.toggle('selected', p.textContent.trim() === val);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
