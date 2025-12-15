/* CICO Rent - Preventivo Online
   Vanilla JS, range calendar + pricing logic. */

const VEHICLES = {
  auto: [
    { id: "vwpolo", name: "Volkswagen Polo (ultimo modello)", base: 60 },
  ],
  furgone: [
    { id: "peugeotboxer", name: "Peugeot Boxer L2H2", base: 80 },
    { id: "vwcrafter", name: "Volkswagen Crafter L3H3", base: 80 }
  ]
};

// Progressive discounts (pick best threshold <= days)
const DISCOUNTS = {
  auto: [
    [30, 0.55],
    [7, 0.50],
    [5, 0.43],
    [4, 0.42],
    [3, 0.33],
    [2, 0.12]
  ],
  furgone: [
    [30, 0.35],
    [7, 0.20],
    [6, 0.19],
    [5, 0.15],
    [4, 0.12],
    [3, 0.06],
    [2, 0.05]
  ]
};

const SERVICES = {
  auto: {
    insuranceAdvancedPerDay: 15,
    kmOptions: [
      { id: "km_none", label: "Standard", perDay: 0 },
      { id: "km_unlimited", label: "KM Illimitati", perDay: 5 }
    ]
  },
  furgone: {
    insuranceAdvancedPerDay: 20,
    kmOptions: [
      { id: "km_none", label: "Standard", perDay: 0 },
      { id: "km_200", label: "200 KM", perDay: 15 },
      { id: "km_unlimited", label: "KM Illimitati", perDay: 30 }
    ],
    oneDayPackages: {
      "10h": { label: "10 Ore", base: 60, advanced: 20, unlimited: 15, allowUnlimited: true },
      "4h": { label: "4 Ore", base: 49, advanced: 20, unlimited: 0, allowUnlimited: false }
    }
  },
  extras: {
    extraDriverPerDay: 8,
    under25Multiplier: 1.10
  }
};

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
if (menuBtn && mobileMenu){
  menuBtn.addEventListener("click", () => {
    const expanded = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute("aria-expanded", String(!expanded));
    mobileMenu.hidden = expanded;
  });
}

// Calendar DOM
const startLabel = document.getElementById("startLabel");
const endLabel = document.getElementById("endLabel");
const calTitle = document.getElementById("calTitle");
const calGrid = document.getElementById("calGrid");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const clearDates = document.getElementById("clearDates");

// Form DOM
const vehicleType = document.getElementById("vehicleType");
const vehicleModel = document.getElementById("vehicleModel");
const baseRate = document.getElementById("baseRate");
const insuranceHint = document.getElementById("insuranceHint");
const kmOptionsWrap = document.getElementById("kmOptions");
const daysBadge = document.getElementById("daysBadge");
const vanPackageField = document.getElementById("vanPackageField");
const extraDriver = document.getElementById("extraDriver");
const under25 = document.getElementById("under25");

// Result DOM
const perDayEl = document.getElementById("perDay");
const totalEl = document.getElementById("total");
const breakdown = document.getElementById("breakdown");
const bdDays = document.getElementById("bdDays");
const bdDaily = document.getElementById("bdDaily");
const bdDiscount = document.getElementById("bdDiscount");
const bdExtras = document.getElementById("bdExtras");
const bdTotal = document.getElementById("bdTotal");
const emailQuote = document.getElementById("emailQuote");

// Calendar state
let viewDate = new Date();
viewDate.setHours(0,0,0,0);
let startDate = null;
let endDate = null;

// Helpers
function pad(n){ return String(n).padStart(2, "0"); }
function toISO(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function fmtShort(d){
  const opts = { day:"2-digit", month:"short", year:"numeric" };
  return d.toLocaleDateString("it-IT", opts);
}
function sameDay(a,b){
  return a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function daysBetweenInclusive(a,b){
  const ms = 24*60*60*1000;
  const diff = Math.round((b - a)/ms);
  return diff + 1;
}
function getDiscountRate(type, days){
  const rows = DISCOUNTS[type] || [];
  let rate = 0;
  for (const [minDays, r] of rows){
    if (days >= minDays) rate = Math.max(rate, r);
  }
  return rate;
}
function money(n){
  return new Intl.NumberFormat("it-IT", { style:"currency", currency:"EUR" }).format(n);
}

function renderVehicles(){
  const type = vehicleType.value;
  vehicleModel.innerHTML = "";
  const list = VEHICLES[type] || [];
  for (const v of list){
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = `${v.name}`;
    vehicleModel.appendChild(opt);
  }
  const first = list[0];
  baseRate.value = first ? first.base : 0;
}

function renderKmOptions(){
  const type = vehicleType.value;
  const cfg = SERVICES[type];
  kmOptionsWrap.innerHTML = "";
  if (!cfg) return;

  const groupName = "kmOpt";
  cfg.kmOptions.forEach((opt, idx) => {
    const label = document.createElement("label");
    label.className = "opt";
    label.innerHTML = `
      <input type="radio" name="${groupName}" value="${opt.id}" ${idx===0 ? "checked" : ""} />
      <span><strong>${opt.label}</strong> <span class="muted">${opt.perDay ? `(+${opt.perDay}€ / giorno)` : ""}</span></span>
    `;
    kmOptionsWrap.appendChild(label);
  });
}

function getSelectedInsurance(){
  const el = document.querySelector('input[name="insurance"]:checked');
  return el ? el.value : "base";
}
function getSelectedKm(){
  const el = document.querySelector('input[name="kmOpt"]:checked');
  return el ? el.value : "km_none";
}
function getSelectedVanPackage(){
  const el = document.querySelector('input[name="vanPackage"]:checked');
  return el ? el.value : "10h";
}
function currentDays(){
  if (!startDate || !endDate) return 0;
  return daysBetweenInclusive(startDate, endDate);
}

function updateVanPackageVisibility(){
  const days = currentDays();
  const type = vehicleType.value;
  const show = (type === "furgone" && days === 1);
  vanPackageField.hidden = !show;

  if (show){
    baseRate.setAttribute("disabled", "disabled");
    baseRate.value = SERVICES.furgone.oneDayPackages[getSelectedVanPackage()].base;
  } else {
    baseRate.removeAttribute("disabled");
    const v = (VEHICLES[type] || []).find(x => x.id === vehicleModel.value) || (VEHICLES[type] || [])[0];
    if (v) baseRate.value = v.base;
  }
}

function compute(){
  const days = currentDays();

  startLabel.textContent = startDate ? fmtShort(startDate) : "--";
  endLabel.textContent = endDate ? fmtShort(endDate) : "--";

  if (!days){
    daysBadge.textContent = "Seleziona le date";
    perDayEl.textContent = "—";
    totalEl.textContent = "Seleziona inizio e fine noleggio";
    breakdown.hidden = true;
    return;
  }

  daysBadge.textContent = `${days} giorn${days>1 ? "i" : "o"}`;

  const type = vehicleType.value;
  const insurance = getSelectedInsurance();
  const kmId = getSelectedKm();
  const kmOpt = SERVICES[type].kmOptions.find(x => x.id === kmId) || SERVICES[type].kmOptions[0];

  let basePerDay = Number(baseRate.value || 0);
  let discountableDailyExtras = 0;

  if (insurance === "advanced") discountableDailyExtras += SERVICES[type].insuranceAdvancedPerDay;
  discountableDailyExtras += Number(kmOpt.perDay || 0);

  let discountRate = getDiscountRate(type, days);
  let discountableTotal = (basePerDay + discountableDailyExtras) * days;

  // Special: furgone + 1 day => package pricing
  let packageMode = false;
  if (type === "furgone" && days === 1){
    packageMode = true;
    const pkg = SERVICES.furgone.oneDayPackages[getSelectedVanPackage()];
    let pkgTotal = pkg.base;
    if (insurance === "advanced") pkgTotal += pkg.advanced;

    const wantsUnlimited = (kmId === "km_unlimited");
    if (wantsUnlimited && pkg.allowUnlimited) pkgTotal += pkg.unlimited;

    discountableTotal = pkgTotal;
    discountRate = 0;

    basePerDay = pkg.base;
    discountableDailyExtras = 0; // avoid misleading per-day extras in breakdown
  }

  const discountedTotal = discountableTotal * (1 - discountRate);

  // Non-discounted extras
  let extrasTotal = 0;
  if (extraDriver.checked) extrasTotal += SERVICES.extras.extraDriverPerDay * days;

  let subtotal = discountedTotal + extrasTotal;
  let total = JSON.stringify(JSON.parse(subtotal));
  if (under25.checked) {
    total = subtotal * SERVICES.extras.under25Multiplier;
    extrasTotal += (total - subtotal);
  }

  const perDay = total / days;

  perDayEl.textContent = `${money(perDay)} / giorno`;
  totalEl.textContent = `Totale: ${money(total)} (IVA inclusa)`;

  breakdown.hidden = false;
  bdDays.textContent = `${days} giorn${days>1 ? "i" : "o"}`;

  if (packageMode){
    bdDaily.textContent = `Pacchetto ${SERVICES.furgone.oneDayPackages[getSelectedVanPackage()].label}`;
    bdDiscount.textContent = "—";
  } else {
    bdDaily.textContent = `${money(basePerDay + discountableDailyExtras)} / giorno`;
    bdDiscount.textContent = discountRate ? `-${Math.round(discountRate*100)}%` : "—";
  }

  bdExtras.textContent = extrasTotal ? money(extrasTotal) : "—";
  bdTotal.textContent = money(total);

  // Prefill email
  const subject = encodeURIComponent("Richiesta Preventivo Online - CICO Rent");
  const lines = [];
  lines.push(`Date: ${fmtShort(startDate)} → ${fmtShort(endDate)} (${days} gg)`);
  lines.push(`Tipo veicolo: ${type === "auto" ? "Automobile" : "Furgone"}`);
  lines.push(`Veicolo: ${vehicleModel.options[vehicleModel.selectedIndex]?.textContent || ""}`);
  if (packageMode) lines.push(`Pacchetto: ${SERVICES.furgone.oneDayPackages[getSelectedVanPackage()].label}`);
  lines.push(`Assicurazione: ${insurance === "advanced" ? "Copertura Avanzata" : "Base"}`);
  lines.push(`Chilometraggio: ${kmOpt.label}`);
  if (extraDriver.checked) lines.push("Extra: Guidatore aggiuntivo");
  if (under25.checked) lines.push("Extra: Guidatore under 25");
  lines.push(`Totale stimato: ${money(total)} (IVA inclusa)`);
  lines.push(`Totale / giorno: ${money(perDay)} / giorno`);
  lines.push("");
  lines.push("Nome e Cognome:");
  lines.push("Telefono:");
  lines.push("Note:");

  const body = encodeURIComponent(lines.join("\n"));
  emailQuote.href = `mailto:info@cicorent.it?subject=${subject}&body=${body}`;
}

function renderCalendar(){
  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString("it-IT", { month:"long", year:"numeric" });
  calTitle.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  calGrid.innerHTML = "";

  const first = new Date(y, m, 1);
  first.setHours(0,0,0,0);

  const jsDay = first.getDay(); // 0 Sun .. 6 Sat
  const startOffset = (jsDay + 6) % 7; // Monday=0

  const daysInMonth = new Date(y, m+1, 0).getDate();
  const totalCells = 42;

  const today = new Date(); today.setHours(0,0,0,0);

  for (let i=0; i<totalCells; i++){
    const dayNum = i - startOffset + 1;
    const cellDate = new Date(y, m, dayNum);
    cellDate.setHours(0,0,0,0);

    const inCurrentMonth = (dayNum >= 1 && dayNum <= daysInMonth);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day";
    btn.setAttribute("role", "gridcell");
    btn.dataset.iso = toISO(cellDate);

    if (!inCurrentMonth){
      btn.classList.add("muted");
      btn.setAttribute("aria-disabled", "true");
    }

    if (sameDay(cellDate, today)) btn.classList.add("today");

    const isSelected = sameDay(cellDate, startDate) || sameDay(cellDate, endDate);
    if (isSelected) btn.classList.add("selected");

    if (startDate && endDate && cellDate >= startDate && cellDate <= endDate){
      btn.classList.add("in-range");
      if (isSelected) btn.classList.add("selected");
    }

    const top = document.createElement("div");
    top.textContent = String(cellDate.getDate());

    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = inCurrentMonth ? "" : " ";

    btn.appendChild(top);
    btn.appendChild(sub);

    btn.addEventListener("click", () => {
      if (!inCurrentMonth) return;

      if (!startDate || (startDate && endDate)){
        startDate = cellDate;
        endDate = null;
      } else if (startDate && !endDate){
        if (cellDate < startDate){
          startDate = cellDate;
          endDate = null;
        } else {
          endDate = cellDate;
        }
      }

      renderCalendar();
      updateVanPackageVisibility();
      compute();
    });

    calGrid.appendChild(btn);
  }
}

function bind(){
  prevMonth.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 1);
    renderCalendar();
  });
  nextMonth.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 1);
    renderCalendar();
  });
  clearDates.addEventListener("click", () => {
    startDate = null;
    endDate = null;
    renderCalendar();
    updateVanPackageVisibility();
    compute();
  });

  vehicleType.addEventListener("change", () => {
    renderVehicles();
    renderKmOptions();
    updateVanPackageVisibility();
    compute();
  });

  vehicleModel.addEventListener("change", () => {
    const type = vehicleType.value;
    const v = (VEHICLES[type] || []).find(x => x.id === vehicleModel.value);
    if (v) baseRate.value = v.base;
    updateVanPackageVisibility();
    compute();
  });

  baseRate.addEventListener("input", compute);

  document.querySelectorAll('input[name="insurance"]').forEach(r => {
    r.addEventListener("change", () => {
      updateVanPackageVisibility();
      compute();
    });
  });

  document.addEventListener("change", (e) => {
    if (e.target && e.target.name === "kmOpt"){
      updateVanPackageVisibility();
      compute();
    }
    if (e.target && e.target.name === "vanPackage"){
      updateVanPackageVisibility();
      compute();
    }
  });

  extraDriver.addEventListener("change", compute);
  under25.addEventListener("change", compute);
}

renderVehicles();
renderKmOptions();
renderCalendar();
updateVanPackageVisibility();
bind();
compute();
