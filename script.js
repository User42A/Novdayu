const STORAGE_KEY = "nova_day_training_upgrade_v2";
function uid() { return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9); }
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}
function normalizeNumber(value) {
  return Number(String(value || "0").replace(",", ".")) || 0;
}

const RECIPE_CATEGORY_ORDER = ["fruehstueck", "mittag", "abend", "snacks", "shakes"];
const RECIPE_CATEGORY_LABELS = {
  fruehstueck: "Frühstück",
  mittag: "Mittagessen",
  abend: "Abendessen",
  snacks: "Snacks",
  shakes: "Shakes"
};

const today = new Date();
const todayISO = toISO(today);

const defaults = {
  routine: [
    { id: uid(), title: "Morgenroutine", note: "Aufstehen, waschen, ready machen", time: "06:00", done: false },
    { id: uid(), title: "Abendroutine", note: "Duschen, Supplements, schlafen", time: "22:00", done: false }
  ],
  calendar: [
    { id: uid(), title: "Gym", note: "Push Day", time: "18:00", date: todayISO, done: false }
  ],
  habits: [
    { id: uid(), title: "2L Wasser", note: "Über den Tag verteilt", time: "", done: false },
    { id: uid(), title: "Workout", note: "Gym oder Cardio", time: "18:00", done: false }
  ],
  meals: [
    { id: uid(), title: "Frühstück", note: "Protein + Quark + Cornflakes", time: "06:00", done: false },
    { id: uid(), title: "Mittagessen", note: "Reis + Fleisch", time: "12:00", done: false }
  ],
  recipes: {
    activeCategory: "fruehstueck",
    categories: {
      fruehstueck: [],
      mittag: [],
      abend: [],
      snacks: [],
      shakes: []
    }
  },
  supplements: [
    { id: uid(), title: "Kreatin", note: "5 g", time: "vor Training", done: false },
    { id: uid(), title: "Magnesium", note: "1 Portion", time: "abends", done: false }
  ],
  schedule: [
    { id: uid(), title: "Arbeit / Schule", note: "Fokusblock", time: "08:00 - 12:00", done: false }
  ],
  checklist: [
    { id: uid(), title: "Zimmer aufräumen", note: "10 Minuten", time: "", done: false }
  ],
  training: {
    activeDayId: "day-1",
    days: [
      {
        id: "day-1",
        name: "Push Day",
        exercises: [
          { id: uid(), name: "Bankdrücken", weight: 80, sets: 4, reps: 8, notes: "Sauber und kontrolliert", done: false },
          { id: uid(), name: "Schrägbank", weight: 32, sets: 3, reps: 10, notes: "Kurzhanteln", done: false },
          { id: uid(), name: "Seitheben", weight: 12, sets: 3, reps: 15, notes: "Strict", done: false }
        ]
      },
      {
        id: "day-2",
        name: "Pull Day",
        exercises: [
          { id: uid(), name: "Rücken", weight: 70, sets: 4, reps: 10, notes: "Lat Fokus", done: false }
        ]
      },
      {
        id: "day-3",
        name: "Leg Day",
        exercises: []
      }
    ]
  }
};

let state = loadState();
let currentSection = "dashboard";
let editType = null;
let editId = null;
let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = todayISO;
let editingExerciseDayId = null;
let editingExerciseId = null;
let editingRecipeCategory = null;
let editingRecipeId = null;

const sidePanel = document.getElementById("sidePanel");
const backdrop = document.getElementById("backdrop");
const screenTitle = document.getElementById("screenTitle");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const entryForm = document.getElementById("entryForm");
const fieldTitle = document.getElementById("fieldTitle");
const fieldTime = document.getElementById("fieldTime");
const fieldDate = document.getElementById("fieldDate");
const fieldNote = document.getElementById("fieldNote");
const dateLabel = document.getElementById("dateLabel");
const progressText = document.getElementById("progressText");
const heroCard = document.getElementById("heroCard");
const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");
const calendarEventList = document.getElementById("calendarEventList");
const trainingDaysEl = document.getElementById("trainingDays");
const trainingExerciseListEl = document.getElementById("trainingExerciseList");
const activeTrainingDayTitle = document.getElementById("activeTrainingDayTitle");
const activeTrainingDayProgressText = document.getElementById("activeTrainingDayProgressText");

const recipeCategoriesEl = document.getElementById("recipeCategories");
const activeRecipeCategoryTitle = document.getElementById("activeRecipeCategoryTitle");
const recipeCountPill = document.getElementById("recipeCountPill");
const recipesList = document.getElementById("recipesList");
const recipeModal = document.getElementById("recipeModal");
const recipeModalTitle = document.getElementById("recipeModalTitle");
const recipeForm = document.getElementById("recipeForm");
const recipeCategory = document.getElementById("recipeCategory");
const recipeName = document.getElementById("recipeName");
const recipeCalories = document.getElementById("recipeCalories");
const recipeProtein = document.getElementById("recipeProtein");
const recipeCarbs = document.getElementById("recipeCarbs");
const recipeFat = document.getElementById("recipeFat");
const recipeIngredients = document.getElementById("recipeIngredients");
const recipePreparation = document.getElementById("recipePreparation");

const trainingModal = document.getElementById("trainingModal");
const trainingModalTitle = document.getElementById("trainingModalTitle");
const trainingForm = document.getElementById("trainingForm");
const exerciseName = document.getElementById("exerciseName");
const exerciseWeight = document.getElementById("exerciseWeight");
const exerciseSets = document.getElementById("exerciseSets");
const exerciseReps = document.getElementById("exerciseReps");
const exerciseNotes = document.getElementById("exerciseNotes");

const listEls = {
  routine: document.getElementById("routineList"),
  habits: document.getElementById("habitsList"),
  meals: document.getElementById("mealsList"),
  supplements: document.getElementById("supplementsList"),
  schedule: document.getElementById("scheduleList"),
  checklist: document.getElementById("checklistList")
};

function ensureRecipesShape(target) {
  if (!target.recipes || typeof target.recipes !== "object") target.recipes = clone(defaults.recipes);
  if (!target.recipes.categories || typeof target.recipes.categories !== "object") target.recipes.categories = clone(defaults.recipes.categories);
  RECIPE_CATEGORY_ORDER.forEach(key => {
    if (!Array.isArray(target.recipes.categories[key])) target.recipes.categories[key] = [];
  });
  if (!target.recipes.activeCategory || !RECIPE_CATEGORY_ORDER.includes(target.recipes.activeCategory)) {
    target.recipes.activeCategory = RECIPE_CATEGORY_ORDER[0];
  }
  if (!Array.isArray(target.recipes.expandedIds)) target.recipes.expandedIds = [];
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("nova_day_training_upgrade_v1");
    if (!raw) return clone(defaults);
    const parsed = JSON.parse(raw);
    if (!parsed.training) parsed.training = clone(defaults.training);
    if (!parsed.training.days || !parsed.training.days.length) parsed.training = clone(defaults.training);
    const hasActiveDay = parsed.training.days.some(day => day.id === parsed.training.activeDayId);
    if (!parsed.training.activeDayId || !hasActiveDay) parsed.training.activeDayId = parsed.training.days[0].id;
    ensureRecipesShape(parsed);
    return parsed;
  } catch {
    return clone(defaults);
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function openMenu(show) {
  sidePanel.classList.toggle("open", show);
  backdrop.classList.toggle("hidden", !show);
  document.querySelector(".app").classList.toggle("menu-open", show);
}
function titleFor(section) {
  return {
    dashboard: "Dashboard",
    training: "Training",
    routine: "Routine",
    calendar: "Kalender",
    habits: "Habits",
    meals: "Mahlzeiten",
    recipes: "Rezepte",
    supplements: "Supplements",
    schedule: "Tagesplan",
    checklist: "Checkliste"
  }[section] || "Dashboard";
}
function switchSection(section) {
  currentSection = section;
  screenTitle.textContent = titleFor(section);
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("visible"));
  const activeScreen = document.querySelector('.screen[data-screen="' + section + '"]');
  if (activeScreen) activeScreen.classList.add("visible");
  heroCard.classList.toggle("hidden", section !== "dashboard");
  document.querySelectorAll(".menu-item, .bottom-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });
  openMenu(false);
}

function openModal(type, item) {
  editType = type;
  editId = item ? item.id : null;
  modalTitle.textContent = item ? "Eintrag bearbeiten" : "Eintrag hinzufügen";
  fieldTitle.value = item ? item.title : "";
  fieldTime.value = item ? item.time : "";
  fieldNote.value = item ? item.note : "";
  fieldDate.value = item && item.date ? item.date : selectedDate;
  dateLabel.classList.toggle("hidden", type !== "calendar");
  modal.classList.remove("hidden");
  fieldTitle.focus();
}
function closeModal() {
  modal.classList.add("hidden");
  entryForm.reset();
  editType = null;
  editId = null;
}

function openTrainingModal(dayId, exercise) {
  editingExerciseDayId = dayId;
  editingExerciseId = exercise ? exercise.id : null;
  trainingModalTitle.textContent = exercise ? "Exercise bearbeiten" : "Exercise hinzufügen";
  exerciseName.value = exercise ? exercise.name : "";
  exerciseWeight.value = exercise ? exercise.weight : "";
  exerciseSets.value = exercise ? exercise.sets : "";
  exerciseReps.value = exercise ? exercise.reps : "";
  exerciseNotes.value = exercise ? exercise.notes : "";
  trainingModal.classList.remove("hidden");
  exerciseName.focus();
}
function closeTrainingModal() {
  trainingModal.classList.add("hidden");
  trainingForm.reset();
  editingExerciseDayId = null;
  editingExerciseId = null;
}

function fillRecipeCategorySelect() {
  recipeCategory.innerHTML = RECIPE_CATEGORY_ORDER
    .map(key => `<option value="${key}">${RECIPE_CATEGORY_LABELS[key]}</option>`)
    .join("");
}
function openRecipeModal(categoryKey, recipe) {
  editingRecipeCategory = recipe ? categoryKey : (categoryKey || state.recipes.activeCategory);
  editingRecipeId = recipe ? recipe.id : null;
  recipeModalTitle.textContent = recipe ? "Rezept bearbeiten" : "Rezept hinzufügen";
  recipeCategory.value = editingRecipeCategory;
  recipeName.value = recipe ? recipe.name : "";
  recipeCalories.value = recipe ? recipe.calories : "";
  recipeProtein.value = recipe ? recipe.protein : "";
  recipeCarbs.value = recipe ? recipe.carbs : "";
  recipeFat.value = recipe ? recipe.fat : "";
  recipeIngredients.value = recipe ? recipe.ingredients : "";
  recipePreparation.value = recipe ? recipe.preparation : "";
  recipeModal.classList.remove("hidden");
  recipeName.focus();
}
function closeRecipeModal() {
  recipeModal.classList.add("hidden");
  recipeForm.reset();
  editingRecipeCategory = null;
  editingRecipeId = null;
  recipeCategory.value = state.recipes.activeCategory;
}
function upsertRecipe(payload) {
  const categoryKey = payload.category;
  if (!RECIPE_CATEGORY_ORDER.includes(categoryKey) || !payload.name.trim()) return;
  ensureRecipesShape(state);

  if (editingRecipeId && editingRecipeCategory) {
    const oldList = state.recipes.categories[editingRecipeCategory];
    const idx = oldList.findIndex(item => item.id === editingRecipeId);
    if (idx >= 0) {
      const updated = {
        ...oldList[idx],
        category: categoryKey,
        name: payload.name.trim(),
        calories: normalizeNumber(payload.calories),
        protein: normalizeNumber(payload.protein),
        carbs: normalizeNumber(payload.carbs),
        fat: normalizeNumber(payload.fat),
        ingredients: payload.ingredients.trim(),
        preparation: payload.preparation.trim()
      };
      oldList.splice(idx, 1);
      state.recipes.categories[categoryKey].unshift(updated);
    }
  } else {
    state.recipes.categories[categoryKey].unshift({
      id: uid(),
      category: categoryKey,
      name: payload.name.trim(),
      calories: normalizeNumber(payload.calories),
      protein: normalizeNumber(payload.protein),
      carbs: normalizeNumber(payload.carbs),
      fat: normalizeNumber(payload.fat),
      ingredients: payload.ingredients.trim(),
      preparation: payload.preparation.trim()
    });
  }

  state.recipes.activeCategory = categoryKey;
}
function deleteRecipe(categoryKey, recipeId) {
  if (!state.recipes.categories[categoryKey]) return;
  state.recipes.categories[categoryKey] = state.recipes.categories[categoryKey].filter(item => item.id !== recipeId);
}
function findRecipe(categoryKey, recipeId) {
  return (state.recipes.categories[categoryKey] || []).find(item => item.id === recipeId) || null;
}
function recipeCount(categoryKey) {
  return (state.recipes.categories[categoryKey] || []).length;
}
function isRecipeExpanded(recipeId) {
  return state.recipes.expandedIds.includes(recipeId);
}
function toggleRecipeExpanded(recipeId) {
  ensureRecipesShape(state);
  if (isRecipeExpanded(recipeId)) {
    state.recipes.expandedIds = state.recipes.expandedIds.filter(id => id !== recipeId);
  } else {
    state.recipes.expandedIds.push(recipeId);
  }
}
function totalRecipeCount() {
  return RECIPE_CATEGORY_ORDER.reduce((sum, key) => sum + recipeCount(key), 0);
}
function formatMacro(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
}
function recipeCardHtml(recipe, categoryKey) {
  const expanded = isRecipeExpanded(recipe.id);
  return `
    <article class="recipe-card glass-soft ${expanded ? "expanded" : "collapsed"}">
      <div class="recipe-card-head">
        <button type="button" class="recipe-toggle" data-recipe-action="toggle" data-category="${categoryKey}" data-id="${recipe.id}" aria-expanded="${expanded}">
          <div>
            <h4>${esc(recipe.name)}</h4>
            <div class="meta">
              <span class="pill">${esc(RECIPE_CATEGORY_LABELS[categoryKey])}</span>
            </div>
          </div>
          <span class="recipe-chevron">${expanded ? "⌄" : "›"}</span>
        </button>
        <div class="recipe-actions">
          <button type="button" class="text-btn" data-recipe-action="edit" data-category="${categoryKey}" data-id="${recipe.id}">Edit</button>
          <button type="button" class="text-btn delete" data-recipe-action="delete" data-category="${categoryKey}" data-id="${recipe.id}">Löschen</button>
        </div>
      </div>

      <div class="recipe-content ${expanded ? "" : "hidden"}">
        <div class="recipe-meta-grid">
          <div class="recipe-macro"><span>KALORIEN</span><strong>${formatMacro(recipe.calories)}</strong></div>
          <div class="recipe-macro"><span>PROTEIN</span><strong>${formatMacro(recipe.protein)} g</strong></div>
          <div class="recipe-macro"><span>CARBS</span><strong>${formatMacro(recipe.carbs)} g</strong></div>
          <div class="recipe-macro"><span>FETT</span><strong>${formatMacro(recipe.fat)} g</strong></div>
        </div>

        <div class="recipe-text-block">
          <h5>Zutaten</h5>
          <p>${esc(recipe.ingredients || "Keine Zutaten eingetragen.")}</p>
        </div>

        <div class="recipe-text-block">
          <h5>Zubereitung</h5>
          <p>${esc(recipe.preparation || "Keine Zubereitung eingetragen.")}</p>
        </div>
      </div>
    </article>
  `;
}

function upsertItem(type, payload) {
  if (!payload.title.trim()) return;
  if (editId) {
    const idx = state[type].findIndex(item => item.id === editId);
    if (idx >= 0) {
      state[type][idx] = {
        ...state[type][idx],
        title: payload.title.trim(),
        time: payload.time.trim(),
        note: payload.note.trim(),
        ...(type === "calendar" ? { date: payload.date || selectedDate } : {})
      };
    }
  } else {
    state[type].unshift({
      id: uid(),
      title: payload.title.trim(),
      time: payload.time.trim(),
      note: payload.note.trim(),
      done: false,
      ...(type === "calendar" ? { date: payload.date || selectedDate } : {})
    });
  }
}

function getActiveTrainingDay() {
  return state.training.days.find(day => day.id === state.training.activeDayId) || state.training.days[0];
}
function getDayProgress(day) {
  const total = day.exercises.length || 1;
  const done = day.exercises.filter(ex => ex.done).length;
  const percent = day.exercises.length ? Math.round((done / total) * 100) : 0;
  return { total: day.exercises.length, done, percent };
}
function getTodayTraining() {
  return getActiveTrainingDay() || { name: "Kein Plan", exercises: [] };
}
function upsertExercise(dayId, payload) {
  const day = state.training.days.find(d => d.id === dayId);
  if (!day || !payload.name.trim()) return;
  if (editingExerciseId) {
    const idx = day.exercises.findIndex(ex => ex.id === editingExerciseId);
    if (idx >= 0) {
      day.exercises[idx] = {
        ...day.exercises[idx],
        name: payload.name.trim(),
        weight: Number(payload.weight || 0),
        sets: Number(payload.sets || 0),
        reps: Number(payload.reps || 0),
        notes: payload.notes.trim()
      };
    }
  } else {
    day.exercises.push({
      id: uid(),
      name: payload.name.trim(),
      weight: Number(payload.weight || 0),
      sets: Number(payload.sets || 0),
      reps: Number(payload.reps || 0),
      notes: payload.notes.trim(),
      done: false
    });
  }
}
function addTrainingDay() {
  const number = state.training.days.length + 1;
  const newDay = { id: "day-" + uid(), name: "Day " + number, exercises: [] };
  state.training.days.push(newDay);
  state.training.activeDayId = newDay.id;
  saveState();
  renderAll();
}
function deleteTrainingDay(dayId) {
  if (state.training.days.length <= 1) return;
  const day = state.training.days.find(item => item.id === dayId);
  if (!day) return;
  const shouldDelete = confirm(`Willst du "${day.name}" wirklich löschen?`);
  if (!shouldDelete) return;
  state.training.days = state.training.days.filter(day => day.id !== dayId);
  if (state.training.activeDayId === dayId) {
    state.training.activeDayId = state.training.days[0].id;
  }
  saveState();
  renderAll();
}
function moveExercise(dayId, exerciseId, direction) {
  const day = state.training.days.find(d => d.id === dayId);
  if (!day) return;
  const idx = day.exercises.findIndex(ex => ex.id === exerciseId);
  if (idx < 0) return;
  const nextIdx = idx + direction;
  if (nextIdx < 0 || nextIdx >= day.exercises.length) return;
  const [item] = day.exercises.splice(idx, 1);
  day.exercises.splice(nextIdx, 0, item);
  saveState();
  renderAll();
}

function labelFor(type) {
  return {
    routine: "Routine",
    habits: "Habit",
    meals: "Meal",
    supplements: "Supp",
    schedule: "Plan",
    checklist: "Task",
    calendar: "Termin"
  }[type];
}
function cardHtml(item, type) {
  return `
    <article class="item glass-soft">
      <button type="button" class="check-btn ${item.done ? "done" : ""}" data-action="toggle" data-type="${type}" data-id="${item.id}">
        ${item.done ? "✓" : ""}
      </button>
      <div>
        <h4 class="${item.done ? "done" : ""}">${esc(item.title)}</h4>
        <p>${esc(item.note)}</p>
        <div class="meta">
          ${item.time ? `<span class="pill">${esc(item.time)}</span>` : ""}
          ${item.date ? `<span class="pill">${esc(item.date)}</span>` : ""}
          <span class="pill">${labelFor(type)}</span>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="text-btn" data-action="edit" data-type="${type}" data-id="${item.id}">Edit</button>
        <button type="button" class="text-btn delete" data-action="delete" data-type="${type}" data-id="${item.id}">Löschen</button>
      </div>
    </article>
  `;
}
function exerciseHtml(dayId, ex, idx, total) {
  return `
    <article class="exercise-card">
      <div class="exercise-top">
        <div class="exercise-left">
          <button type="button" class="exercise-check ${ex.done ? "done" : ""}" data-training-action="toggle-exercise" data-day-id="${dayId}" data-exercise-id="${ex.id}">${ex.done ? "✓" : ""}</button>
          <div>
            <div class="exercise-name">${esc(ex.name)}</div>
            <div class="muted-copy">${esc(ex.notes || "")}</div>
          </div>
        </div>
        <div class="exercise-actions">
          <button type="button" class="icon-mini" data-training-action="edit-exercise" data-day-id="${dayId}" data-exercise-id="${ex.id}">✎</button>
          <button type="button" class="icon-mini" data-training-action="move-up" data-day-id="${dayId}" data-exercise-id="${ex.id}" ${idx === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="icon-mini" data-training-action="move-down" data-day-id="${dayId}" data-exercise-id="${ex.id}" ${idx === total - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="icon-mini" data-training-action="delete-exercise" data-day-id="${dayId}" data-exercise-id="${ex.id}">🗑</button>
        </div>
      </div>
      <div class="exercise-grid">
        <div class="exercise-field"><span>WEIGHT (KG)</span><strong>${ex.weight}</strong></div>
        <div class="exercise-field"><span>SETS</span><strong>${ex.sets}</strong></div>
        <div class="exercise-field"><span>REPS</span><strong>${ex.reps}</strong></div>
        <div class="exercise-field hidden">
          <svg viewBox="0 0 36 36">
            <circle class="exercise-progress-bg" cx="18" cy="18" r="16"></circle>
            <circle class="exercise-progress-bar" cx="18" cy="18" r="16" style="stroke-dashoffset:${ex.done ? 0 : 100}"></circle>
          </svg>
          <div class="exercise-progress-text">${ex.done ? "100%" : "0%"}</div>
        </div>
      </div>
    </article>
  `;
}

function renderList(type) {
  const list = listEls[type];
  const items = state[type];
  list.innerHTML = items.length ? items.map(item => cardHtml(item, type)).join("") : '<div class="empty">Noch nichts drin.</div>';
}
function renderRecipes() {
  ensureRecipesShape(state);
  recipeCategoriesEl.innerHTML = RECIPE_CATEGORY_ORDER.map(key => `
    <button type="button" class="recipe-category-btn ${state.recipes.activeCategory === key ? "active" : ""}" data-recipe-category="${key}">
      <strong>${esc(RECIPE_CATEGORY_LABELS[key])}</strong>
      <span>${recipeCount(key)} Rezepte</span>
    </button>
  `).join("");

  const activeCategory = state.recipes.activeCategory;
  const activeRecipes = state.recipes.categories[activeCategory] || [];
  activeRecipeCategoryTitle.textContent = RECIPE_CATEGORY_LABELS[activeCategory];
  recipeCountPill.textContent = activeRecipes.length + (activeRecipes.length === 1 ? " Rezept" : " Rezepte");
  recipesList.innerHTML = activeRecipes.length
    ? activeRecipes.map(item => recipeCardHtml(item, activeCategory)).join("")
    : '<div class="empty">Noch keine Rezepte in dieser Kategorie.</div>';
}
function renderStats() {
  const todayTraining = getTodayTraining();
  const progress = getDayProgress(todayTraining);
  document.getElementById("todayTrainingName").textContent = todayTraining.name;
  document.getElementById("todayTrainingProgress").textContent = progress.percent + "%";
  document.getElementById("routineCount").textContent = state.routine.length;
  document.getElementById("calendarCount").textContent = state.calendar.length;
  document.getElementById("dashboardWorkoutTitle").textContent = todayTraining.name;
  document.getElementById("dashboardWorkoutMeta").textContent = progress.total + " Übungen · " + progress.done + "/" + progress.total + " erledigt";
  document.getElementById("dashboardWorkoutPercent").textContent = progress.percent + "%";
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (progress.percent / 100) * circumference;
  const miniBar = document.querySelector(".mini-bar");
  miniBar.style.strokeDasharray = String(circumference);
  miniBar.style.strokeDashoffset = String(offset);
}
function renderProgress() {
  const recipeItems = RECIPE_CATEGORY_ORDER.flatMap(key => state.recipes.categories[key] || []);
  const all = []
    .concat(state.routine, state.calendar, state.habits, state.meals, state.supplements, state.schedule, state.checklist)
    .concat(recipeItems)
    .concat(state.training.days.flatMap(day => day.exercises));
  const total = all.length || 1;
  const done = all.filter(item => item.done).length;
  const percent = Math.round((done / total) * 100);
  progressText.textContent = percent + "%";
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (percent / 100) * circumference;
  const ring = document.querySelector(".ring-progress");
  ring.style.strokeDasharray = String(circumference);
  ring.style.strokeDashoffset = String(offset);
}
function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  monthTitle.textContent = currentMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  let cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    const day = prevMonthDays - firstWeekday + i + 1;
    cells.push(dayCell(new Date(year, month - 1, day), true));
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(dayCell(new Date(year, month, day), false));
  }
  while (cells.length % 7 !== 0) {
    const day = cells.length - (firstWeekday + daysInMonth) + 1;
    cells.push(dayCell(new Date(year, month + 1, day), true));
  }
  calendarGrid.innerHTML = cells.join("");
  renderSelectedDayEvents();
}
function dayCell(dateObj, muted) {
  const iso = toISO(dateObj);
  const hasEvent = state.calendar.some(evt => evt.date === iso);
  const selected = iso === selectedDate;
  return `<button type="button" class="calendar-day ${muted ? "muted" : ""} ${selected ? "selected" : ""} ${hasEvent ? "has-event" : ""}" data-date="${iso}"><span>${dateObj.getDate()}</span></button>`;
}
function renderSelectedDayEvents() {
  const items = state.calendar.filter(evt => evt.date === selectedDate).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  calendarEventList.innerHTML = items.length ? items.map(item => cardHtml(item, "calendar")).join("") : '<div class="empty">Keine Termine an diesem Tag.</div>';
}
function renderTraining() {
  const activeDay = getActiveTrainingDay();
  trainingDaysEl.innerHTML = state.training.days.map((day, idx) => {
    const p = getDayProgress(day);
    return `
      <button type="button" class="training-day-card ${day.id === activeDay.id ? "active" : ""}" data-training-action="select-day" data-day-id="${day.id}">
        <div class="training-day-top">
          <span>⋮⋮</span>
          <span data-training-action="delete-day" data-day-id="${day.id}">${state.training.days.length > 1 ? "✕" : ""}</span>
        </div>
        <strong>${esc(day.name || "Day " + (idx + 1))}</strong>
        <span>${p.done}/${p.total} done</span>
      </button>
    `;
  }).join("");

  activeTrainingDayTitle.textContent = activeDay.name;
  const p = getDayProgress(activeDay);
  activeTrainingDayProgressText.innerHTML = `
    <div class="training-top-circle">
      <svg viewBox="0 0 60 60">
        <circle class="training-circle-bg" cx="30" cy="30" r="26"></circle>
        <circle class="training-circle-bar" cx="30" cy="30" r="26" style="stroke-dashoffset:${188 - (p.percent / 100) * 188}"></circle>
      </svg>
      <div class="training-circle-text">${p.percent}%</div>
    </div>
  `;

  trainingExerciseListEl.innerHTML = activeDay.exercises.length
    ? activeDay.exercises.map((ex, idx) => exerciseHtml(activeDay.id, ex, idx, activeDay.exercises.length)).join("")
    : '<div class="empty">Noch keine Übungen drin.</div>';
}
function renderAll() {
  ["routine", "habits", "meals", "supplements", "schedule", "checklist"].forEach(renderList);
  renderRecipes();
  renderStats();
  renderProgress();
  renderCalendar();
  renderTraining();
  switchSection(currentSection);
}

fillRecipeCategorySelect();

document.getElementById("menuBtn").addEventListener("click", () => openMenu(!sidePanel.classList.contains("open")));
document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Alles zurücksetzen?")) return;
  state = clone(defaults);
  selectedDate = todayISO;
  currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  saveState();
  renderAll();
});
backdrop.addEventListener("click", () => {
  openMenu(false);
  closeModal();
  closeTrainingModal();
  closeRecipeModal();
});
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
document.getElementById("closeTrainingModal").addEventListener("click", closeTrainingModal);
document.getElementById("cancelTrainingBtn").addEventListener("click", closeTrainingModal);
document.getElementById("closeRecipeModal").addEventListener("click", closeRecipeModal);
document.getElementById("cancelRecipeBtn").addEventListener("click", closeRecipeModal);
document.getElementById("addRecipeBtn").addEventListener("click", () => openRecipeModal(state.recipes.activeCategory, null));

document.querySelectorAll(".menu-item, .bottom-item").forEach(btn => {
  btn.addEventListener("click", () => switchSection(btn.dataset.section));
});
document.querySelectorAll(".add-btn").forEach(btn => {
  if (btn.id === "addRecipeBtn") return;
  btn.addEventListener("click", () => openModal(btn.dataset.type, null));
});
document.getElementById("prevMonth").addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  renderCalendar();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  renderCalendar();
});
document.getElementById("addTrainingDayBtn").addEventListener("click", addTrainingDay);
document.getElementById("addExerciseBtn").addEventListener("click", () => {
  const activeDay = getActiveTrainingDay();
  openTrainingModal(activeDay.id, null);
});

entryForm.addEventListener("submit", e => {
  e.preventDefault();
  if (!editType) return;
  upsertItem(editType, {
    title: fieldTitle.value,
    time: fieldTime.value,
    date: fieldDate.value,
    note: fieldNote.value
  });
  saveState();
  renderAll();
  closeModal();
});

trainingForm.addEventListener("submit", e => {
  e.preventDefault();
  if (!editingExerciseDayId) return;
  upsertExercise(editingExerciseDayId, {
    name: exerciseName.value,
    weight: exerciseWeight.value,
    sets: exerciseSets.value,
    reps: exerciseReps.value,
    notes: exerciseNotes.value
  });
  saveState();
  renderAll();
  closeTrainingModal();
});

recipeForm.addEventListener("submit", e => {
  e.preventDefault();
  upsertRecipe({
    category: recipeCategory.value,
    name: recipeName.value,
    calories: recipeCalories.value,
    protein: recipeProtein.value,
    carbs: recipeCarbs.value,
    fat: recipeFat.value,
    ingredients: recipeIngredients.value,
    preparation: recipePreparation.value
  });
  saveState();
  renderAll();
  closeRecipeModal();
});

document.body.addEventListener("click", e => {
  const dateBtn = e.target.closest(".calendar-day");
  if (dateBtn) {
    selectedDate = dateBtn.dataset.date;
    renderCalendar();
    return;
  }

  const recipeCategoryBtn = e.target.closest("[data-recipe-category]");
  if (recipeCategoryBtn) {
    state.recipes.activeCategory = recipeCategoryBtn.dataset.recipeCategory;
    saveState();
    renderRecipes();
    return;
  }

  const recipeActionBtn = e.target.closest("[data-recipe-action]");
  if (recipeActionBtn) {
    const action = recipeActionBtn.dataset.recipeAction;
    const categoryKey = recipeActionBtn.dataset.category;
    const recipeId = recipeActionBtn.dataset.id;
    const recipe = findRecipe(categoryKey, recipeId);
    if (action === "toggle" && recipeId) {
      toggleRecipeExpanded(recipeId);
      saveState();
      renderRecipes();
      return;
    }
    if (action === "edit" && recipe) {
      openRecipeModal(categoryKey, recipe);
      return;
    }
    if (action === "delete") {
      state.recipes.expandedIds = state.recipes.expandedIds.filter(id => id !== recipeId);
      deleteRecipe(categoryKey, recipeId);
      saveState();
      renderAll();
      return;
    }
  }

  const trainingBtn = e.target.closest("[data-training-action]");
  if (trainingBtn) {
    const action = trainingBtn.dataset.trainingAction;
    const dayId = trainingBtn.dataset.dayId;
    const exId = trainingBtn.dataset.exerciseId;

    if (action === "select-day" && dayId) {
      state.training.activeDayId = dayId;
      saveState();
      renderTraining();
      renderStats();
      return;
    }
    if (action === "delete-day" && dayId) {
      deleteTrainingDay(dayId);
      return;
    }

    const day = state.training.days.find(d => d.id === dayId);
    const exercise = day ? day.exercises.find(ex => ex.id === exId) : null;

    if (action === "toggle-exercise" && exercise) {
      exercise.done = !exercise.done;
    } else if (action === "edit-exercise" && exercise) {
      openTrainingModal(dayId, exercise);
      return;
    } else if (action === "delete-exercise" && day) {
      if (!exercise) return;
      const shouldDelete = confirm(`Willst du die Übung "${exercise.name}" wirklich löschen?`);
      if (!shouldDelete) return;
      day.exercises = day.exercises.filter(ex => ex.id !== exId);
    } else if (action === "move-up") {
      moveExercise(dayId, exId, -1);
      return;
    } else if (action === "move-down") {
      moveExercise(dayId, exId, 1);
      return;
    }
    saveState();
    renderAll();
    return;
  }

  const button = e.target.closest("[data-action]");
  if (!button) return;
  const type = button.dataset.type;
  const id = button.dataset.id;
  const item = state[type].find(entry => entry.id === id);
  if (!item) return;

  if (button.dataset.action === "toggle") {
    item.done = !item.done;
  } else if (button.dataset.action === "delete") {
    state[type] = state[type].filter(entry => entry.id !== id);
  } else if (button.dataset.action === "edit") {
    openModal(type, item);
    return;
  }

  saveState();
  renderAll();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

renderAll();
