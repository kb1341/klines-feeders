// ==============================
// CONFIG
// ==============================

// After you deploy Apps Script Web App, paste its URL here:
const ORDER_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

// Optional: rough price estimates (for an approximate "est total" display only)
const PRICE_BOOK = {
  mice: {
    "pinky": 0.35,
    "fuzzy": 0.45,
    "hopper": 0.65,
    "small adult": 0.90,
    "medium adult": 1.20,
    "large adult": 1.60
  },
  rats: {
    "pinky": 0.90,
    "fuzzy": 1.10,
    "weanling": 1.60,
    "small": 2.20,
    "medium": 2.90,
    "large": 3.60,
    "jumbo": 4.40
  },
  rabbits: {
    "small": 7.50,
    "medium": 10.00,
    "large": 13.50
  },
  chicks: {
    "day-old": 1.20,
    "jumbo": 1.80
  }
};

const PRODUCT_TYPES = [
  { value: "mice", label: "Mice" },
  { value: "rats", label: "Rats" },
  { value: "rabbits", label: "Rabbits" },
  { value: "chicks", label: "Chicks" }
];

const SIZES_BY_TYPE = {
  mice: ["pinky", "fuzzy", "hopper", "small adult", "medium adult", "large adult"],
  rats: ["pinky", "fuzzy", "weanling", "small", "medium", "large", "jumbo"],
  rabbits: ["small", "medium", "large"],
  chicks: ["day-old", "jumbo"]
};

const PACKS = [1, 5, 10, 20, 25, 50, 100];

// ==============================
// DOM
// ==============================
const itemsEl = document.getElementById("items");
const addItemBtn = document.getElementById("addItem");
const clearItemsBtn = document.getElementById("clearItems");
const summaryEl = document.getElementById("summary");
const estTotalEl = document.getElementById("estTotal");
const form = document.getElementById("orderForm");
const statusEl = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

// State
let items = [];

// ==============================
// HELPERS
// ==============================
function money(n){
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function uid(){
  // local client-side reference (server will generate official one)
  return Math.random().toString(16).slice(2, 8).toUpperCase();
}

function buildSelect(options, value){
  const s = document.createElement("select");
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value ?? opt;
    o.textContent = opt.label ?? opt;
    s.appendChild(o);
  });
  if (value) s.value = value;
  return s;
}

function getUnitPrice(type, size){
  return (PRICE_BOOK[type] && PRICE_BOOK[type][size]) ? PRICE_BOOK[type][size] : 0;
}

function calcEstimatedTotal(){
  let total = 0;
  for (const it of items){
    total += getUnitPrice(it.type, it.size) * (Number(it.qty) || 0);
  }
  return total;
}

function updateSummary(){
  if (!items.length){
    summaryEl.textContent = "No items added yet.";
    estTotalEl.textContent = money(0);
    return;
  }
  const parts = items.map(it => `${it.qty} × ${it.type.toUpperCase()} (${it.size})`);
  summaryEl.textContent = parts.join(" • ");
  estTotalEl.textContent = money(calcEstimatedTotal());
}

function setStatus(msg, kind){
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
}

function validateItems(){
  if (!items.length) return "Please add at least one item.";
  for (const it of items){
    if (!it.type || !it.size) return "Please select type and size for each item.";
    if (!Number(it.qty) || Number(it.qty) < 1) return "Please enter a quantity (1 or more) for each item.";
  }
  return null;
}

// ==============================
// UI: Item rows
// ==============================
function render(){
  itemsEl.innerHTML = "";

  items.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "item-row";

    // Type
    const typeField = document.createElement("div");
    typeField.className = "field";
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type";
    const typeSel = buildSelect(PRODUCT_TYPES, it.type);
    typeSel.addEventListener("change", () => {
      it.type = typeSel.value;
      it.size = SIZES_BY_TYPE[it.type][0];
      render();
      updateSummary();
    });
    typeField.appendChild(typeLabel);
    typeField.appendChild(typeSel);

    // Size
    const sizeField = document.createElement("div");
    sizeField.className = "field";
    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = "Size";
    const sizeSel = buildSelect(SIZES_BY_TYPE[it.type] || [], it.size);
    sizeSel.addEventListener("change", () => {
      it.size = sizeSel.value;
      updateSummary();
    });
    sizeField.appendChild(sizeLabel);
    sizeField.appendChild(sizeSel);

    // Pack
    const packField = document.createElement("div");
    packField.className = "field";
    const packLabel = document.createElement("label");
    packLabel.textContent = "Pack";
    const packSel = buildSelect(PACKS.map(p => ({ value: String(p), label: String(p) })), String(it.qty));
    packSel.addEventListener("change", () => {
      it.qty = Number(packSel.value);
      updateSummary();
    });
    packField.appendChild(packLabel);
    packField.appendChild(packSel);

    // Unit price (optional display)
    const priceField = document.createElement("div");
    priceField.className = "field";
    const priceLabel = document.createElement("label");
    priceLabel.textContent = "Est. unit";
    const priceBox = document.createElement("input");
    priceBox.disabled = true;
    priceBox.value = getUnitPrice(it.type, it.size) ? money(getUnitPrice(it.type, it.size)) : "—";
    priceField.appendChild(priceLabel);
    priceField.appendChild(priceBox);

    // Actions
    const actions = document.createElement("div");
    actions.className = "item-actions";
    const dupBtn = document.createElement("button");
    dupBtn.type = "button";
    dupBtn.className = "icon-btn";
    dupBtn.title = "Duplicate row";
    dupBtn.textContent = "⎘";
    dupBtn.addEventListener("click", () => {
      items.splice(idx + 1, 0, { ...it });
      render();
      updateSummary();
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn";
    delBtn.title = "Remove row";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => {
      items = items.filter((_, i) => i !== idx);
      render();
      updateSummary();
    });

    actions.appendChild(dupBtn);
    actions.appendChild(delBtn);

    row.appendChild(typeField);
    row.appendChild(sizeField);
    row.appendChild(packField);
    row.appendChild(priceField);
    row.appendChild(actions);

    itemsEl.appendChild(row);
  });

  updateSummary();
}

function addDefaultItem(){
  items.push({
    type: "mice",
    size: SIZES_BY_TYPE.mice[0],
    qty: 25
  });
  render();
}

// ==============================
// SUBMIT
// ==============================
async function submitOrder(payload){
  const res = await fetch(ORDER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Honeypot
  const hp = form.elements["company"]?.value?.trim();
  if (hp) {
    setStatus("Thanks! We received your request.", "ok");
    return;
  }

  const itemsError = validateItems();
  if (itemsError){
    setStatus(itemsError, "err");
    return;
  }

  if (!ORDER_ENDPOINT || ORDER_ENDPOINT.includes("PASTE_YOUR")){
    setStatus("Order endpoint not configured yet. Paste your Apps Script Web App URL into assets/order.js.", "err");
    return;
  }

  const fd = new FormData(form);
  const clientRef = `CLIENT-${uid()}`;

  const payload = {
    client_ref: clientRef,
    created_at: new Date().toISOString(),
    items,
    items_summary: items.map(it => `${it.qty} x ${it.type} (${it.size})`).join(" | "),
    estimated_total: calcEstimatedTotal(),
    customer: {
      customer_name: String(fd.get("customerName") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      ship_to_name: String(fd.get("shipToName") || ""),
      address1: String(fd.get("address1") || ""),
      address2: String(fd.get("address2") || ""),
      city: String(fd.get("city") || ""),
      state: String(fd.get("state") || "").toUpperCase(),
      zip: String(fd.get("zip") || "")
    },
    preferences: {
      ship_preference: String(fd.get("shipPref") || ""),
      substitutions_allowed: String(fd.get("subsAllowed") || ""),
      notes: String(fd.get("notes") || "")
    },
    meta: {
      user_agent: navigator.userAgent
    }
  };

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";
    setStatus("Submitting your order request…", "");

    const result = await submitOrder(payload);

    if (result && result.ok){
      setStatus(`Order received ✅ Reference: ${result.orderId}. Check your email for confirmation.`, "ok");
      form.reset();
      items = [];
      addDefaultItem();
    } else {
      setStatus(result?.error || "Something went wrong submitting your order. Please try again.", "err");
    }
  } catch (err){
    console.error(err);
    setStatus("Network error. Please try again or contact us.", "err");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Order Request";
  }
});

// Buttons
addItemBtn.addEventListener("click", addDefaultItem);
clearItemsBtn.addEventListener("click", () => {
  items = [];
  render();
});

// Init
addDefaultItem();
