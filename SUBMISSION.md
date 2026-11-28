# Booth Compass — submission kit (#BuildHybridAI 2026)

## 1. Devpost text (paste into the submission form)

**Project name:** Booth Compass

**Tagline:** Plan any expo in minutes, without telling anyone why you're there.

**Video:** https://youtu.be/57muJgcfaJo
**Live demo:** https://aj5749843-cmd.github.io/booth-compass/ (desktop Chrome with Gemini Nano)
**Code (Apache-2.0):** https://github.com/aj5749843-cmd/booth-compass

### Inspiration
Large expos have hundreds of booths. The floor plan shows names, not reasons, so visitors now paste the exhibitor list into a cloud chatbot together with their real goals: the budget, the vendor they want to replace, the job they are quietly hunting. Planning a visit should not require handing your intentions to a server, especially on hotel or conference Wi-Fi.

### What it does
- **Expo pack (cloud, once per expo):** Gemini in the cloud reads the public exhibitor list and turns it into clean, structured booth cards. Only public data is sent. The pack is cached, so the rest works offline.
- **Private goals (on device):** the visitor writes their honest goals. Gemini Nano turns them into a compact profile on the laptop.
- **Score every booth (on device):** Nano matches each booth to the visitor's goals, one short call per booth, and the floor plan lights up live: must-visit, maybe, skip.
- **Guard rails:** small models get fooled by shared buzzwords, so Nano answers narrow questions (what does this booth sell, which of your goals does it fulfil, is it enterprise-only) and the final score is computed in code, with checks against the booth card. An enterprise-only platform can't top a tight-budget plan.
- **Route:** a walking route from the entrance through the must-visit booths.
- **30-second booth reel (on device):** an animated briefing per booth (what they do, where they are on a mini-map, why they fit you, three questions to ask that don't reveal your budget), with English narration and Arabic subtitles. Subtitles use Chrome's on-device Translator first.
- **Privacy shield + "What left my device?":** with the shield on, personal tasks run ONLY_ON_DEVICE and never fall back to the cloud. A transparency log lists every AI call, where it ran, how long it took, and the exact text sent to the cloud. In our recorded run: 63 calls on device, 2 to the cloud (public booth text only), 0 containing personal goals.
- **Any expo:** paste any public exhibitor list and Booth Compass builds a floor grid for it. Tap a tag to find similar booths.

### How we built it with Firebase AI Logic
One SDK (`firebase/ai`), with routing that follows the data:
- `InferenceMode.ONLY_IN_CLOUD` + `responseJsonSchema` for the one-time, public, heavy job (exhibitor list → booth cards), with retries and fallback models when the cloud is busy.
- `InferenceMode.PREFER_ON_DEVICE` (or `ONLY_ON_DEVICE` with the privacy shield) + `onDeviceParams.promptOptions.responseConstraint` for every personal task: goals → profile, booth matching, briefings. Structured JSON keeps Nano's answers reliable.
- `response.inferenceSource` feeds the transparency log, so the user sees on-device vs. cloud for every call.
- `initializeDeviceModel()` runs from a user click, with download progress.
- App Check (reCAPTCHA Enterprise) protects the Gemini endpoints.
- Plain HTML/CSS/JavaScript, built with Vite into a single page on GitHub Pages.

Why hybrid is the right design: the cloud does the one expensive job on public data; the device does the many small jobs on private data, free per call, private by default, and available offline inside crowded halls.

### Challenges
- **Accuracy of a small model:** our first version asked Nano for a 0-100 score and it rewarded buzzwords (a gaming coach for "AI tutoring", a budgeting app for "tight budget"). We redesigned scoring as goal matching plus code-side guard rails, and the false must-visits disappeared.
- **Speed:** scoring 60 booths on device takes several minutes on a laptop, so likely matches are scored first and the map updates live.
- **Honest fallbacks:** when Nano is slow, the app retries on device instead of quietly sending personal data to the cloud.

### Accomplishments
A full planning flow where the personal part never leaves the laptop, and a log that proves it.

### What we learned
Hybrid AI is a data-routing decision: route by sensitivity, not just by speed. Small on-device models work best when you ask them narrow questions and let code make the final call.

### What's next
Floor-plan import from organizer PDFs, multi-day agendas for conference sessions, and an Android build with Gemini Nano.

### Built with
firebase-ai-logic, gemini-nano, gemini-api, chrome-prompt-api, chrome-translator-api, firebase-app-check, recaptcha-enterprise, javascript, html, css, vite, github-pages

### Built during the submission period
Everything in this repository was built between 25 and 30 November 2026. No pre-existing code. The expo and all exhibitors in the demo are fictional.

## 2. Demo video script (2:50, English voice-over, max 3:00)

**Story:** Khalid (fictional) runs a small business-analytics company in Jeddah that helps retail and SME clients make sense of their data. Tomorrow he flies to Riyadh for one day at NEXA Tech Expo (fictional, 60 booths). Tonight, in his hotel room on public Wi-Fi, he plans. Tomorrow, he signs a contract.
**Goals typed in the demo:** "I run a small business-analytics company for retail and SME clients. Tight budget. I want a forecasting and BI dashboard platform we can partner with, privacy-safe synthetic data for client projects, and fast semantic search with a free tier. Skip big-enterprise platforms."
**Promise in one line:** *Smart advice about your private goals, without sending them anywhere.*
**Recording:** Chrome desktop, 1920x1080, browser zoom 110%, Gemini Nano ready, Privacy shield ON, booth cards already saved. Speed up on-device scoring (8x) with a small "8x" badge.
**Style:** calm, confident voice; slow mouse; one idea per scene; short bold captions bottom-left. Scenes 1, 2 and 10 use simple title cards (text on dark background), with no footage of real events or brands.

| # | Time | Screen | On-screen caption | Voice-over |
|---|---|---|---|---|
| 1 Hook | 0:00–0:12 | Title card "The night before the expo" → slow zoom across the expo map | **Tomorrow: 60 booths. 1 day.** | "Tomorrow, Khalid flies to Riyadh for the biggest tech expo of his year. Sixty booths, one day, and no time to waste." |
| 2 Problem | 0:12–0:26 | Hotel-night title card → cursor on the empty goals box | **Hotel Wi-Fi. Confidential plans.** | "He runs a small business-analytics company. His budget is tight, his growth plans are confidential, and tonight he's on hotel Wi-Fi. Yet every AI planner wants the same thing: send us your goals." |
| 3 Solution | 0:26–0:42 | Header chips: Online · On-device AI ready (Gemini Nano) · Privacy shield ✓ | **Hybrid AI: cloud + on-device** | "Booth Compass is a hybrid AI app built with Firebase AI Logic. Public data goes to the cloud. Personal data stays on his laptop, with Gemini Nano running in Chrome." |
| 4 Cloud part | 0:42–0:56 | "60 booth cards saved on this device" (brief glimpse of Build expo pack) | **Cloud: public listings only** | "The cloud reads the public exhibitor list once and builds clean booth cards. Nothing about Khalid is sent, and the cards are saved for offline use." |
| 5 Private part | 0:56–1:18 | Type the goals → Find my booths → booths light up one by one (8x) | **On-device: Gemini Nano** | "Now the private part. Forecasting dashboards, privacy-safe data, semantic search, and a tight budget. Gemini Nano reads it and scores all sixty booths, right here on the device." |
| 6 Result | 1:18–1:36 | Final map: Must-visit: Mirage Synth + Vectorly, Sahm Analytics as maybe, pink route; zoom on a grey enterprise booth (Larkspur Labs) | **Must-visits + 1 route** | "His must-visit booths and the shortest walking route. Guard rails keep the small model honest: an enterprise-only platform for governments can't top a tight-budget plan." |
| 7 Briefing | 1:36–2:04 | Click Mirage Synth → 30-second booth reel: mini-map, why it fits, 3 questions, Arabic subtitles | **30-second briefing** | "For each one, a thirty-second briefing: what they do, where they are, why they fit, and three sharp questions that don't reveal his budget. Even the subtitles are translated on device." |
| 8 Explore | 2:04–2:12 | Click a tag → similar booths pulse on the map | **Tap a tag, find similar booths** | "One tap on a tag finds similar booths across the hall." |
| 9 Proof | 2:12–2:30 | What left my device? → scroll: cloud rows = public listings, every on-device row = "Nothing left this device" | **Personal data sent: 0** | "And he doesn't have to trust us. Every AI call is logged: where it ran, and exactly what left the device. Personal data sent to the cloud: zero." |
| 10 Outcome | 2:30–2:50 | Title card "Next day, 11:40 AM — Booth AI-10" → final card: Booth Compass logo, tagline, GitHub link | **He came prepared. He left with a contract.** | "The next day, Khalid skipped the noise, walked straight to his booths, and asked the right questions. By noon, he was signing a pilot for privacy-safe synthetic data for his client projects. Booth Compass. Plan any expo, privately." |

## 3. Eligibility question to Devpost support (send from your personal email)

**Subject:** Eligibility question — #BuildHybridAI 2026 (government employee)

Hello,

I would like to enter #BuildHybridAI 2026 as an individual. I work as an education supervisor at a public education directorate in Saudi Arabia. My project (Booth Compass, a private expo-planning app) is a personal project, built in my own time with my own accounts, and it is not related to my employer or to any Google or Devpost business.

Could you please confirm that my employment does not make me ineligible under the government-employee clause of the Official Rules?

Thank you,
Areej Al-Jabarti
