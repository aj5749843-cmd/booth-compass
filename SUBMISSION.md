# Booth Compass — submission kit (#BuildHybridAI 2026)

## 1. Devpost text (paste into the submission form)

**Tagline:** Plan any expo in minutes — without telling anyone why you're there.

### Inspiration
Large expos have hundreds of booths. The official floor plan shows names, not reasons, so visitors now paste the exhibitor list into a cloud chatbot together with their real goals: the budget, the vendor they want to replace, the job they are quietly hunting. Planning a visit should not require handing your intentions to a server.

### What it does
- **Expo pack (cloud, once):** Gemini in the cloud reads the public exhibitor directory and turns it into clean, structured booth cards. Only public data is sent. The pack is cached, so everything afterwards works offline.
- **Private goals (on device):** the visitor writes their honest goals. Gemini Nano turns them into a compact profile on the laptop.
- **Score every booth (on device):** Nano scores each booth against the profile, one short call per booth. The floor plan lights up booth by booth: must-visit, maybe, skip.
- **Route:** a walking route from the entrance through the must-visit booths.
- **30-second briefing (on device):** a spoken briefing per booth plus three questions to ask the exhibitor, written so they don't reveal the visitor's budget.
- **Privacy shield + "What left my device?":** with the shield on, personal tasks run `ONLY_ON_DEVICE`. A transparency log lists every AI call, where it ran and the exact text sent to the cloud.
- **Any expo:** paste any public exhibitor list and Booth Compass builds a floor grid for it.

### How we used Firebase AI Logic
One SDK (`firebase/ai`) with two routing choices that follow the data:
- `InferenceMode.ONLY_IN_CLOUD` + `responseJsonSchema` for the one-time, public, heavy job (directory → booth cards).
- `InferenceMode.PREFER_ON_DEVICE` (or `ONLY_ON_DEVICE` with the privacy shield) + `onDeviceParams.promptOptions.responseConstraint` for every personal task: goals → profile, booth scoring, briefings. Structured JSON keeps Nano's answers reliable.
- `response.inferenceSource` feeds the transparency log, so the user can see on-device vs. cloud for every call.
- `initializeDeviceModel()` is triggered from a user click with download progress.
- App Check (reCAPTCHA Enterprise) protects the Gemini endpoints.

Why hybrid is the right design: the cloud does the one expensive job on public data; the device does the many small jobs on private data — free per call, instant, and available offline inside crowded halls.

### Challenges
- On-device inference is single-turn, so each booth is scored with one compact prompt instead of a chat.
- Scoring many booths takes time, so likely matches are scored first and the map updates live.

### What's next
Floor-plan import from organizer PDFs, multi-day agendas for conference sessions, and an Android build with Gemini Nano.

### Built during the submission period
Everything in this repository was built between 25 and 30 November 2026. No pre-existing code.

## 2. Demo video script (2:50, English voice-over, max 3:00)

**Story:** Khalid (fictional) runs a growing chain of five coffee shops in Jeddah. Tomorrow he flies to Riyadh for one day at NEXA Tech Expo (fictional, 60 booths). Tonight, in his hotel room on public Wi-Fi, he plans. Tomorrow, he signs a contract.
**Goals typed in the demo:** "I run a growing chain of 5 coffee shops. Tight budget. I need a POS and payment gateway with low fees, ZATCA e-invoicing, and payroll for my staff. Skip anything built for big banks."
**Promise in one line:** *Smart advice about your private goals, without sending them anywhere.*
**Recording:** Chrome desktop, 1920x1080, browser zoom 110%, Gemini Nano ready, Privacy shield ON, booth cards already saved. Speed up on-device scoring (8x) with a small "8x" badge.
**Style:** calm, confident voice; slow mouse; one idea per scene; short bold captions bottom-left. Scenes 1, 2 and 10 use simple title cards (text on dark background), with no footage of real events or brands.

| # | Time | Screen | On-screen caption | Voice-over |
|---|---|---|---|---|
| 1 Hook | 0:00–0:12 | Title card "The night before the expo" → slow zoom across the expo map | **Tomorrow: 60 booths. 1 day.** | "Tomorrow, Khalid flies to Riyadh for the biggest tech expo of his year. Sixty booths, one day, and no time to waste." |
| 2 Problem | 0:12–0:26 | Hotel-night title card → cursor on the empty goals box | **Hotel Wi-Fi. Confidential plans.** | "He runs a growing chain of coffee shops. His budget is tight, his expansion plans are confidential, and tonight he's on hotel Wi-Fi. Yet every AI planner wants the same thing: send us your goals." |
| 3 Solution | 0:26–0:42 | Header chips: Online · On-device AI ready (Gemini Nano) · Privacy shield ✓ | **Hybrid AI: cloud + on-device** | "Booth Compass is a hybrid AI app built with Firebase AI Logic. Public data goes to the cloud. Personal data stays on his laptop, with Gemini Nano running in Chrome." |
| 4 Cloud part | 0:42–0:56 | "60 booth cards saved on this device" (brief glimpse of Build expo pack) | **Cloud: public listings only** | "The cloud reads the public exhibitor list once and builds clean booth cards. Nothing about Khalid is sent, and the cards are saved for offline use." |
| 5 Private part | 0:56–1:18 | Type the goals → Find my booths → booths light up one by one (8x) | **On-device: Gemini Nano** | "Now the private part. Payments with low fees, e-invoicing, payroll, and a tight budget. Gemini Nano reads it and scores all sixty booths, right here on the device." |
| 6 Result | 1:18–1:36 | Final map: green fintech booths, pink route; zoom on a grey enterprise booth (Tamweel Cloud) | **Must-visits + 1 route** | "His must-visit booths and the shortest walking route. Guard rails keep the small model honest: a core-banking platform built for big banks can't top a tight-budget plan." |
| 7 Briefing | 1:36–2:04 | Click Riyal Pay → 30-second booth reel: mini-map, why it fits, 3 questions, Arabic subtitles | **30-second briefing** | "For each one, a thirty-second briefing: what they do, where they are, why they fit, and three sharp questions that don't reveal his budget. Even the subtitles are translated on device." |
| 8 Explore | 2:04–2:12 | Click a tag → similar booths pulse on the map | **Tap a tag, find similar booths** | "One tap on a tag finds similar booths across the hall." |
| 9 Proof | 2:12–2:30 | What left my device? → scroll: cloud rows = public listings, every on-device row = "Nothing left this device" | **Personal data sent: 0** | "And he doesn't have to trust us. Every AI call is logged: where it ran, and exactly what left the device. Personal data sent to the cloud: zero." |
| 10 Outcome | 2:30–2:50 | Title card "Next day, 11:40 AM — Booth FIN-01" → final card: Booth Compass logo, tagline, GitHub link | **He came prepared. He left with a contract.** | "The next day, Khalid skipped the noise, walked straight to his booths, and asked the right questions. By noon, he was signing a payments contract for all five shops. Booth Compass. Plan any expo, privately." |

## 3. Eligibility question to Devpost support (send from your personal email)

**Subject:** Eligibility question — #BuildHybridAI 2026 (government employee)

Hello,

I would like to enter #BuildHybridAI 2026 as an individual. I work as an education supervisor at a public education directorate in Saudi Arabia. My project (Booth Compass, a private expo-planning app) is a personal project, built in my own time with my own accounts, and it is not related to my employer or to any Google or Devpost business.

Could you please confirm that my employment does not make me ineligible under the government-employee clause of the Official Rules?

Thank you,
Areej Al-Jabarti
