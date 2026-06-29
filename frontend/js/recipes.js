/* MealMate - Recipe Module
   Features: caching, PDF download
*/

const Recipes = {

  currentItem: null,
  currentMeal: null,
  cache: {},         // { "Dish Name": recipeObject }
  currentRecipe: null, // raw recipe data for current modal

  open(item, mealLabel) {
    this.currentItem = item;
    this.currentMeal = mealLabel;

    const modal = document.getElementById('recipe-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const cacheKey = item.name;

    // Check cache first
    if (this.cache[cacheKey]) {
      this.currentRecipe = this.cache[cacheKey];
      this.render(this.cache[cacheKey]);
      return;
    }

    // Show loading and fetch
    document.getElementById('modal-content').innerHTML = `
      <div class="modal-hero">
        <button class="modal-close" onclick="Recipes.close()">✕</button>
        <div class="modal-food-name">${item.name}</div>
        <div class="modal-food-meta">
          <span>${mealLabel}</span>
          ${item.calories ? `<span>~${item.calories} kcal</span>` : ''}
        </div>
      </div>
      <div class="modal-body">
        <div class="recipe-loading">
          <div style="font-size:13px;color:var(--mid-gray);">Generating your recipe...</div>
          <div class="recipe-loading-bar"></div>
        </div>
      </div>`;

    this.fetch();
  },

  close() {
    document.getElementById('recipe-modal').style.display = 'none';
    document.body.style.overflow = '';
  },

  closeOnOverlay(e) {
    if (e.target === document.getElementById('recipe-modal')) {
      Recipes.close();
    }
  },

  async fetch() {
    try {
      const result = await MealMateAPI.generateRecipe(
        this.currentItem.name,
        this.currentMeal,
        App.state.profile,
        App.state.apiMode === 'default',
        App.state.apiKey
      );

      // Store in cache
      this.cache[this.currentItem.name] = result.recipe;
      this.currentRecipe = result.recipe;

      this.render(result.recipe);
    } catch (err) {
      const body = document.getElementById('modal-content').querySelector('.modal-body');
      body.innerHTML = `
        <div class="error-box">Failed to load recipe: ${err.message}</div>
        <div style="margin-top:16px;text-align:center;">
          <button class="btn-primary" onclick="Recipes.fetch()">Retry</button>
        </div>`;
    }
  },

  render(r) {
    const totalCal = r.ingredients
      ? r.ingredients.reduce((s, i) => s + (parseInt(i.calories) || 0), 0)
      : 0;

    const body = document.getElementById('modal-content').querySelector('.modal-body');

    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px;">
        <p style="font-size:14px;line-height:1.8;color:var(--mid-gray);flex:1;min-width:200px;margin:0;">${r.description || ''}</p>
        <button class="btn-download" onclick="Recipes.downloadPDF()">
          📥 Download PDF
        </button>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
        ${r.prep_time ? `<span style="font-size:12px;background:var(--cream);border:1px solid var(--light-gray);padding:5px 14px;border-radius:50px;">⏱ Prep: ${r.prep_time}</span>` : ''}
        ${r.cook_time ? `<span style="font-size:12px;background:var(--cream);border:1px solid var(--light-gray);padding:5px 14px;border-radius:50px;">🔥 Cook: ${r.cook_time}</span>` : ''}
        ${r.total_time ? `<span style="font-size:12px;background:var(--cream);border:1px solid var(--light-gray);padding:5px 14px;border-radius:50px;">⏳ Total: ${r.total_time}</span>` : ''}
        ${r.difficulty ? `<span style="font-size:12px;background:var(--cream);border:1px solid var(--light-gray);padding:5px 14px;border-radius:50px;">📋 ${r.difficulty}</span>` : ''}
        ${r.servings ? `<span style="font-size:12px;background:var(--cream);border:1px solid var(--light-gray);padding:5px 14px;border-radius:50px;">🍽 Serves: ${r.servings}</span>` : ''}
      </div>

      ${r.total_nutrition ? `
        <div class="sec-title">Nutritional Summary (Per Serving)</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:8px;">
          ${[['Calories', r.total_nutrition.calories], ['Protein', r.total_nutrition.protein], ['Carbs', r.total_nutrition.carbs], ['Fats', r.total_nutrition.fats], ['Fiber', r.total_nutrition.fiber || '—']]
            .map(([l, v]) => `<div class="nutrition-pill"><div class="nutrition-value">${v}</div><div class="nutrition-label">${l}</div></div>`).join('')}
        </div>` : ''}

      ${r.ingredients && r.ingredients.length ? `
        <div class="sec-title">Ingredients & Calorie Breakdown</div>
        <div style="overflow-x:auto;border-radius:12px;border:1px solid var(--light-gray);overflow:hidden;">
          <table class="ing-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Quantity</th>
                <th>Protein</th>
                <th>Carbs</th>
                <th>Fats</th>
                <th>Calories</th>
              </tr>
            </thead>
            <tbody>
              ${r.ingredients.map(ing => `<tr>
                <td><span class="ing-dot"></span>${ing.name}${ing.notes ? `<span style="font-size:11px;color:var(--mid-gray);display:block;margin-left:17px;">${ing.notes}</span>` : ''}</td>
                <td style="color:var(--mid-gray)">${ing.quantity}</td>
                <td style="color:var(--mid-gray)">${ing.protein || '—'}</td>
                <td style="color:var(--mid-gray)">${ing.carbs || '—'}</td>
                <td style="color:var(--mid-gray)">${ing.fats || '—'}</td>
                <td>${ing.calories || '—'} kcal</td>
              </tr>`).join('')}
              <tr class="ing-total">
                <td colspan="2" style="font-weight:600;">Total (1 serving)</td>
                <td style="color:var(--mid-gray)">${r.total_nutrition?.protein || '—'}</td>
                <td style="color:var(--mid-gray)">${r.total_nutrition?.carbs || '—'}</td>
                <td style="color:var(--mid-gray)">${r.total_nutrition?.fats || '—'}</td>
                <td style="color:var(--terracotta);font-weight:600;">${r.total_nutrition?.calories || totalCal} kcal</td>
              </tr>
            </tbody>
          </table>
        </div>` : ''}

      ${r.steps && r.steps.length ? `
        <div class="sec-title">Method (${r.steps.length} Steps)</div>
        <ol class="steps-list">
          ${r.steps.map((s, i) => `<li class="step-item-recipe">
            <div class="step-num">${i + 1}</div>
            <div class="step-text">${s}</div>
          </li>`).join('')}
        </ol>` : ''}

      ${r.health_benefits ? `
        <div class="health-box">
          <h4>🌿 Why This Is Good For You</h4>
          <p>${r.health_benefits}</p>
        </div>` : ''}

      ${r.chef_tips ? `
        <div class="tips-box">
          <h4>👨‍🍳 Chef's Tips</h4>
          <p>${r.chef_tips}</p>
        </div>` : ''}

      ${r.meal_prep_tip ? `
        <div class="tips-box" style="margin-top:12px;">
          <h4>📦 Meal Prep Tip</h4>
          <p>${r.meal_prep_tip}</p>
        </div>` : ''}

      <div style="height:32px;"></div>`;
  },

  async downloadPDF() {
    if (!this.currentRecipe) return;

    const btn = document.querySelector('.btn-download');
    if (btn) {
      btn.textContent = '⏳ Generating PDF...';
      btn.disabled = true;
    }

    try {
      // Build a styled div for PDF capture
      const pdfContainer = document.createElement('div');
      pdfContainer.id = 'pdf-capture';
      pdfContainer.style.cssText = `
        width: 700px;
        padding: 40px;
        background: #FDFAF6;
        font-family: 'DM Sans', Arial, sans-serif;
        color: #2C2C2C;
        position: fixed;
        left: -9999px;
        top: 0;
        z-index: -1;
      `;

      const r = this.currentRecipe;
      const totalCal = r.ingredients
        ? r.ingredients.reduce((s, i) => s + (parseInt(i.calories) || 0), 0)
        : 0;

      pdfContainer.innerHTML = `
        <div style="background:#2C2C2C;border-radius:16px;padding:28px 32px;margin-bottom:24px;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#A8C5AC;margin-bottom:8px;">MealMate Recipe</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:300;color:#FDFAF6;margin-bottom:8px;">${r.name}</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;color:#A8C5AC;font-size:12px;">
            ${r.prep_time ? `<span style="background:rgba(255,255,255,0.08);padding:4px 12px;border-radius:50px;">⏱ Prep: ${r.prep_time}</span>` : ''}
            ${r.cook_time ? `<span style="background:rgba(255,255,255,0.08);padding:4px 12px;border-radius:50px;">🔥 Cook: ${r.cook_time}</span>` : ''}
            ${r.total_time ? `<span style="background:rgba(255,255,255,0.08);padding:4px 12px;border-radius:50px;">⏳ Total: ${r.total_time}</span>` : ''}
            ${r.difficulty ? `<span style="background:rgba(255,255,255,0.08);padding:4px 12px;border-radius:50px;">📋 ${r.difficulty}</span>` : ''}
            ${r.servings ? `<span style="background:rgba(255,255,255,0.08);padding:4px 12px;border-radius:50px;">🍽 Serves: ${r.servings}</span>` : ''}
          </div>
        </div>

        ${r.description ? `<p style="font-size:14px;line-height:1.8;color:#6B6B6B;margin-bottom:20px;">${r.description}</p>` : ''}

        ${r.total_nutrition ? `
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A7050;margin:20px 0 12px;font-weight:500;">Nutritional Summary (Per Serving)</div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;">
            ${[['Calories', r.total_nutrition.calories], ['Protein', r.total_nutrition.protein], ['Carbs', r.total_nutrition.carbs], ['Fats', r.total_nutrition.fats], ['Fiber', r.total_nutrition.fiber || '—']]
              .map(([l, v]) => `<div style="background:#F7F3ED;border:1px solid #E8E4DF;border-radius:10px;padding:12px 8px;text-align:center;">
                <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:600;">${v}</div>
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6B6B6B;margin-top:2px;">${l}</div>
              </div>`).join('')}
          </div>` : ''}

        ${r.ingredients && r.ingredients.length ? `
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A7050;margin:20px 0 12px;font-weight:500;">Ingredients & Calorie Breakdown</div>
          <div style="overflow:hidden;border-radius:12px;border:1px solid #E8E4DF;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="background:#2C2C2C;color:#FDFAF6;padding:10px 14px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;text-align:left;">Ingredient</th>
                  <th style="background:#2C2C2C;color:#FDFAF6;padding:10px 14px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;text-align:left;">Quantity</th>
                  <th style="background:#2C2C2C;color:#FDFAF6;padding:10px 14px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;text-align:right;">Protein</th>
                  <th style="background:#2C2C2C;color:#FDFAF6;padding:10px 14px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;text-align:right;">Carbs</th>
                  <th style="background:#2C2C2C;color:#FDFAF6;padding:10px 14px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;text-align:right;">Fats</th>
                  <th style="background:#2C2C2C;color:#FDFAF6;padding:10px 14px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;text-align:right;">Calories</th>
                </tr>
              </thead>
              <tbody>
                ${r.ingredients.map(ing => `<tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #E8E4DF;font-size:13.5px;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#7A9E7E;margin-right:10px;"></span>${ing.name}
                    ${ing.notes ? `<span style="font-size:11px;color:#6B6B6B;display:block;margin-left:17px;">${ing.notes}</span>` : ''}
                  </td>
                  <td style="padding:10px 14px;border-bottom:1px solid #E8E4DF;font-size:13px;color:#6B6B6B;">${ing.quantity}</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #E8E4DF;font-size:13px;color:#6B6B6B;text-align:right;">${ing.protein || '—'}</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #E8E4DF;font-size:13px;color:#6B6B6B;text-align:right;">${ing.carbs || '—'}</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #E8E4DF;font-size:13px;color:#6B6B6B;text-align:right;">${ing.fats || '—'}</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #E8E4DF;font-size:13px;color:#C87941;font-weight:500;text-align:right;">${ing.calories || '—'} kcal</td>
                </tr>`).join('')}
                <tr>
                  <td colspan="2" style="padding:10px 14px;font-weight:600;border-top:2px solid #2C2C2C;">Total (1 serving)</td>
                  <td style="padding:10px 14px;color:#6B6B6B;border-top:2px solid #2C2C2C;text-align:right;">${r.total_nutrition?.protein || '—'}</td>
                  <td style="padding:10px 14px;color:#6B6B6B;border-top:2px solid #2C2C2C;text-align:right;">${r.total_nutrition?.carbs || '—'}</td>
                  <td style="padding:10px 14px;color:#6B6B6B;border-top:2px solid #2C2C2C;text-align:right;">${r.total_nutrition?.fats || '—'}</td>
                  <td style="padding:10px 14px;color:#C87941;font-weight:600;border-top:2px solid #2C2C2C;text-align:right;">${r.total_nutrition?.calories || totalCal} kcal</td>
                </tr>
              </tbody>
            </table>
          </div>` : ''}

        ${r.steps && r.steps.length ? `
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#4A7050;margin:24px 0 12px;font-weight:500;">Method (${r.steps.length} Steps)</div>
          <ol style="list-style:none;padding:0;">
            ${r.steps.map((s, i) => `<li style="display:flex;gap:16px;margin-bottom:16px;">
              <div style="width:30px;height:30px;border-radius:50%;background:#2C2C2C;color:#FDFAF6;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;font-weight:500;">${i + 1}</div>
              <div style="font-size:14px;line-height:1.8;">${s}</div>
            </li>`).join('')}
          </ol>` : ''}

        ${r.health_benefits ? `
          <div style="background:rgba(122,158,126,0.08);border:1px solid rgba(122,158,126,0.25);border-radius:12px;padding:18px 22px;margin-top:20px;">
            <h4 style="color:#4A7050;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">🌿 Why This Is Good For You</h4>
            <p style="font-size:14px;line-height:1.8;">${r.health_benefits}</p>
          </div>` : ''}

        ${r.chef_tips ? `
          <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:18px 22px;margin-top:12px;">
            <h4 style="color:#9A7A1C;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">👨‍🍳 Chef's Tips</h4>
            <p style="font-size:14px;line-height:1.8;">${r.chef_tips}</p>
          </div>` : ''}

        ${r.meal_prep_tip ? `
          <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:18px 22px;margin-top:12px;">
            <h4 style="color:#9A7A1C;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">📦 Meal Prep Tip</h4>
            <p style="font-size:14px;line-height:1.8;">${r.meal_prep_tip}</p>
          </div>` : ''}

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E8E4DF;font-size:11px;color:#6B6B6B;text-align:center;">
          Generated by MealMate — Your Personal AI Nutritionist
        </div>
      `;

      document.body.appendChild(pdfContainer);

      // Wait for fonts to load
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 200));

      // Capture with html2canvas
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FDFAF6',
        logging: false,
        width: 700,
        windowWidth: 700
      });

      // Remove temp element
      document.body.removeChild(pdfContainer);

      // Create PDF
      const { jsPDF } = window.jspdf;
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 190; // A4 width minus margins in mm
      const pageHeight = 277; // A4 height minus margins in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 10; // top margin

      // First page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add more pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save
      const safeName = r.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      pdf.save(`MealMate_${safeName}.pdf`);

    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }

    if (btn) {
      btn.textContent = '📥 Download PDF';
      btn.disabled = false;
    }
  }
};
