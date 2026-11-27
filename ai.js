// Hybrid AI layer for Booth Compass.
//  - CLOUD (once per expo): turn messy exhibitor listings into structured booth cards.
//  - ON DEVICE (many times, private): read the visitor's goals, score every booth,
//    write booth briefings. The visitor's goals never need to leave the laptop.
import { initializeApp } from "firebase/app";
import {
  getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, InferenceSource,
} from "firebase/ai";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { firebaseConfig, recaptchaEnterpriseSiteKey, CLOUD_MODEL, CLOUD_FALLBACKS } from "./config.js";

// add ?sim to the URL to force simulation (handy for UI work)
export const SIMULATION = !firebaseConfig.apiKey || new URLSearchParams(location.search).has("sim");

let ai = null;
const models = new Map();
export const callLog = [];
const listeners = new Set();
export function onLog(fn) { listeners.add(fn); }
function log(entry) {
  const e = { time: new Date(), ...entry };
  callLog.unshift(e);
  listeners.forEach((fn) => fn(e));
}

export function initAI() {
  if (SIMULATION) return;
  const app = initializeApp(firebaseConfig);
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; // register the printed token in the console
  }
  if (recaptchaEnterpriseSiteKey) {
    console.info("[BoothCompass] App Check: reCAPTCHA Enterprise on", location.hostname);
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  ai = getAI(app, { backend: new GoogleAIBackend() });
}

// ---------- schemas ----------
const CARD_SCHEMA = {
  type: "object",
  properties: {
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          oneLiner: { type: "string" },
          offerings: { type: "array", items: { type: "string" } },
          audience: { type: "array", items: { type: "string" } },
          stage: { type: "string", enum: ["startup", "scaleup", "enterprise", "nonprofit"] },
          pricing: { type: "string" },
          seeking: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["id", "oneLiner", "offerings", "audience", "stage", "pricing", "seeking", "tags"],
      },
    },
  },
  required: ["cards"],
};

const PROFILE_SCHEMA = {
  type: "object",
  properties: {
    role: { type: "string" },
    goals: { type: "array", items: { type: "string" } },
    interests: { type: "array", items: { type: "string" } },
    avoid: { type: "array", items: { type: "string" } },
    budget: { type: "string", enum: ["low", "medium", "high", "unknown"] },
  },
  required: ["role", "goals", "interests", "avoid", "budget"],
};

const SCORE_SCHEMA = {
  type: "object",
  properties: {
    servesVisitor: { type: "boolean" },
    matchesGoal: { type: "boolean" },
    score: { type: "integer", minimum: 0, maximum: 100 },
    reason: { type: "string" },
  },
  required: ["servesVisitor", "matchesGoal", "score", "reason"],
};

const BRIEF_SCHEMA = {
  type: "object",
  properties: {
    briefing: { type: "string" },
    questions: { type: "array", items: { type: "string" } },
  },
  required: ["briefing", "questions"],
};

// ---------- model factory ----------
function model(kind, mode, schema, cloudModel = CLOUD_MODEL) {
  const key = kind + ":" + mode + ":" + cloudModel;
  if (models.has(key)) return models.get(key);
  const params = {
    mode,
    inCloudParams: {
      model: cloudModel,
      generationConfig: schema
        ? { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.2 }
        : { temperature: 0.4 },
    },
  };
  if (schema) params.onDeviceParams = { promptOptions: { responseConstraint: schema } };
  const m = getGenerativeModel(ai, params);
  models.set(key, m);
  return m;
}

function personalMode(privacyShield) {
  return privacyShield ? InferenceMode.ONLY_ON_DEVICE : InferenceMode.PREFER_ON_DEVICE;
}

function withTimeout(promise, ms, what) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${what} timed out after ${ms / 1000}s — check App Check / AI Logic setup (see console)`)), ms)),
  ]);
}

const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
const transient = (e) => /\b(429|500|502|503|504)\b|high demand|overloaded|unavailable|timed out/i.test(String(e?.message || e));
export let retryNotice = null; // UI hook: (text) => void

// Cloud calls: retry with backoff, then fall back to other cloud models.
async function runCloud(task, kind, mode, schema, prompt, opts) {
  const chain = [CLOUD_MODEL, ...CLOUD_FALLBACKS];
  let lastErr;
  for (const name of chain) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await run(task, model(kind, mode, schema, name), prompt, opts);
      } catch (e) {
        lastErr = e;
        if (!transient(e)) throw e;
        const wait = 1500 * 2 ** attempt;
        retryNotice?.(`Cloud busy (${name}) — retrying in ${Math.round(wait / 1000)}s…`);
        await sleepMs(wait);
      }
    }
  }
  throw lastErr;
}
export function setRetryNotice(fn) { retryNotice = fn; }

// Personal calls (prefer on-device): if they end up in a busy cloud, retry a few times.
async function runRetry(task, m, prompt, opts) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await run(task, m, prompt, opts);
    } catch (e) {
      lastErr = e;
      if (!transient(e)) throw e;
      const wait = 1500 * 2 ** attempt;
      retryNotice?.(`Cloud busy — retrying in ${Math.round(wait / 1000)}s…`);
      await sleepMs(wait);
    }
  }
  throw lastErr;
}

async function run(task, m, prompt, { personal }) {
  const t0 = performance.now();
  let result;
  try {
    result = await withTimeout(m.generateContent(prompt), 60000, task);
  } catch (e) {
    console.error("[BoothCompass]", task, e);
    throw e;
  }
  const ms = Math.round(performance.now() - t0);
  const where = result.response.inferenceSource === InferenceSource.ON_DEVICE ? "on_device" : "in_cloud";
  log({
    task, where, ms,
    sent: where === "on_device" ? null : prompt,
    personal,
  });
  return { text: result.response.text(), where, ms };
}

// ---------- device model status ----------
export async function deviceStatus() {
  if (!("LanguageModel" in self)) return "unsupported";
  try { return await self.LanguageModel.availability(); } catch { return "unsupported"; }
}

export async function prepareDevice(onProgress) {
  if (SIMULATION) { onProgress?.(1); return; }
  // Start the Gemini Nano download straight from the click (needs a user gesture), with progress.
  if ("LanguageModel" in self) {
    const s = await self.LanguageModel.create({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      monitor(m) { m.addEventListener("downloadprogress", (e) => onProgress?.(e.loaded)); },
    });
    s.destroy?.();
  }
  // let the Firebase SDK pick up the ready model too
  const m = model("profile", InferenceMode.PREFER_ON_DEVICE, PROFILE_SCHEMA);
  await m.initializeDeviceModel((p) => onProgress?.(p));
}

// ---------- CLOUD: build the expo pack once ----------
export async function buildCards(booths, onBatch) {
  const cards = {};
  const batches = [];
  for (let i = 0; i < booths.length; i += 10) batches.push(booths.slice(i, i + 10));
  for (const batch of batches) {
    let parsed;
    if (SIMULATION) {
      await sleep(350);
      parsed = { cards: batch.map(simCard) };
      log({ task: "Build booth cards (public listings)", where: "simulated", ms: 350, sent: listingPrompt(batch), personal: false });
    } else {
      const { text } = await runCloud("Build booth cards (public listings)", "cards", InferenceMode.ONLY_IN_CLOUD, CARD_SCHEMA, listingPrompt(batch), { personal: false });
      parsed = JSON.parse(text);
    }
    for (const c of parsed.cards) cards[c.id] = c;
    onBatch?.(Object.keys(cards).length, booths.length);
  }
  return cards;
}

function listingPrompt(batch) {
  return (
    "You normalize a trade-show exhibitor directory. For each listing return a card: " +
    "oneLiner (max 14 words), offerings (2-4 short items), audience (who should visit, 2-3), " +
    "stage, pricing (short, 'unknown' if absent), seeking (what the exhibitor wants), tags (3-6 lowercase keywords). " +
    "Use only facts from the listing.\n\n" +
    batch.map((b) => `${b.id} | ${b.name} | ${b.raw}`).join("\n")
  );
}

// ---------- ON DEVICE: private goals -> profile ----------
export async function buildProfile(goalsText, privacyShield) {
  if (SIMULATION) {
    await sleep(500);
    log({ task: "Read your goals", where: "simulated", ms: 500, sent: null, personal: true });
    return simProfile(goalsText);
  }
  const m = model("profile", personalMode(privacyShield), PROFILE_SCHEMA);
  const prompt =
    "Extract a compact visitor profile from these private trade-show goals. " +
    "interests and avoid are short lowercase keywords about what they want to find. Money limits go only in budget, never in interests.\n\nGoals: " + goalsText;
  const { text } = await runRetry("Read your goals", m, prompt, { personal: true });
  return JSON.parse(text);
}

// ---------- ON DEVICE: score one booth ----------
export async function scoreBooth(profile, booth, card, privacyShield) {
  if (SIMULATION) {
    await sleep(70);
    const r = simScore(profile, card);
    log({ task: `Score ${booth.name}`, where: "simulated", ms: 70, sent: null, personal: true });
    return r;
  }
  const m = model("score", personalMode(privacyShield), SCORE_SCHEMA);
  const prompt =
    "You help a trade-show visitor decide which booths to visit. Answer strictly.\n" +
    "servesVisitor: true only if the booth's audience includes people like the visitor's role (e.g. a school owner is served by booths for schools, teachers, parents or students; NOT by booths for gamers, hospitals, banks, developers, large enterprises or government).\n" +
    "matchesGoal: true only if the booth's offerings directly solve one of the visitor's goals. Similar words in a different field do not count (coaching gamers is not tutoring students).\n" +
    "score 0-100: 75+ = must visit, 50-74 = maybe, under 50 = skip. If servesVisitor is false, score under 40. Respect the budget and the avoid list. The visitor's budget is how much they can spend, NOT an interest in budgeting or finance products.\n" +
    "reason: max 18 words, speak to the visitor as 'you', be honest about weak fits.\n" +
    "Visitor: " + JSON.stringify(profile) + "\nBooth: " +
    JSON.stringify({ name: booth.name, ...pick(card, ["oneLiner", "offerings", "audience", "stage", "pricing", "seeking", "tags"]) });
  const { text, where } = await runRetry(`Score ${booth.name}`, m, prompt, { personal: true });
  const r = JSON.parse(text);
  // guard rail: a booth that doesn't serve this visitor can't be a must-visit
  let score = Math.max(0, Math.min(100, Math.round(r.score)));
  if (r.servesVisitor === false) score = Math.min(score, 40);
  else if (r.matchesGoal === false) score = Math.min(score, 65);
  // budget guard: a tight budget can't afford enterprise-only deals
  const priceText = [card.pricing, card.stage, ...(card.audience || [])].join(" ").toLowerCase();
  if (profile.budget === "low" && /enterprise|large (companies|enterprises)|gov/.test(priceText)) {
    score = Math.min(score, 55);
  }
  return { score, reason: r.reason, where };
}

// ---------- ON DEVICE: 30-second briefing ----------
export async function briefBooth(profile, booth, card, privacyShield) {
  if (SIMULATION) {
    await sleep(400);
    log({ task: `Briefing ${booth.name}`, where: "simulated", ms: 400, sent: null, personal: true });
    return simBrief(profile, booth, card);
  }
  const m = model("brief", personalMode(privacyShield), BRIEF_SCHEMA);
  const prompt =
    "Write a spoken 30-second booth briefing (max 70 words, second person, friendly) telling the visitor why this booth " +
    "matters for their goals and what to look at. Then 3 sharp questions to ask the exhibitor that serve the visitor's goals (plain words, say 'trial' not 'pilot') " +
    "without revealing their budget.\nVisitor: " + JSON.stringify(profile) + "\nBooth: " +
    JSON.stringify({ name: booth.name, ...card });
  const { text, where } = await runRetry(`Briefing ${booth.name}`, m, prompt, { personal: true });
  return { ...JSON.parse(text), where };
}

// ---------- helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function pick(o, keys) { const r = {}; keys.forEach((k) => (r[k] = o[k])); return r; }

// ---------- simulation (no API key): deterministic stand-ins ----------
const STOP = new Set("and or the for with from to of a an in on at by w/ - :: | looking seeking pricing run two plus want need like i'm tight budget low small kids not interested also some any my our".split(" "));
function words(s) {
  return (s.toLowerCase().match(/[a-z][a-z0-9+&-]{2,}/g) || []).filter((w) => !STOP.has(w));
}
function simCard(b) {
  const parts = b.raw.split(/;|::| - |--|\|/).map((s) => s.trim()).filter(Boolean);
  const seekPart = parts.find((p) => /seek|looking|wanted|hiring|partner/i.test(p)) || "partners";
  const pricePart = parts.find((p) => /\$|pric|free|tier|per-|subscription|contract/i.test(p)) || "unknown";
  const stage = /seed|pre-seed|startup/i.test(b.raw) ? "startup" : /non-profit|ngo/i.test(b.raw) ? "nonprofit" : /enterprise|gov/i.test(b.raw) ? "enterprise" : "scaleup";
  return {
    id: b.id,
    oneLiner: b.raw.replace(/^[^:|-]*?(?:::|:| - | -- |\| )\s*/, "").split(/;|::/)[0].trim().slice(0, 90),
    offerings: parts.slice(1, 4),
    audience: [parts.slice(-2)[0] || "businesses"],
    stage,
    pricing: pricePart,
    seeking: [seekPart.replace(/^(looking for|seeking)[: ]*/i, "")],
    tags: [...new Set(words(b.raw))].slice(0, 6),
    _raw: b.raw,
  };
}
function simProfile(text) {
  const w = words(text);
  const avoid = [];
  const m = text.toLowerCase().match(/\b(?:not interested in|not|no|avoid|skip)\s+([a-z ]+)/g) || [];
  m.forEach((s) => avoid.push(...words(s.replace(/^(not interested in|not|no|avoid|skip)\s+/, ""))));
  return {
    role: "visitor",
    goals: [text.slice(0, 80)],
    interests: [...new Set(w.filter((x) => !avoid.includes(x)))].slice(0, 12),
    avoid,
    budget: /tight|low|small|limited|cheap/i.test(text) ? "low" : /enterprise|large/i.test(text) ? "high" : "unknown",
  };
}
function simScore(p, c) {
  const hay = ((c._raw || "") + " " + c.tags.join(" ") + " " + c.oneLiner + " " + c.offerings.join(" ") + " " + c.audience.join(" ")).toLowerCase();
  const stem = (w) => (w.length > 5 ? w.slice(0, 5) : w);
  let hits = p.interests.filter((i) => hay.includes(stem(i)));
  let score = hits.length ? Math.min(96, 30 + hits.length * 22) : 12;
  if (p.avoid.some((a) => hay.includes(stem(a)))) score = Math.min(score, 25);
  if (p.budget === "low" && c.stage === "enterprise") score -= 15;
  score = Math.max(3, score);
  const reason = hits.length
    ? `Matches your interest in ${hits.slice(0, 2).join(" and ")}.`
    : "Little overlap with what you told us you need.";
  return { score, reason, where: "simulated" };
}
function simBrief(p, b, c) {
  return {
    briefing: `${b.name}: ${c.oneLiner}. They offer ${c.offerings.slice(0, 2).join(" and ")}. ` +
      `Worth a stop because it touches ${p.interests.slice(0, 2).join(" and ") || "your goals"}. Ask for a live demo first.`,
    questions: [
      `Can you show a live demo of ${c.offerings[0] || "your product"}?`,
      "Who are two customers similar to me, and what changed for them?",
      "What does a small trial project look like, and how long does it take?",
    ],
    where: "simulated",
  };
}

// ---------- CLOUD: translate public (non-personal) lines to Arabic ----------
const AR_SCHEMA = { type: "object", properties: { ar: { type: "array", items: { type: "string" } } }, required: ["ar"] };
export async function translatePublic(lines) {
  if (!lines.length) return [];
  if (SIMULATION) return lines.map(() => "");
  const prompt = "Translate each line into natural Modern Standard Arabic for on-screen subtitles. Keep company names in Latin letters. Return the same number of lines in order.\n" +
    lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
  const { text } = await runCloud("Arabic subtitles (public booth info)", "ar", InferenceMode.ONLY_IN_CLOUD, AR_SCHEMA, prompt, { personal: false });
  return JSON.parse(text).ar;
}
