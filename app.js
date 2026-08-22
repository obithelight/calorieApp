/* ==========================================================================
   NutriTrack - Calorie & Macro Tracker JavaScript Logic
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'nutritrack_app_data_v1';

  // Default initial presets
  const PRESETS = [
    { name: 'Oatmeal & Berries 🫐', category: 'breakfast', calories: 320, protein: 12, carbs: 52, fats: 5 },
    { name: 'Eggs & Avocado Toast 🍳', category: 'breakfast', calories: 410, protein: 20, carbs: 34, fats: 21 },
    { name: 'Grilled Chicken Bowl 🥗', category: 'lunch', calories: 540, protein: 46, carbs: 50, fats: 14 },
    { name: 'Salmon & Asparagus 🐟', category: 'dinner', calories: 480, protein: 40, carbs: 10, fats: 28 },
    { name: 'Protein Shake 🥤', category: 'snack', calories: 190, protein: 32, carbs: 5, fats: 3 },
    { name: 'Apple & Almonds 🍏', category: 'snack', calories: 210, protein: 5, carbs: 26, fats: 11 },
    { name: 'Greek Yogurt & Honey 🥣', category: 'snack', calories: 230, protein: 18, carbs: 24, fats: 4 }
  ];

  // Default App State
  let state = {
    selectedDate: getTodayISO(),
    goals: {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fats: 67
    },
    logs: {}, // Format: { 'YYYY-MM-DD': [ { id, name, category, calories, protein, carbs, fats }, ... ] }
    activeFilter: 'all',
    searchQuery: ''
  };

  // DOM Elements
  const DOM = {
    dateLabel: document.getElementById('date-display-label'),
    datePickerInput: document.getElementById('date-picker-input'),
    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    todayBtn: document.getElementById('today-btn'),

    // Dashboard Stat Elements
    consumedCaloriesNum: document.getElementById('consumed-calories-num'),
    targetCaloriesNum: document.getElementById('target-calories-num'),
    remainingCaloriesNum: document.getElementById('remaining-calories-num'),
    calorieStatusTag: document.getElementById('calorie-status-tag'),
    calorieRingProgress: document.getElementById('calorie-ring-progress'),
    calorieProgressBar: document.getElementById('calorie-progress-bar'),
    progressPercentLabel: document.getElementById('progress-percent-label'),
    progressTargetLabel: document.getElementById('progress-target-label'),

    // Macro Elements
    proteinConsumed: document.getElementById('protein-consumed'),
    proteinTarget: document.getElementById('protein-target'),
    proteinBar: document.getElementById('protein-bar'),

    carbsConsumed: document.getElementById('carbs-consumed'),
    carbsTarget: document.getElementById('carbs-target'),
    carbsBar: document.getElementById('carbs-bar'),

    fatsConsumed: document.getElementById('fats-consumed'),
    fatsTarget: document.getElementById('fats-target'),
    fatsBar: document.getElementById('fats-bar'),

    // Category Breakdowns
    catBreakfastKcal: document.getElementById('cat-breakfast-kcal'),
    catLunchKcal: document.getElementById('cat-lunch-kcal'),
    catDinnerKcal: document.getElementById('cat-dinner-kcal'),
    catSnackKcal: document.getElementById('cat-snack-kcal'),

    // Action Section & Log
    presetsList: document.getElementById('presets-list'),
    openFoodModalBtn: document.getElementById('open-food-modal-btn'),
    searchInput: document.getElementById('search-input'),
    filterTabs: document.getElementById('filter-tabs'),
    foodLogList: document.getElementById('food-log-list'),
    emptyState: document.getElementById('empty-state'),
    clearDataBtn: document.getElementById('clear-data-btn'),

    // Food Modal
    foodModal: document.getElementById('food-modal'),
    foodModalTitle: document.getElementById('food-modal-title'),
    closeFoodModalBtn: document.getElementById('close-food-modal-btn'),
    cancelFoodModalBtn: document.getElementById('cancel-food-modal-btn'),
    foodForm: document.getElementById('food-form'),
    foodIdInput: document.getElementById('food-id-input'),
    foodNameInput: document.getElementById('food-name-input'),
    mealTypeSelect: document.getElementById('meal-type-select'),
    caloriesInput: document.getElementById('calories-input'),
    proteinInput: document.getElementById('protein-input'),
    carbsInput: document.getElementById('carbs-input'),
    fatsInput: document.getElementById('fats-input'),

    // Goals Modal
    openGoalsBtn: document.getElementById('open-goals-btn'),
    goalsModal: document.getElementById('goals-modal'),
    closeGoalsModalBtn: document.getElementById('close-goals-modal-btn'),
    cancelGoalsModalBtn: document.getElementById('cancel-goals-modal-btn'),
    goalsForm: document.getElementById('goals-form'),
    targetCalorieInput: document.getElementById('target-calorie-input'),
    targetProteinInput: document.getElementById('target-protein-input'),
    targetCarbsInput: document.getElementById('target-carbs-input'),
    targetFatsInput: document.getElementById('target-fats-input')
  };

  // Helper Date Functions
  function getTodayISO() {
    const today = new Date();
    return formatDateToISO(today);
  }

  function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(dateStr) {
    const todayISO = getTodayISO();
    if (dateStr === todayISO) return 'Today';

    const dateObj = new Date(dateStr + 'T00:00:00');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === formatDateToISO(yesterday)) return 'Yesterday';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === formatDateToISO(tomorrow)) return 'Tomorrow';

    return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Storage Persistence Functions
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.goals = parsed.goals || state.goals;
        state.logs = parsed.logs || state.logs;
      } else {
        // Seed default sample data for today if brand new user
        seedInitialSampleData();
      }
    } catch (e) {
      console.error('Error loading state from localStorage', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        goals: state.goals,
        logs: state.logs
      }));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }

  function seedInitialSampleData() {
    const todayISO = getTodayISO();
    state.logs[todayISO] = [
      { id: 'seed-1', name: 'Oatmeal & Berries 🫐', category: 'breakfast', calories: 320, protein: 12, carbs: 52, fats: 5 },
      { id: 'seed-2', name: 'Grilled Chicken Bowl 🥗', category: 'lunch', calories: 540, protein: 46, carbs: 50, fats: 14 }
    ];
    saveState();
  }

  // Calculation Logic
  function getDailySummary(dateStr) {
    const dayLogs = state.logs[dateStr] || [];
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;
    const categoryTotals = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };

    dayLogs.forEach(item => {
      const cal = Number(item.calories) || 0;
      const p = Number(item.protein) || 0;
      const c = Number(item.carbs) || 0;
      const f = Number(item.fats) || 0;

      calories += cal;
      protein += p;
      carbs += c;
      fats += f;

      if (categoryTotals[item.category] !== undefined) {
        categoryTotals[item.category] += cal;
      }
    });

    return { calories, protein, carbs, fats, categoryTotals };
  }

  // Render Functions
  function renderApp() {
    updateDateDisplay();
    renderDashboard();
    renderPresets();
    renderFoodLogs();
  }

  function updateDateDisplay() {
    DOM.dateLabel.textContent = formatDisplayDate(state.selectedDate);
    DOM.datePickerInput.value = state.selectedDate;
  }

  function renderDashboard() {
    const summary = getDailySummary(state.selectedDate);
    const goals = state.goals;

    // Calories calculation
    const eaten = summary.calories;
    const remaining = goals.calories - eaten;
    const percentUsed = goals.calories > 0 ? Math.min(Math.round((eaten / goals.calories) * 100), 999) : 0;

    DOM.consumedCaloriesNum.textContent = eaten.toLocaleString();
    DOM.targetCaloriesNum.textContent = goals.calories.toLocaleString();
    DOM.progressTargetLabel.textContent = `${goals.calories.toLocaleString()} kcal`;
    DOM.progressPercentLabel.textContent = `${percentUsed}% of goal`;

    if (remaining >= 0) {
      DOM.remainingCaloriesNum.textContent = remaining.toLocaleString();
      DOM.remainingCaloriesNum.className = 'stat-value highlight-green';
    } else {
      DOM.remainingCaloriesNum.textContent = `+${Math.abs(remaining).toLocaleString()}`;
      DOM.remainingCaloriesNum.className = 'stat-value highlight-red';
    }

    // Status Badge
    if (eaten === 0) {
      DOM.calorieStatusTag.textContent = 'No Log Yet';
      DOM.calorieStatusTag.className = 'status-badge status-good';
    } else if (remaining < 0) {
      DOM.calorieStatusTag.textContent = 'Over Budget';
      DOM.calorieStatusTag.className = 'status-badge status-over';
    } else if (remaining <= 300) {
      DOM.calorieStatusTag.textContent = 'Near Target';
      DOM.calorieStatusTag.className = 'status-badge status-warning';
    } else {
      DOM.calorieStatusTag.textContent = 'On Track';
      DOM.calorieStatusTag.className = 'status-badge status-good';
    }

    // Circular SVG Progress Ring calculation
    const circumference = 471; // 2 * PI * 75 = 471.24
    const clampedProgress = Math.min(eaten / goals.calories, 1);
    const dashoffset = circumference * (1 - clampedProgress);
    DOM.calorieRingProgress.style.strokeDashoffset = dashoffset;

    if (remaining < 0) {
      DOM.calorieRingProgress.style.stroke = '#f43f5e';
    } else {
      DOM.calorieRingProgress.style.stroke = '#10b981';
    }

    // Linear Progress Fill
    const linearPercent = Math.min((eaten / goals.calories) * 100, 100);
    DOM.calorieProgressBar.style.width = `${linearPercent}%`;
    if (remaining < 0) {
      DOM.calorieProgressBar.style.background = 'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)';
    } else {
      DOM.calorieProgressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
    }

    // Macros Rendering
    DOM.proteinConsumed.textContent = `${summary.protein}g`;
    DOM.proteinTarget.textContent = `${goals.protein}g`;
    DOM.proteinBar.style.width = `${Math.min((summary.protein / goals.protein) * 100, 100)}%`;

    DOM.carbsConsumed.textContent = `${summary.carbs}g`;
    DOM.carbsTarget.textContent = `${goals.carbs}g`;
    DOM.carbsBar.style.width = `${Math.min((summary.carbs / goals.carbs) * 100, 100)}%`;

    DOM.fatsConsumed.textContent = `${summary.fats}g`;
    DOM.fatsTarget.textContent = `${goals.fats}g`;
    DOM.fatsBar.style.width = `${Math.min((summary.fats / goals.fats) * 100, 100)}%`;

    // Category Breakdown Rendering
    DOM.catBreakfastKcal.textContent = `${summary.categoryTotals.breakfast} kcal`;
    DOM.catLunchKcal.textContent = `${summary.categoryTotals.lunch} kcal`;
    DOM.catDinnerKcal.textContent = `${summary.categoryTotals.dinner} kcal`;
    DOM.catSnackKcal.textContent = `${summary.categoryTotals.snack} kcal`;
  }

  function renderPresets() {
    DOM.presetsList.innerHTML = '';
    PRESETS.forEach(preset => {
      const chip = document.createElement('button');
      chip.className = 'preset-chip';
      chip.type = 'button';
      chip.innerHTML = `
        <span>${preset.name}</span>
        <span class="preset-kcal">${preset.calories} kcal</span>
      `;
      chip.addEventListener('click', () => {
        addFoodItem({
          name: preset.name,
          category: preset.category,
          calories: preset.calories,
          protein: preset.protein,
          carbs: preset.carbs,
          fats: preset.fats
        });
      });
      DOM.presetsList.appendChild(chip);
    });
  }

  function getCategoryEmoji(category) {
    switch (category) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🍗';
      case 'snack': return '🍏';
      default: return '🍴';
    }
  }

  function renderFoodLogs() {
    const dayLogs = state.logs[state.selectedDate] || [];

    // Filter by category and search query
    const filtered = dayLogs.filter(item => {
      const matchesFilter = state.activeFilter === 'all' || item.category === state.activeFilter;
      const matchesSearch = item.name.toLowerCase().includes(state.searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    DOM.foodLogList.innerHTML = '';

    if (filtered.length === 0) {
      DOM.emptyState.classList.remove('hidden');
    } else {
      DOM.emptyState.classList.add('hidden');

      filtered.forEach(item => {
        const row = document.createElement('div');
        row.className = 'food-item-row';
        row.innerHTML = `
          <div class="food-item-main">
            <div class="category-icon-badge">${getCategoryEmoji(item.category)}</div>
            <div class="food-details">
              <h4>${escapeHTML(item.name)}</h4>
              <div class="food-meta">
                <span style="text-transform: capitalize;">${item.category}</span>
                ${item.protein ? `<span class="meta-pill meta-protein">P: ${item.protein}g</span>` : ''}
                ${item.carbs ? `<span class="meta-pill meta-carbs">C: ${item.carbs}g</span>` : ''}
                ${item.fats ? `<span class="meta-pill meta-fats">F: ${item.fats}g</span>` : ''}
              </div>
            </div>
          </div>
          <div class="food-item-right">
            <div class="food-calories">${item.calories} <span>kcal</span></div>
            <button class="delete-btn" title="Delete Entry" data-id="${item.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;

        row.querySelector('.delete-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteFoodItem(item.id);
        });

        DOM.foodLogList.appendChild(row);
      });
    }
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Data Mutation Functions
  function addFoodItem(foodData) {
    const dateStr = state.selectedDate;
    if (!state.logs[dateStr]) {
      state.logs[dateStr] = [];
    }

    const newItem = {
      id: foodData.id || 'food_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: foodData.name,
      category: foodData.category,
      calories: Number(foodData.calories),
      protein: Number(foodData.protein) || 0,
      carbs: Number(foodData.carbs) || 0,
      fats: Number(foodData.fats) || 0
    };

    state.logs[dateStr].unshift(newItem);
    saveState();
    renderApp();
  }

  function deleteFoodItem(id) {
    const dateStr = state.selectedDate;
    if (state.logs[dateStr]) {
      state.logs[dateStr] = state.logs[dateStr].filter(item => item.id !== id);
      saveState();
      renderApp();
    }
  }

  // Event Listeners Setup
  function initEventListeners() {
    // Date Switchers
    DOM.prevDayBtn.addEventListener('click', () => {
      const curDate = new Date(state.selectedDate + 'T00:00:00');
      curDate.setDate(curDate.getDate() - 1);
      state.selectedDate = formatDateToISO(curDate);
      renderApp();
    });

    DOM.nextDayBtn.addEventListener('click', () => {
      const curDate = new Date(state.selectedDate + 'T00:00:00');
      curDate.setDate(curDate.getDate() + 1);
      state.selectedDate = formatDateToISO(curDate);
      renderApp();
    });

    DOM.todayBtn.addEventListener('click', () => {
      state.selectedDate = getTodayISO();
      renderApp();
    });

    DOM.datePickerInput.addEventListener('change', (e) => {
      if (e.target.value) {
        state.selectedDate = e.target.value;
        renderApp();
      }
    });

    // Search and Filter
    DOM.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderFoodLogs();
    });

    DOM.filterTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        const filter = e.target.getAttribute('data-filter');
        state.activeFilter = filter;

        DOM.filterTabs.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        renderFoodLogs();
      }
    });

    // Custom Food Modal Trigger & Form Submit
    DOM.openFoodModalBtn.addEventListener('click', () => {
      DOM.foodForm.reset();
      DOM.foodIdInput.value = '';
      DOM.foodModalTitle.textContent = 'Log Food Item';
      DOM.foodModal.showModal();
    });

    DOM.closeFoodModalBtn.addEventListener('click', () => DOM.foodModal.close());
    DOM.cancelFoodModalBtn.addEventListener('click', () => DOM.foodModal.close());

    DOM.foodForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = DOM.foodNameInput.value.trim();
      const category = DOM.mealTypeSelect.value;
      const calories = Number(DOM.caloriesInput.value);
      const protein = Number(DOM.proteinInput.value) || 0;
      const carbs = Number(DOM.carbsInput.value) || 0;
      const fats = Number(DOM.fatsInput.value) || 0;

      if (!name || isNaN(calories) || calories < 0) return;

      addFoodItem({ name, category, calories, protein, carbs, fats });
      DOM.foodModal.close();
    });

    // Goal Settings Modal Trigger & Form Submit
    DOM.openGoalsBtn.addEventListener('click', () => {
      DOM.targetCalorieInput.value = state.goals.calories;
      DOM.targetProteinInput.value = state.goals.protein;
      DOM.targetCarbsInput.value = state.goals.carbs;
      DOM.targetFatsInput.value = state.goals.fats;
      DOM.goalsModal.showModal();
    });

    DOM.closeGoalsModalBtn.addEventListener('click', () => DOM.goalsModal.close());
    DOM.cancelGoalsModalBtn.addEventListener('click', () => DOM.goalsModal.close());

    DOM.goalsForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const calories = Number(DOM.targetCalorieInput.value);
      const protein = Number(DOM.targetProteinInput.value);
      const carbs = Number(DOM.targetCarbsInput.value);
      const fats = Number(DOM.targetFatsInput.value);

      if (calories > 0 && protein >= 0 && carbs >= 0 && fats >= 0) {
        state.goals = { calories, protein, carbs, fats };
        saveState();
        renderApp();
        DOM.goalsModal.close();
      }
    });

    // Reset All Data
    DOM.clearDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all log history and custom goals? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        state.goals = { calories: 2000, protein: 150, carbs: 200, fats: 67 };
        state.logs = {};
        seedInitialSampleData();
        renderApp();
      }
    });
  }

  // App Initialization
  function init() {
    loadState();
    initEventListeners();
    renderApp();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
