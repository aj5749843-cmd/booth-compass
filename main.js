import { EXPO as DEMO_EXPO } from "./expo-data.js";
import {
  SIMULATION, initAI, deviceStatus, prepareDevice, buildCards, buildProfile,
  scoreBooth, briefBooth, callLog, onLog, setRetryNotice, translatePublic,
} from "./ai.js";

const $ = (s) => document.querySelector(s);
const NS = "http://www.w3.org/2000/svg";
let expo = loadCustomExpo() || DEMO_EXPO;
const packKey = () => "bc-pack-" + expo.name;

const state = {
  cards: loadPack(),
  profile: null,
  scores: {},
  selected: null,
  route: [],
  busy: false,
};

const EXAMPLES = [
  ["School owner, tight budget", "I run two private schools. Looking for affordable AI tutoring and Arabic reading tools for kids, plus coding programs for teens. Tight budget. Not interested in hardware or VR."],
  ["Seed investor, health AI", "Angel investor. I want seed-stage startups using AI in healthcare or privacy-safe data. Skip large enterprises and consumer gadgets."],
  ["Backend engineer, job hunt", "I'm a backend engineer quietly looking for a new job at a startup that is hiring. I like databases, search and developer tools. My employer must not know."],
  ["Esports academy coach", "I coach a youth esports academy. I need scouting and analytics tools, accessible controllers for players with disabilities, and tournament partners. Low budget."],
];

// ---------------- boot ----------------
initAI();
setExpoTitle();
if (SIMULATION) $("#simBanner").hidden = false;
drawMap();
renderExamples();
refreshPackUI();
refreshDevice();
refreshNet();
addEventListener("online", refreshNet);
addEventListener("offline", refreshNet);
onLog(updateLogCount);
updateLogCount();

$("#packBtn").onclick = onBuildPack;
$("#enableBtn").onclick = onEnableDevice;
$("#findBtn").onclick = onFind;
$("#goals").oninput = refreshFind;
$("#logBtn").onclick = openLog;
$("#logClose").onclick = () => $("#logDialog").close();
$("#importBtn").onclick = () => $("#importDialog").showModal();
$("#importCancel").onclick = () => $("#importDialog").close();
$("#importDemo").onclick = () => switchExpo(DEMO_EXPO, true);
$("#importGo").onclick = onImport;

// ---------------- map ----------------
function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

function drawMap() {
  const svg = $("#map");
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `25 55 ${expo.floor.w - 50} ${expo.floor.h - 30}`);
  for (const z of expo.zones) {
    const [x, y, w, h] = z.box;
    el("rect", { x, y, width: w, height: h, rx: 14, class: "zone-rect", stroke: z.color }, svg);
    const t = el("text", { x: x + 16, y: y + 26, class: "zone-label", fill: z.color }, svg);
    t.textContent = z.label.toUpperCase();
  }
  const ent = el("g", { class: "entrance" }, svg);
  el("rect", { x: expo.floor.entrance.x - 60, y: expo.floor.h - 6, width: 120, height: 8, rx: 4, fill: "#2a3f5f" }, ent);
  el("text", { x: expo.floor.entrance.x, y: expo.floor.h + 16 }, ent).textContent = "▲ ENTRANCE";

  el("g", { id: "routeLayer" }, svg);
  for (const b of expo.booths) {
    const g = el("g", { class: "booth", id: "b-" + b.id, tabindex: 0 }, svg);
    el("rect", { x: b.x, y: b.y, width: b.w, height: b.h }, g);
    const label = b.w > 60 ? b.name : b.name.split(" ")[0];
    const t = el("text", { x: b.x + 5, y: b.y + 14 }, g);
    t.textContent = label.length > (b.w > 60 ? 18 : 9) ? label.slice(0, b.w > 60 ? 17 : 8) + "…" : label;
    el("text", { x: b.x + 5, y: b.y + b.h - 6, class: "code" }, g).textContent = b.id;
    const title = el("title", {}, g);
    title.textContent = b.name;
    g.addEventListener("click", () => select(b.id));
    g.addEventListener("keydown", (e) => e.key === "Enter" && select(b.id));
  }
  svg.appendChild($("#routeLayer"));
}

function tier(score) { return score >= 75 ? "must" : score >= 50 ? "maybe" : "skip"; }

function paintBooth(id) {
  const g = $("#b-" + id);
  g.classList.remove("must", "maybe", "skip", "scanning");
  const s = state.scores[id];
  if (s) g.classList.add(tier(s.score));
}

function drawRoute() {
  const layer = $("#routeLayer");
  layer.innerHTML = "";
  if (!state.route.length) return;
  const pts = [expo.floor.entrance, ...state.route.map(center)];
  el("polyline", { points: pts.map((p) => `${p.x},${p.y}`).join(" "), class: "route-line" }, layer);
  state.route.forEach((id, i) => {
    const c = center(id);
    const g = el("g", { class: "route-dot" }, layer);
    el("circle", { cx: c.x, cy: c.y, r: 9 }, g);
    el("text", { x: c.x, y: c.y + 3.5 }, g).textContent = i + 1;
  });
}

function center(id) {
  const b = expo.booths.find((x) => x.id === id);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

// nearest-neighbour walk from the entrance over the must-visit booths
function planRoute() {
  const must = Object.entries(state.scores).filter(([, s]) => s.score >= 75).map(([id]) => id);
  const top = must.length ? must : Object.entries(state.scores).sort((a, b) => b[1].score - a[1].score).slice(0, 4).map(([id]) => id);
  const left = top.slice(0, 8);
  const route = [];
  let cur = expo.floor.entrance;
  while (left.length) {
    left.sort((a, b) => dist(cur, center(a)) - dist(cur, center(b)));
    const next = left.shift();
    route.push(next);
    cur = center(next);
  }
  state.route = route;
  drawRoute();
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ---------------- step 1: expo pack ----------------
function loadPack() {
  try { return JSON.parse(localStorage.getItem(packKey())) || null; } catch { return null; }
}
function refreshPackUI() {
  const ready = !!state.cards;
  $("#packStatus").textContent = ready ? `✓ ${Object.keys(state.cards).length} booth cards saved on this device — works offline` : "";
  $("#packBtn").textContent = ready ? "Rebuild pack" : "Build expo pack";
  $("#packBar").style.width = ready ? "100%" : "0";
  refreshFind();
}
async function onBuildPack() {
  if (!navigator.onLine) { $("#packStatus").textContent = "You're offline — the pack needs the cloud once."; return; }
  $("#packBtn").disabled = true;
  $("#packStatus").textContent = "Cloud is reading the public exhibitor directory…";
  try {
    setRetryNotice((msg) => ($("#packStatus").textContent = msg));
    const cards = await buildCards(expo.booths, (done, total) => {
      $("#packBar").style.width = (100 * done) / total + "%";
      $("#packStatus").textContent = `Cloud: ${done}/${total} booth cards`;
    });
    state.cards = cards;
    try { localStorage.setItem(packKey(), JSON.stringify(cards)); } catch { /* storage blocked */ }
  } catch (e) {
    $("#packStatus").textContent = "Cloud step failed: " + e.message;
  }
  $("#packBtn").disabled = false;
  refreshPackUI();
}

// ---------------- device model ----------------
async function refreshDevice() {
  const chip = $("#deviceChip");
  if (SIMULATION) { chip.textContent = "On-device AI: simulated"; chip.className = "chip warn"; return; }
  const s = await deviceStatus();
  const map = {
    available: ["On-device AI: ready (Gemini Nano)", "chip ok"],
    downloadable: ["On-device AI: tap Enable to download", "chip warn"],
    downloading: ["On-device AI: downloading…", "chip warn"],
    unavailable: ["On-device AI: not on this device", "chip bad"],
    unsupported: ["On-device AI: not supported here", "chip bad"],
  };
  [chip.textContent, chip.className] = map[s] || map.unsupported;
  $("#enableBtn").hidden = s === "available";
}
async function onEnableDevice() {
  $("#enableBtn").disabled = true;
  try {
    await prepareDevice((p) => ($("#deviceChip").textContent = `On-device AI: downloading ${Math.round(p * 100)}%`));
  } catch (e) {
    $("#scoreStatus").textContent = "Could not start on-device model: " + e.message;
  }
  $("#enableBtn").disabled = false;
  refreshDevice();
}

function refreshNet() {
  const chip = $("#netChip");
  chip.textContent = navigator.onLine ? "● Online" : "● Offline — on-device still works";
  chip.className = "chip " + (navigator.onLine ? "ok" : "warn");
}

// ---------------- step 2: score ----------------
function renderExamples() {
  const box = $("#examples");
  for (const [label, text] of EXAMPLES) {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = () => { $("#goals").value = text; refreshFind(); };
    box.appendChild(b);
  }
}
function refreshFind() {
  $("#findBtn").disabled = state.busy || !state.cards || $("#goals").value.trim().length < 10;
}

function quickOverlap(profile, card) {
  const hay = [card.oneLiner, ...card.tags, ...card.offerings, ...card.audience].join(" ").toLowerCase();
  return profile.interests.reduce((n, w) => n + (hay.includes(w.toLowerCase()) ? 1 : 0), 0);
}

async function onFind() {
  const shield = $("#shield").checked;
  state.busy = true; refreshFind();
  $("#shield").disabled = true;
  state.scores = {}; state.route = []; drawRoute();
  expo.booths.forEach((b) => paintBooth(b.id));
  renderResults();
  $("#scoreBar").style.width = "0";
  try {
    setRetryNotice((msg) => ($("#scoreStatus").textContent = msg));
    $("#scoreStatus").textContent = "Reading your goals on this device…";
    state.profile = await buildProfile($("#goals").value.trim(), shield);
    // likely matches first, so the map lights up where it matters
    const order = [...expo.booths].sort(
      (a, b) => quickOverlap(state.profile, state.cards[b.id]) - quickOverlap(state.profile, state.cards[a.id]),
    );
    let done = 0;
    for (const b of order) {
      $("#b-" + b.id).classList.add("scanning");
      $("#scoreStatus").textContent = `Scoring ${b.name}…`;
      state.scores[b.id] = await scoreBooth(state.profile, b, state.cards[b.id], shield);
      paintBooth(b.id);
      done++;
      $("#scoreBar").style.width = (100 * done) / order.length + "%";
      if (done % 4 === 0 || done === order.length) renderResults();
    }
    planRoute();
    const must = Object.values(state.scores).filter((s) => s.score >= 75).length;
    $("#scoreStatus").textContent = `Done — ${must} must-visit booths, route drawn on the map.`;
  } catch (e) {
    $("#scoreStatus").textContent = shield && /device|unavailable|not supported|ONLY_ON_DEVICE/i.test(e.message)
      ? "Privacy shield is on but on-device AI isn't available here. Enable it, or turn the shield off to allow cloud fallback."
      : "Something went wrong: " + e.message;
  }
  state.busy = false; refreshFind();
  $("#shield").disabled = false;
}

const SRC = { on_device: "💻 on device", in_cloud: "☁️ cloud", simulated: "⚙️ simulated" };

function renderResults() {
  const list = $("#results");
  const ranked = Object.entries(state.scores).sort((a, b) => b[1].score - a[1].score);
  if (!ranked.length) { list.innerHTML = '<li class="empty">Your ranked booths will appear here.</li>'; return; }
  list.innerHTML = "";
  ranked.slice(0, 15).forEach(([id, s], i) => {
    const b = expo.booths.find((x) => x.id === id);
    const li = document.createElement("li");
    if (state.selected === id) li.classList.add("sel");
    li.innerHTML = `<span class="rank">${i + 1}</span><span class="nm">${esc(b.name)}</span>
      <span class="score ${tier(s.score)}">${s.score}</span>
      <span class="why">${esc(s.reason)} <span class="src">· ${SRC[s.where] || ""}</span></span>`;
    li.onclick = () => select(id);
    list.appendChild(li);
  });
}

// ---------------- detail + briefing ----------------
function select(id) {
  if (state.selected) $("#b-" + state.selected)?.classList.remove("selected");
  state.selected = id;
  $("#b-" + id).classList.add("selected");
  renderResults();
  renderDetail();
}

function renderDetail() {
  const id = state.selected;
  const b = expo.booths.find((x) => x.id === id);
  const c = state.cards?.[id];
  const s = state.scores[id];
  const zone = expo.zones.find((z) => z.code === b.zone);
  const box = $("#detail");
  if (!c) {
    box.innerHTML = `<div class="card"><h3>${esc(b.name)}</h3><p class="meta">${b.id} · ${esc(zone.label)}</p>
      <p class="hint">Raw directory listing:</p><p class="one">${esc(b.raw)}</p>
      <p class="hint">Build the expo pack to get a clean booth card.</p></div>`;
    return;
  }
  box.innerHTML = `<div class="card">
    <button class="btn-ghost drawer-close" id="drawerClose">✕</button>
    <h3>${esc(b.name)}</h3>
    <p class="meta">Booth ${b.id} · ${esc(zone.label)} · ${esc(c.stage)}</p>
    <p class="one">${esc(c.oneLiner)}</p>
    ${s ? `<div class="fit"><span class="big score-${tier(s.score)}">${s.score}</span><span class="score ${tier(s.score)}" style="margin-left:8px">${tier(s.score).replace("must", "must visit")}</span>
      <p style="margin:6px 0 0;font-size:13px">${esc(s.reason)}</p><span class="src">${SRC[s.where] || ""}</span></div>` : ""}
    <h4>Offers</h4><ul>${c.offerings.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
    <h4>Best for</h4><ul>${c.audience.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
    <h4>They're looking for</h4><ul>${c.seeking.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
    <h4>Pricing</h4><p class="one" style="margin:0">${esc(c.pricing)}</p>
    <h4>Tags</h4><div class="tags">${c.tags.map((t) => `<button data-tag="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <p class="hint" id="tagNote" style="margin-top:6px">Tip: click a tag to find similar booths.</p>
    <div class="row" style="margin-top:14px"><button class="btn" id="briefBtn">▶ 30-second booth reel</button></div>
    ${state.profile ? "" : '<p class="hint" style="margin-top:8px">Add your goals and run “Find my booths” to make the reel personal.</p>'}
    <div id="briefBox"></div>
  </div>`;
  $("#briefBtn").onclick = () => onBrief(b, c);
  document.querySelectorAll(".tags button").forEach((btn) => (btn.onclick = () => highlightTag(btn.dataset.tag)));
  document.querySelectorAll(".booth.tagmatch").forEach((g) => g.classList.remove("tagmatch"));
  $("#drawerClose").onclick = () => document.querySelector(".right").classList.remove("open");
  document.querySelector(".right").classList.add("open");
}

function genericBrief(b, c) {
  return {
    briefing: `${b.name}, booth ${b.id}. ${c.oneLiner}. They offer ${c.offerings.slice(0, 2).join(" and ")}. ` +
      `Best for ${c.audience.slice(0, 2).join(" and ")}.`,
    questions: [
      `Can you show a live demo of ${c.offerings[0] || "your product"}?`,
      "Who is a customer like me, and what changed for them?",
      "What does a small pilot cost and how long does it take?",
    ],
    where: "generic",
  };
}

async function onBrief(b, c) {
  const out = $("#briefBox");
  let r;
  if (state.profile) {
    out.innerHTML = `<div class="brief"><span class="speaking">Writing your personal briefing…</span></div>`;
    try {
      r = await briefBooth(state.profile, b, c, $("#shield").checked);
    } catch (e) {
      out.innerHTML = `<div class="brief"><p>Couldn't write the briefing: ${esc(e.message)}</p></div>`;
      return;
    }
    if (state.selected !== b.id) return;
  } else {
    r = genericBrief(b, c);
  }
  out.innerHTML = `<div class="brief">
    <span class="speaking">Briefing · ${SRC[r.where] || "generic (no goals yet)"}</span>
    <p>${esc(r.briefing)}</p>
    <h4>Ask them</h4><ul>${r.questions.slice(0, 3).map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
    <button class="btn btn-secondary" id="replayBtn" style="margin-top:8px">↻ Replay reel</button></div>`;
  $("#replayBtn").onclick = () => playReel(b, c, r);
  playReel(b, c, r);
}

// ---------- 30-second booth reel: scenes narrated one by one ----------
function miniMap(b) {
  const W = expo.floor.w, H = expo.floor.h;
  const zones = expo.zones.map((z) => {
    const [x, y, w, h] = z.box;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="none" stroke="${z.color}" stroke-opacity=".5" stroke-dasharray="6 5"/>`;
  }).join("");
  const booths = expo.booths.map((o) => {
    const me = o.id === b.id;
    return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="5" fill="${me ? "#19c3b1" : "#22344f"}" ${me ? 'class="mm-me"' : ""}/>`;
  }).join("");
  const route = state.route.length
    ? `<polyline points="${[expo.floor.entrance, ...state.route.map(center)].map((p) => p.x + "," + p.y).join(" ")}" fill="none" stroke="#ff6b8a" stroke-width="5" stroke-dasharray="12 9"/>`
    : `<line x1="${expo.floor.entrance.x}" y1="${expo.floor.entrance.y}" x2="${center(b.id).x}" y2="${center(b.id).y}" stroke="#ff6b8a" stroke-width="5" stroke-dasharray="12 9"/>`;
  const c = center(b.id);
  return `<svg viewBox="25 55 ${W - 50} ${H}" class="mm">${zones}${booths}${route}
    <circle cx="${c.x}" cy="${c.y}" r="22" fill="none" stroke="#fff" stroke-width="4" class="mm-ping"/>
    <text x="${expo.floor.entrance.x}" y="${H + 10}" fill="#94a6bf" font-size="22" text-anchor="middle">▲ ENTRANCE</text></svg>`;
}

async function playReel(b, c, r) {
  await voicesReady();
  const zone = expo.zones.find((z) => z.code === b.zone);
  const s = state.scores[b.id];
  const stop = state.route.indexOf(b.id);
  const meters = Math.round(dist(expo.floor.entrance, center(b.id)) / 10);
  const list = (a) => (a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a[a.length - 1] : a[0] || "");
  const qs = r.questions.slice(0, 3);
  // each scene = what you see + what you hear
  const scenes = [
    { html: `<div class="sc sc-title"><span class="sc-code" style="background:${zone.color}">${esc(b.id)}</span>
        <h2>${esc(b.name)}</h2><p>${esc(zone.label)} · ${esc(c.stage)}</p></div>`,
      say: `${b.name}. Booth ${b.id.replace("-", " ")}, in ${zone.label}.` },
    { html: `<div class="sc"><p class="sc-kicker">What they do</p><h3>${esc(c.oneLiner)}</h3></div>`,
      say: c.oneLiner + "." },
    { html: `<div class="sc"><p class="sc-kicker">They offer</p><div class="sc-chips">${c.offerings.slice(0, 4).map((o, i) => `<span style="animation-delay:${0.2 + i * 0.4}s">${esc(o)}</span>`).join("")}</div></div>`,
      say: `They offer ${list(c.offerings.slice(0, 3))}.` },
    { html: `<div class="sc sc-map"><p class="sc-kicker">Where to find it</p>${miniMap(b)}
        <p class="sc-sub">${stop >= 0 ? `Stop ${stop + 1} of ${state.route.length} on your route` : `${zone.label} · about ${meters} m from the entrance`}</p></div>`,
      say: stop >= 0 ? `It's stop ${stop + 1} on your route, in the ${zone.label} area.` : `You'll find it in the ${zone.label} area, about ${meters} meters from the entrance.` },
    { html: `<div class="sc"><p class="sc-kicker">${s ? "Why it fits you" : "Who should visit"}</p>
        ${s ? `<div class="sc-score ${tier(s.score)}">${s.score}</div>` : ""}<h3>${esc(s ? s.reason : list(c.audience))}</h3></div>`,
      say: s ? `Your match score is ${s.score}. ${s.reason}` : `Best for ${list(c.audience)}.` },
    ...qs.map((q, n) => ({
      html: `<div class="sc"><p class="sc-kicker">Ask them</p><ol class="sc-qs">${qs.map((x, k) =>
        `<li class="${k === n ? "on" : k < n ? "done" : "todo"}">${esc(x)}</li>`).join("")}</ol></div>`,
      say: (n === 0 ? "Ask them. " : "") + q,
    })),
  ];

  $("#reel")?.remove();
  const ov = document.createElement("div");
  ov.id = "reel";
  ov.innerHTML = `<div class="reel-box"><div class="reel-stage"></div>
    <div class="reel-dots">${scenes.map(() => "<i></i>").join("")}</div>
    <div class="reel-ctl"><span class="speaking"><span class="wave"><i></i><i></i><i></i></span> ${SRC[r.where] || "generic"}</span>
    <select id="reelVoice" title="Voice"></select>
    <select id="reelRate" title="Speed"><option value="0.9">0.9×</option><option value="1">1×</option><option value="1.1">1.1×</option></select>
    <button class="btn-ghost" id="reelClose">Close</button></div>
    <div class="reel-subs"><p class="sub-en"></p><p class="sub-ar" dir="rtl" lang="ar"></p></div></div>`;
  document.body.appendChild(ov);
  const stage = ov.querySelector(".reel-stage");
  const dots = ov.querySelectorAll(".reel-dots i");
  const subEn = ov.querySelector(".sub-en");
  const subAr = ov.querySelector(".sub-ar");
  // voice + speed pickers (remembered on this device)
  const vSel = ov.querySelector("#reelVoice"), rSel = ov.querySelector("#reelRate");
  const voices = englishVoices();
  vSel.innerHTML = voices.map((v) => `<option value="${esc(v.name)}">${esc(v.name.replace(/Microsoft |Google /, "").replace(/ Online \(Natural\)/, " ★"))}</option>`).join("") || "<option>Default voice</option>";
  const saved = load("bc-voice"), savedRate = load("bc-rate");
  if (saved && voices.some((v) => v.name === saved)) vSel.value = saved;
  rSel.value = savedRate || "1";
  vSel.onchange = () => save("bc-voice", vSel.value);
  rSel.onchange = () => save("bc-rate", rSel.value);
  // Arabic subtitles: on-device translator when available, else cloud for public lines only
  const arabic = translateScenes(scenes, !!state.profile && !!s);
  let i = 0, timer, alive = true;
  const voiceFor = () => voices.find((v) => v.name === vSel.value) || voices[0] || null;
  const next = () => {
    if (!alive) return;
    if (i >= scenes.length) { ov.querySelector(".wave")?.remove(); return; }
    const sc = scenes[i];
    // keep the "ask them" list in place; only swap other scenes
    stage.innerHTML = sc.html;
    dots.forEach((d, k) => d.className = k < i ? "done" : k === i ? "on" : "");
    subEn.textContent = sc.say;
    subAr.textContent = "";
    const idx = i;
    arabic.then((ar) => { if (alive && i - 1 === idx && ar[idx]) subAr.textContent = ar[idx]; });
    i++;
    const fallbackMs = Math.max(2600, sc.say.split(" ").length * 380);
    const minMs = Math.max(2200, sc.say.split(" ").length * 260); // every scene stays on screen at least this long
    const t0 = performance.now();
    if (!("speechSynthesis" in self)) { timer = setTimeout(next, fallbackMs); return; }
    const u = new SpeechSynthesisUtterance(sc.say);
    const v = voiceFor(); if (v) u.voice = v;
    u.lang = v?.lang || "en-US"; u.rate = parseFloat(rSel.value) || 1;
    let done = false;
    const go = () => {
      if (done) return; done = true; clearTimeout(timer);
      timer = setTimeout(next, Math.max(450, minMs - (performance.now() - t0)));
    };
    u.onend = go; u.onerror = go;
    timer = setTimeout(go, fallbackMs + 4000); // safety if the browser never fires onend
    speechSynthesis.speak(u);
  };
  const close = () => { alive = false; clearTimeout(timer); try { speechSynthesis.cancel(); } catch {} ov.remove(); };
  ov.querySelector("#reelClose").onclick = close;
  ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
  try { speechSynthesis.cancel(); } catch {}
  next();
}

// ---------- voices ----------
function englishVoices() {
  if (!("speechSynthesis" in self)) return [];
  const vs = speechSynthesis.getVoices().filter((v) => /^en(-|_)/i.test(v.lang));
  const rank = (v) => (/natural/i.test(v.name) ? 6 : 0) + (/online/i.test(v.name) ? 2 : 0) + (/google/i.test(v.name) ? 3 : 0) + (/en-US/i.test(v.lang) ? 1 : 0);
  return vs.sort((a, b) => rank(b) - rank(a));
}
function pickVoice() { return englishVoices()[0] || null; }
// voices load asynchronously; wait for them (max 1.5 s) so we never fall back to a robotic default
function voicesReady() {
  if (!("speechSynthesis" in self) || speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((res) => {
    const t = setTimeout(res, 1500);
    speechSynthesis.addEventListener("voiceschanged", () => { clearTimeout(t); res(); }, { once: true });
  });
}
function load(k) { try { return localStorage.getItem(k); } catch { return null; } }
function save(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } }

// ---------- Arabic subtitles ----------
let translatorP = null;
async function onDeviceTranslator() {
  if (!("Translator" in self)) return null;
  if (!translatorP) {
    translatorP = (async () => {
      const opts = { sourceLanguage: "en", targetLanguage: "ar" };
      const a = await self.Translator.availability(opts);
      if (a === "unavailable") return null;
      return await self.Translator.create(opts);
    })().catch(() => null);
  }
  return translatorP;
}
async function translateScenes(scenes, hasPersonal) {
  const lines = scenes.map((s) => s.say);
  try {
    const t = await onDeviceTranslator();
    if (t) return await Promise.all(lines.map((l) => t.translate(l)));
  } catch { /* fall through */ }
  // cloud fallback: only lines that carry nothing personal (scene 5+ may reflect your goals)
  const publicIdx = lines.map((_, k) => k).filter((k) => !hasPersonal || k < 4);
  try {
    const ar = await translatePublic(publicIdx.map((k) => lines[k]));
    const out = [];
    publicIdx.forEach((k, n) => (out[k] = ar[n]));
    return out;
  } catch { return []; }
}

function speak(text) {
  if (!("speechSynthesis" in self)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(); if (v) u.voice = v;
  u.lang = "en-US";
  speechSynthesis.speak(u);
}

// ---------- tags: click to light up every booth with the same tag ----------
function highlightTag(tag) {
  const same = Object.entries(state.cards || {}).filter(([, c]) => c.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())).map(([id]) => id);
  document.querySelectorAll(".booth.tagmatch").forEach((g) => g.classList.remove("tagmatch"));
  same.forEach((id) => $("#b-" + id)?.classList.add("tagmatch"));
  document.querySelectorAll(".tags button").forEach((btn) => btn.classList.toggle("on", btn.dataset.tag === tag));
  $("#tagNote").innerHTML = `<b>${same.length}</b> booth${same.length === 1 ? "" : "s"} tagged “${esc(tag)}” glow on the map. <a href="#" id="tagClear">Clear</a>`;
  $("#tagClear").onclick = (e) => { e.preventDefault(); clearTag(); };
}
function clearTag() {
  document.querySelectorAll(".booth.tagmatch").forEach((g) => g.classList.remove("tagmatch"));
  document.querySelectorAll(".tags button.on").forEach((b) => b.classList.remove("on"));
  if ($("#tagNote")) $("#tagNote").textContent = "Tip: click a tag to find similar booths.";
}

// ---------------- transparency log ----------------
function updateLogCount() {
  const leaks = callLog.filter((e) => e.where === "in_cloud" && e.personal).length;
  const cloud = callLog.filter((e) => e.where === "in_cloud").length;
  $("#logCount").textContent = leaks ? `${leaks} personal` : String(cloud);
}
function openLog() {
  const dev = callLog.filter((e) => e.where === "on_device").length;
  const cloud = callLog.filter((e) => e.where === "in_cloud").length;
  const leaks = callLog.filter((e) => e.where === "in_cloud" && e.personal).length;
  const sim = callLog.filter((e) => e.where === "simulated").length;
  $("#logSummary").innerHTML = `${dev} AI calls ran on this device · ${cloud} went to the cloud` +
    (sim ? ` · ${sim} simulated` : "") +
    ` · <b class="${leaks ? "alert" : ""}">${leaks} contained your personal goals</b>`;
  $("#logList").innerHTML = callLog.slice(0, 120).map((e) => `<li>
    <span class="where ${e.where}">${SRC[e.where] || e.where}</span> · ${esc(e.task)} · ${e.ms} ms · ${e.time.toLocaleTimeString()}
    ${e.sent ? `<pre>${esc(e.sent.slice(0, 900))}</pre>` : `<div class="hint" style="margin:4px 0 0">Nothing left this device.</div>`}
    ${e.where === "in_cloud" && e.personal ? '<div class="alert">⚠ Contained your goals (privacy shield was off and no on-device model).</div>' : ""}
  </li>`).join("") || '<li class="hint">No AI calls yet.</li>';
  $("#logDialog").showModal();
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------------- bring your own expo ----------------
function setExpoTitle() {
  $("#expoName").textContent = `${expo.name} · ${expo.booths.length} booths · ${expo.city}`;
}
function loadCustomExpo() {
  try { return JSON.parse(localStorage.getItem("bc-custom-expo")) || null; } catch { return null; }
}
function switchExpo(next, isDemo) {
  expo = next;
  try {
    if (isDemo) localStorage.removeItem("bc-custom-expo");
    else localStorage.setItem("bc-custom-expo", JSON.stringify(next));
  } catch { /* storage blocked */ }
  state.cards = loadPack(); state.scores = {}; state.route = []; state.selected = null; state.profile = null;
  setExpoTitle(); drawMap(); refreshPackUI(); renderResults();
  $("#detail").innerHTML = '<div class="placeholder"><p>Select a booth on the map or in your shortlist.</p></div>';
  $("#importDialog").close();
}
// Paste any exhibitor directory: one exhibitor per line, "Name - description" (also | or :).
function onImport() {
  const name = $("#importName").value.trim() || "My expo";
  const lines = $("#importText").value.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 3);
  if (lines.length < 3) { $("#importMsg").textContent = "Paste at least 3 exhibitors, one per line."; return; }
  const items = lines.slice(0, 120).map((line, i) => {
    const m = line.match(/^(.{2,60}?)\s*(?:\||::|:| - | – |—|,|\t)\s*(.+)$/);
    const nm = (m ? m[1] : line.split(/\s+/).slice(0, 3).join(" ")).trim();
    return { name: nm, raw: line, i };
  });
  // auto floor plan: a simple grid of equal booths
  const n = items.length;
  const cols = Math.ceil(Math.sqrt(n * 1.9));
  const rows = Math.ceil(n / cols);
  const area = { x: 60, y: 110, w: 1080, h: 560 };
  const gw = area.w / cols, gh = Math.min(70, area.h / rows);
  const booths = items.map((it) => {
    const c = it.i % cols, r = Math.floor(it.i / cols);
    return {
      id: "B-" + String(it.i + 1).padStart(3, "0"), name: it.name, zone: "ALL", raw: it.raw,
      x: area.x + c * gw + 4, y: area.y + r * gh + 4, w: gw - 8, h: gh - 8,
    };
  });
  switchExpo({
    name, city: "imported directory",
    floor: { w: 1200, h: 700, entrance: { x: 600, y: 690 } },
    zones: [{ code: "ALL", label: "All exhibitors", color: "#19c3b1", box: [40, 70, 1120, rows * gh + 70] }],
    booths,
  }, false);
}
