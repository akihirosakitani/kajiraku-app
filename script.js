const STORAGE_KEY = "kajiraku-app-state-v1";
const SESSION_UNLOCK_KEY = "kajiraku-family-unlocked";
const FAMILY_ACCESS_CODE = "kazoku1234";

const pantryCatalog = [
  {
    name: "野菜",
    items: ["玉ねぎ", "にんじん", "じゃがいも", "キャベツ", "トマト", "小松菜", "なす", "きのこ"],
  },
  {
    name: "たんぱく質",
    items: ["鶏むね肉", "豚こま", "ひき肉", "鮭", "卵", "豆腐", "納豆", "ツナ缶"],
  },
  {
    name: "主食・乾物",
    items: ["ごはん", "うどん", "パスタ", "食パン", "そうめん", "カレールウ"],
  },
  {
    name: "調味料",
    items: ["しょうゆ", "みそ", "砂糖", "塩", "めんつゆ", "ごま油", "マヨネーズ", "ケチャップ"],
  },
];

const recipes = [
  {
    id: "r1",
    name: "親子丼",
    time: 15,
    tags: ["ワンパン", "子ども人気"],
    ingredients: ["鶏むね肉", "卵", "玉ねぎ", "ごはん", "しょうゆ", "砂糖"],
    description: "フライパンひとつで作れて、片付けも少なめ。",
  },
  {
    id: "r2",
    name: "鮭ときのこのホイル焼き",
    time: 20,
    tags: ["洗い物少なめ", "魚"],
    ingredients: ["鮭", "きのこ", "玉ねぎ", "塩", "バター"],
    description: "包んで焼くだけ。副菜を並行して作りやすい献立。",
  },
  {
    id: "r3",
    name: "豚こまとなすのみそ炒め",
    time: 18,
    tags: ["ごはんが進む", "時短"],
    ingredients: ["豚こま", "なす", "玉ねぎ", "みそ", "砂糖", "ごま油"],
    description: "濃いめの味で満足感あり。冷めてもおいしいです。",
  },
  {
    id: "r4",
    name: "ツナトマトパスタ",
    time: 12,
    tags: ["昼にも使える", "包丁少なめ"],
    ingredients: ["パスタ", "ツナ缶", "トマト", "玉ねぎ", "塩", "ケチャップ"],
    description: "疲れた日に頼れる、失敗しにくい定番パスタ。",
  },
  {
    id: "r5",
    name: "豆腐入りキーマカレー",
    time: 25,
    tags: ["作り置き", "節約"],
    ingredients: ["ひき肉", "豆腐", "玉ねぎ", "にんじん", "カレールウ", "ごはん"],
    description: "豆腐でかさ増ししつつ、子どもも食べやすい味。",
  },
  {
    id: "r6",
    name: "小松菜と卵のうどん",
    time: 10,
    tags: ["最速", "ひとり昼にも"],
    ingredients: ["うどん", "小松菜", "卵", "めんつゆ"],
    description: "忙しい日の保険メニュー。朝昼夜どこでも使えます。",
  },
];

const defaultState = {
  selectedPantry: ["玉ねぎ", "卵", "ごはん", "しょうゆ"],
  customPantry: [],
  pantryInventory: [],
  selectedRecipeId: null,
  shoppingItems: [],
  familyTasks: [
    { id: "f1", text: "お米を予約する", owner: "わたし", done: false },
    { id: "f2", text: "牛乳を帰りに買う", owner: "パートナー", done: false },
  ],
  recipeRequests: [
    { id: "rqt1", dish: "カレー", owner: "こども", done: false },
  ],
  quickOnly: false,
  aiSuggestions: [],
  aiStatus: "idle",
  aiError: null,
  aiSource: "none",
};

const state = loadState();

const selectedCountEl = document.querySelector("#selected-count");
const recipeCountEl = document.querySelector("#recipe-count");
const shoppingCountEl = document.querySelector("#shopping-count");
const pantryGroupsEl = document.querySelector("#pantry-groups");
const recipeGridEl = document.querySelector("#recipe-grid");
const aiRecipeGridEl = document.querySelector("#ai-recipe-grid");
const aiStatusCopyEl = document.querySelector("#ai-status-copy");
const aiFeedbackEl = document.querySelector("#ai-feedback");
const shoppingListEl = document.querySelector("#shopping-list");
const familyListEl = document.querySelector("#family-list");
const inventoryListEl = document.querySelector("#inventory-list");
const requestListEl = document.querySelector("#request-list");
const selectedRecipeNameEl = document.querySelector("#selected-recipe-name");
const quickOnlyToggleEl = document.querySelector("#quick-only-toggle");
const installBannerEl = document.querySelector("#install-banner");
const installButtonEl = document.querySelector("#install-button");
const accessGateEl = document.querySelector("#access-gate");
const accessFormEl = document.querySelector("#access-form");
const accessCodeInputEl = document.querySelector("#access-code-input");
const accessErrorEl = document.querySelector("#access-error");
const customPantryFormEl = document.querySelector("#custom-pantry-form");
const customPantryInputEl = document.querySelector("#custom-pantry-input");
const customPantryCategoryEl = document.querySelector("#custom-pantry-category");
const openPantryFormButtonEl = document.querySelector("#open-pantry-form-button");
const closePantryFormButtonEl = document.querySelector("#close-pantry-form-button");
const aiSuggestButtonEl = document.querySelector("#ai-suggest-button");
let deferredInstallPrompt = null;

document.querySelector("#custom-pantry-form").addEventListener("submit", handleCustomPantrySubmit);
document.querySelector("#manual-shopping-form").addEventListener("submit", handleManualShoppingSubmit);
document.querySelector("#family-form").addEventListener("submit", handleFamilySubmit);
document.querySelector("#request-form").addEventListener("submit", handleRecipeRequestSubmit);
document.querySelector("#clear-shopping-button").addEventListener("click", clearShoppingList);
installButtonEl.addEventListener("click", handleInstallClick);
accessFormEl.addEventListener("submit", handleAccessSubmit);
openPantryFormButtonEl.addEventListener("click", openPantryForm);
closePantryFormButtonEl.addEventListener("click", closePantryForm);
aiSuggestButtonEl.addEventListener("click", requestAiSuggestions);
quickOnlyToggleEl.addEventListener("change", () => {
  state.quickOnly = quickOnlyToggleEl.checked;
  persistState();
  render();
});

registerPwaFeatures();
render();
restoreAccessSession();

function loadState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    return { ...structuredClone(defaultState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(defaultState);
  }
}

function persistState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  quickOnlyToggleEl.checked = state.quickOnly;
  renderPantry();
  renderInventoryList();
  renderAiSuggestions();
  renderRecipes();
  renderShoppingList();
  renderFamilyList();
  renderRequestList();
  updateSummary();
}

function renderPantry() {
  const groups = pantryCatalog.map((group) => {
    const chips = group.items
      .map((item) => createChip(item, state.selectedPantry.includes(item)))
      .join("");

    return `
      <section class="pantry-group">
        <h3>${group.name}</h3>
        <div class="chip-row">${chips}</div>
      </section>
    `;
  });

  const customChips = state.customPantry.length
    ? `
      <section class="pantry-group">
        <h3>追加した食材</h3>
        <div class="chip-row">
          ${state.customPantry.map((item) => createChip(item, state.selectedPantry.includes(item), true)).join("")}
        </div>
      </section>
    `
    : "";

  pantryGroupsEl.innerHTML = `${groups.join("")}${customChips}`;

  pantryGroupsEl.querySelectorAll("[data-pantry-item]").forEach((button) => {
    button.addEventListener("click", () => togglePantryItem(button.dataset.pantryItem));
  });
}

function createChip(item, active, removable = false) {
  const activeClass = active ? "active" : "";
  const suffix = removable ? " +" : "";
  return `<button type="button" class="chip ${activeClass}" data-pantry-item="${item}">${item}${suffix}</button>`;
}

function renderAiSuggestions() {
  aiSuggestButtonEl.disabled = state.aiStatus === "loading";

  if (state.aiStatus === "loading") {
    aiStatusCopyEl.textContent = "在庫と家族リクエストをもとに、AI が今夜向けの献立を考えています。";
    aiFeedbackEl.className = "ai-feedback";
    aiFeedbackEl.textContent = "AIが候補を考え中です...";
    aiRecipeGridEl.innerHTML = renderSkeletonCards(3);
    return;
  }

  if (state.aiStatus === "error") {
    aiStatusCopyEl.textContent = "AIに接続できなかったため、今は候補の参考表示に切り替えています。";
    aiFeedbackEl.className = "ai-feedback is-warning";
    aiFeedbackEl.textContent = state.aiError;
  } else if (state.aiStatus === "success") {
    aiStatusCopyEl.textContent = state.aiSource === "ai"
      ? "在庫と家族の希望から、AIが今日向けの献立を提案しました。"
      : "この環境ではAI接続前のため、ローカル候補をAI風に整えて表示しています。";
    aiFeedbackEl.className = "ai-feedback is-success";
    aiFeedbackEl.textContent = state.aiSource === "ai"
      ? "AIおすすめを更新しました。気になる候補をそのまま買い物リストに送れます。"
      : "公開後に `https://` のURLで開くと、本物のAI候補に切り替えられます。";
  } else {
    aiStatusCopyEl.textContent = "在庫と家族リクエストから、今夜向けの候補を考えます。";
    aiFeedbackEl.className = "ai-feedback is-hidden";
    aiFeedbackEl.textContent = "";
  }

  if (!state.aiSuggestions.length) {
    aiRecipeGridEl.innerHTML = '<div class="empty-state">AI候補はまだありません。食材を選んでから `AIで献立を考える` を押してください。</div>';
    return;
  }

  aiRecipeGridEl.innerHTML = state.aiSuggestions
    .map((recipe, index) => renderRecipeCard(recipe, index, true))
    .join("");

  wireRecipeButtons(aiRecipeGridEl);
}

function renderRecipes() {
  const filteredRecipes = buildLocalRecipeSuggestions();
  recipeCountEl.textContent = String(filteredRecipes.length);

  if (!filteredRecipes.length) {
    recipeGridEl.innerHTML = '<div class="empty-state">条件に合う献立がありません。時短の絞り込みを外してみてください。</div>';
    return;
  }

  recipeGridEl.innerHTML = filteredRecipes
    .map((recipe, index) => renderRecipeCard(recipe, index, false))
    .join("");

  wireRecipeButtons(recipeGridEl);
}

function renderRecipeCard(recipe, index, aiMode) {
  const ingredientPills = recipe.ingredients
    .map((item) => {
      const missingClass = recipe.missingIngredients.includes(item) ? "missing" : "";
      return `<span class="ingredient-pill ${missingClass}">${item}</span>`;
    })
    .join("");

  const cardClasses = ["recipe-card"];
  if (index === 0) {
    cardClasses.push("is-best");
  }
  if (aiMode) {
    cardClasses.push("ai-card");
  }

  const reasonBlock = aiMode && recipe.reason
    ? `<p class="ai-reason">${recipe.reason}</p>`
    : "";

  return `
    <article class="${cardClasses.join(" ")}" style="animation-delay:${index * 70}ms">
      <div>
        <p class="recipe-meta">${recipe.time}分 ・ ${recipe.tags.join(" ・ ")}</p>
        <h3>${recipe.name}</h3>
        <p class="recipe-copy">${recipe.description}</p>
        ${reasonBlock}
      </div>
      <div class="recipe-progress" aria-hidden="true">
        <span style="width:${recipe.matchRate}%"></span>
      </div>
      <p class="recipe-meta">家にある食材で ${recipe.matchRate}% そろっています</p>
      <div class="recipe-ingredients">${ingredientPills}</div>
      <button class="recipe-action" type="button" data-recipe-id="${recipe.id}">
        この献立で買い物リストを作る
      </button>
    </article>
  `;
}

function wireRecipeButtons(container) {
  container.querySelectorAll("[data-recipe-id]").forEach((button) => {
    button.addEventListener("click", () => selectRecipe(button.dataset.recipeId));
  });
}

function renderSkeletonCards(count) {
  return Array.from({ length: count }, (_, index) => `
    <article class="recipe-card ai-card skeleton-card" style="animation-delay:${index * 70}ms">
      <div class="skeleton-line short"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line long"></div>
      <div class="recipe-progress" aria-hidden="true"><span style="width:${35 + index * 15}%"></span></div>
      <div class="skeleton-line medium"></div>
    </article>
  `).join("");
}

function buildLocalRecipeSuggestions(limit) {
  const selectedSet = new Set(state.selectedPantry);
  const requestTerms = state.recipeRequests
    .filter((request) => !request.done)
    .map((request) => request.dish);

  const suggestions = recipes
    .filter((recipe) => !state.quickOnly || recipe.time <= 20)
    .map((recipe) => enrichRecipe(recipe, selectedSet, requestTerms))
    .sort((a, b) => b.score - a.score || a.time - b.time);

  return typeof limit === "number" ? suggestions.slice(0, limit) : suggestions;
}

function enrichRecipe(recipe, selectedSet, requestTerms) {
  const availableIngredients = recipe.ingredients.filter((item) => selectedSet.has(item));
  const missingIngredients = recipe.ingredients.filter((item) => !selectedSet.has(item));
  const matchRate = Math.round((availableIngredients.length / recipe.ingredients.length) * 100);
  const requestBoost = requestTerms.some((dish) => recipe.name.includes(dish) || dish.includes(recipe.name)) ? 15 : 0;

  return {
    ...recipe,
    availableIngredients,
    missingIngredients,
    matchRate,
    score: matchRate + requestBoost,
    reason: requestBoost
      ? "家族リクエストに近く、今ある食材でも作りやすい候補です。"
      : "今ある食材との相性がよく、作りやすい候補です。",
  };
}

async function requestAiSuggestions() {
  state.aiStatus = "loading";
  state.aiError = null;
  renderAiSuggestions();

  if (window.location.protocol === "file:") {
    applyAiFallback("公開後に `https://` のURLで開くと、OpenAI経由の献立候補を使えます。今はローカル候補をAI枠に表示しています。");
    return;
  }

  try {
    const response = await fetch("./api/meal-suggestions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildAiPayload()),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "AI候補の取得に失敗しました。");
    }

    state.aiSuggestions = normalizeAiSuggestions(data.suggestions || []);
    state.aiStatus = "success";
    state.aiError = null;
    state.aiSource = "ai";
    persistState();
    renderAiSuggestions();
  } catch (error) {
    applyAiFallback(error.message || "AI候補の取得に失敗したため、ローカル候補に切り替えました。");
  }
}

function buildAiPayload() {
  return {
    selectedPantry: [...state.selectedPantry],
    inventory: state.pantryInventory.filter((item) => item.level !== "少ない"),
    recipeRequests: state.recipeRequests.filter((request) => !request.done),
    quickOnly: state.quickOnly,
    maxSuggestions: 4,
  };
}

function normalizeAiSuggestions(suggestions) {
  const selectedSet = new Set(state.selectedPantry);

  return suggestions.map((suggestion, index) => {
    const normalizedIngredients = Array.isArray(suggestion.ingredients) ? suggestion.ingredients : [];
    const availableIngredients = Array.isArray(suggestion.availableIngredients)
      ? suggestion.availableIngredients
      : normalizedIngredients.filter((item) => selectedSet.has(item));
    const missingIngredients = Array.isArray(suggestion.missingIngredients)
      ? suggestion.missingIngredients
      : normalizedIngredients.filter((item) => !selectedSet.has(item));
    const baseCount = normalizedIngredients.length || 1;

    return {
      id: suggestion.id || `ai-${index + 1}`,
      name: suggestion.name || "おすすめ献立",
      description: suggestion.description || "今ある食材から組み立てた献立候補です。",
      time: Number.isFinite(suggestion.time) ? suggestion.time : 20,
      tags: Array.isArray(suggestion.tags) && suggestion.tags.length ? suggestion.tags : ["AI提案"],
      ingredients: normalizedIngredients,
      availableIngredients,
      missingIngredients,
      matchRate: Math.round((availableIngredients.length / baseCount) * 100),
      reason: suggestion.reason || "今ある食材と家族の希望をもとに選びました。",
    };
  });
}

function applyAiFallback(message) {
  state.aiSuggestions = buildLocalRecipeSuggestions(3).map((recipe, index) => ({
    ...recipe,
    id: `ai-fallback-${index + 1}`,
    tags: ["候補", ...recipe.tags].slice(0, 3),
  }));
  state.aiStatus = "error";
  state.aiError = message;
  state.aiSource = "fallback";
  persistState();
  renderAiSuggestions();
}

function renderShoppingList() {
  const selectedRecipe = findRecipeById(state.selectedRecipeId);
  selectedRecipeNameEl.textContent = selectedRecipe
    ? `${selectedRecipe.name} の不足分`
    : "まだ献立を選んでいません";

  shoppingCountEl.textContent = String(state.shoppingItems.filter((item) => !item.done).length);

  if (!state.shoppingItems.length) {
    shoppingListEl.innerHTML = '<li class="empty-state">献立を選ぶと、不足食材がここに並びます。手入力でも追加できます。</li>';
    return;
  }

  shoppingListEl.innerHTML = state.shoppingItems
    .map(
      (item) => `
        <li class="shopping-item ${item.done ? "done" : ""}">
          <label>
            <input type="checkbox" data-shopping-id="${item.id}" ${item.done ? "checked" : ""}>
            <span>${item.name}</span>
          </label>
          <span class="pill-note">${item.source}</span>
        </li>
      `
    )
    .join("");

  shoppingListEl.querySelectorAll("[data-shopping-id]").forEach((input) => {
    input.addEventListener("change", () => toggleShoppingItem(input.dataset.shoppingId));
  });
}

function renderFamilyList() {
  if (!state.familyTasks.length) {
    familyListEl.innerHTML = '<li class="empty-state">家族メモはまだありません。</li>';
    return;
  }

  familyListEl.innerHTML = state.familyTasks
    .map(
      (task) => `
        <li class="family-item ${task.done ? "done" : ""}">
          <label>
            <input type="checkbox" data-family-id="${task.id}" ${task.done ? "checked" : ""}>
            <span>${task.text}</span>
          </label>
          <span class="pill-note">${task.owner}</span>
        </li>
      `
    )
    .join("");

  familyListEl.querySelectorAll("[data-family-id]").forEach((input) => {
    input.addEventListener("change", () => toggleFamilyTask(input.dataset.familyId));
  });
}

function renderInventoryList() {
  if (!state.pantryInventory.length) {
    inventoryListEl.innerHTML = '<li class="empty-state">追加した在庫はまだありません。よく補充するものを登録しておくと便利です。</li>';
    return;
  }

  inventoryListEl.innerHTML = state.pantryInventory
    .map(
      (item) => `
        <li class="inventory-item ${item.level === "少ない" ? "low" : ""}">
          <div>
            <strong>${item.name}</strong>
            <p class="shopping-item-meta">${item.category} ・ ${item.level}</p>
          </div>
          <div class="inventory-actions">
            <button class="secondary-button compact" type="button" data-stock-toggle="${item.id}">
              ${item.level === "少ない" ? "補充済みにする" : "少ないにする"}
            </button>
            <button class="text-button" type="button" data-stock-remove="${item.id}">削除</button>
          </div>
        </li>
      `
    )
    .join("");

  inventoryListEl.querySelectorAll("[data-stock-toggle]").forEach((button) => {
    button.addEventListener("click", () => toggleInventoryLevel(button.dataset.stockToggle));
  });

  inventoryListEl.querySelectorAll("[data-stock-remove]").forEach((button) => {
    button.addEventListener("click", () => removeInventoryItem(button.dataset.stockRemove));
  });
}

function renderRequestList() {
  if (!state.recipeRequests.length) {
    requestListEl.innerHTML = '<li class="empty-state">献立リクエストはまだありません。</li>';
    return;
  }

  requestListEl.innerHTML = state.recipeRequests
    .map(
      (request) => `
        <li class="family-item ${request.done ? "done" : ""}">
          <label>
            <input type="checkbox" data-request-id="${request.id}" ${request.done ? "checked" : ""}>
            <span>${request.dish}</span>
          </label>
          <span class="pill-note">${request.owner}</span>
        </li>
      `
    )
    .join("");

  requestListEl.querySelectorAll("[data-request-id]").forEach((input) => {
    input.addEventListener("change", () => toggleRecipeRequest(input.dataset.requestId));
  });
}

function updateSummary() {
  selectedCountEl.textContent = String(state.selectedPantry.length);
}

function togglePantryItem(item) {
  if (state.selectedPantry.includes(item)) {
    state.selectedPantry = state.selectedPantry.filter((entry) => entry !== item);
  } else {
    state.selectedPantry = [...state.selectedPantry, item];
  }

  persistState();
  render();
}

function selectRecipe(recipeId) {
  state.selectedRecipeId = recipeId;
  const recipe = findRecipeById(recipeId);
  if (!recipe) {
    return;
  }

  const existing = new Map(state.shoppingItems.map((item) => [item.name, item]));
  const missingIngredients = recipe.missingIngredients || recipe.ingredients.filter((ingredient) => !state.selectedPantry.includes(ingredient));

  state.shoppingItems = missingIngredients
    .map((ingredient) => existing.get(ingredient) || makeShoppingItem(ingredient, recipe.name))
    .concat(
      state.shoppingItems.filter(
        (item) => item.source === "手入力" && !recipe.ingredients.includes(item.name)
      )
    );

  persistState();
  renderShoppingList();
  updateSummary();
  window.location.hash = "shopping";
}

function findRecipeById(recipeId) {
  return [...buildLocalRecipeSuggestions(), ...state.aiSuggestions].find((recipe) => recipe.id === recipeId);
}

function makeShoppingItem(name, recipeName) {
  return {
    id: crypto.randomUUID(),
    name,
    done: false,
    source: recipeName,
  };
}

function handleCustomPantrySubmit(event) {
  event.preventDefault();
  const value = customPantryInputEl.value.trim();
  if (!value) {
    return;
  }

  if (!state.customPantry.includes(value)) {
    state.customPantry.push(value);
  }

  if (!state.selectedPantry.includes(value)) {
    state.selectedPantry.push(value);
  }

  if (!state.pantryInventory.some((item) => item.name === value)) {
    state.pantryInventory.unshift({
      id: crypto.randomUUID(),
      name: value,
      category: customPantryCategoryEl.value,
      level: "ある",
    });
  }

  customPantryInputEl.value = "";
  persistState();
  render();
  closePantryForm();
}

function handleManualShoppingSubmit(event) {
  event.preventDefault();
  const input = document.querySelector("#manual-shopping-input");
  const value = input.value.trim();
  if (!value) {
    return;
  }

  if (!state.shoppingItems.some((item) => item.name === value)) {
    state.shoppingItems.push({
      id: crypto.randomUUID(),
      name: value,
      done: false,
      source: "手入力",
    });
  }

  input.value = "";
  persistState();
  renderShoppingList();
}

function handleFamilySubmit(event) {
  event.preventDefault();
  const taskInput = document.querySelector("#family-task-input");
  const ownerInput = document.querySelector("#family-owner-input");
  const text = taskInput.value.trim();

  if (!text) {
    return;
  }

  state.familyTasks.unshift({
    id: crypto.randomUUID(),
    text,
    owner: ownerInput.value,
    done: false,
  });

  taskInput.value = "";
  persistState();
  renderFamilyList();
}

function handleRecipeRequestSubmit(event) {
  event.preventDefault();
  const dishInput = document.querySelector("#request-dish-input");
  const ownerInput = document.querySelector("#request-owner-input");
  const dish = dishInput.value.trim();

  if (!dish) {
    return;
  }

  state.recipeRequests.unshift({
    id: crypto.randomUUID(),
    dish,
    owner: ownerInput.value,
    done: false,
  });

  dishInput.value = "";
  persistState();
  renderRequestList();
}

function toggleShoppingItem(id) {
  state.shoppingItems = state.shoppingItems.map((item) =>
    item.id === id ? { ...item, done: !item.done } : item
  );
  persistState();
  renderShoppingList();
}

function toggleFamilyTask(id) {
  state.familyTasks = state.familyTasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  persistState();
  renderFamilyList();
}

function toggleRecipeRequest(id) {
  state.recipeRequests = state.recipeRequests.map((request) =>
    request.id === id ? { ...request, done: !request.done } : request
  );
  persistState();
  renderRequestList();
}

function toggleInventoryLevel(id) {
  state.pantryInventory = state.pantryInventory.map((item) =>
    item.id === id
      ? { ...item, level: item.level === "少ない" ? "ある" : "少ない" }
      : item
  );
  persistState();
  renderInventoryList();
}

function removeInventoryItem(id) {
  const target = state.pantryInventory.find((item) => item.id === id);
  state.pantryInventory = state.pantryInventory.filter((item) => item.id !== id);
  if (target) {
    state.customPantry = state.customPantry.filter((item) => item !== target.name);
    state.selectedPantry = state.selectedPantry.filter((item) => item !== target.name);
  }
  persistState();
  render();
}

function clearShoppingList() {
  state.shoppingItems = [];
  state.selectedRecipeId = null;
  persistState();
  renderShoppingList();
}

function restoreAccessSession() {
  const unlocked = window.sessionStorage.getItem(SESSION_UNLOCK_KEY) === "true";
  if (unlocked) {
    accessGateEl.classList.add("is-hidden");
  }
}

function handleAccessSubmit(event) {
  event.preventDefault();
  const code = accessCodeInputEl.value.trim();

  if (code !== FAMILY_ACCESS_CODE) {
    accessErrorEl.classList.remove("is-hidden");
    accessCodeInputEl.value = "";
    return;
  }

  window.sessionStorage.setItem(SESSION_UNLOCK_KEY, "true");
  accessGateEl.classList.add("is-hidden");
  accessErrorEl.classList.add("is-hidden");
}

function openPantryForm() {
  customPantryFormEl.classList.remove("is-hidden");
  openPantryFormButtonEl.classList.add("is-hidden");
  customPantryInputEl.focus();
}

function closePantryForm() {
  customPantryFormEl.classList.add("is-hidden");
  openPantryFormButtonEl.classList.remove("is-hidden");
  customPantryInputEl.value = "";
}

function registerPwaFeatures() {
  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js");
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBannerEl.classList.remove("is-hidden");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installBannerEl.classList.add("is-hidden");
  });
}

async function handleInstallClick() {
  if (!deferredInstallPrompt) {
    installBannerEl.classList.add("is-hidden");
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBannerEl.classList.add("is-hidden");
}
