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

## 2. Demo video script (2:45, English voice-over, max 3:00)

**Story:** one visitor, one problem, one clear outcome. Sara (fictional) owns a small private school and has one day at a 60-booth tech expo.
**Promise in one line:** *Smart advice about your private goals, without sending them anywhere.*
**Recording:** Chrome desktop, 1920x1080, browser zoom 110%, Gemini Nano ready, Privacy shield ON, booth cards already saved. Speed up on-device scoring (8x) with a small "8x" badge.
**Style:** calm, confident voice; slow mouse; one idea per scene; short on-screen captions (bold, bottom-left).

| # | Time | Screen | On-screen caption | Voice-over |
|---|---|---|---|---|
| 1 Hook | 0:00–0:12 | Slow zoom across the full expo map | **60 booths. 1 day.** | "Sixty booths. One day. And every AI planner asks the same thing first: tell me your budget, your plans, your secrets." |
| 2 Problem | 0:12–0:24 | Cursor rests on the empty goals box | **Your goals are private.** | "Sara runs a small private school. Her budget is tight, and her plans are nobody's business. So why should they go to a server?" |
| 3 Solution | 0:24–0:42 | Header chips: Online · On-device AI ready (Gemini Nano) · Privacy shield ✓ | **Hybrid AI: cloud + on-device** | "Booth Compass is a hybrid AI app built with Firebase AI Logic. It splits the work: public data goes to the cloud, personal data stays on this laptop, with Gemini Nano running in Chrome." |
| 4 Cloud part | 0:42–0:58 | "60 booth cards saved on this device" (brief glimpse of Build expo pack) | **Cloud: public listings only** | "First, Gemini in the cloud reads the public exhibitor list once and turns it into clean booth cards. Nothing about Sara is sent. The cards are cached, so the rest works offline." |
| 5 Private part | 0:58–1:22 | Type the goals → Find my booths → booths light up one by one (8x) | **On-device: Gemini Nano** | "Now the private part. Sara types what she really needs: AI tutoring, better parent communication, a tight budget. Gemini Nano reads it and scores all sixty booths, right here on the device." |
| 6 Result | 1:22–1:40 | Final map: 3 green booths, pink route 1→2→3; zoom on a grey enterprise booth | **3 must-visits. 1 route.** | "Three must-visit booths and the shortest walking route. And because small models can be fooled by keywords, simple guard rails keep the results honest. An enterprise-only booth can't top a tight-budget plan." |
| 7 Briefing | 1:40–2:10 | Click Kitabi → 30-second booth reel: mini-map, why it fits, 3 questions, Arabic subtitles | **30-second briefing** | "Before she walks over, Sara gets a thirty-second briefing: what they do, where they are, why they fit, and three smart questions that don't reveal her budget. Subtitles are translated on device, too." |
| 8 Explore | 2:10–2:20 | Click a tag → similar booths pulse on the map | **Tap a tag, find similar booths** | "One tap on a tag finds similar booths across the hall." |
| 9 Proof | 2:20–2:38 | What left my device? → scroll: cloud rows = public listings, every on-device row = "Nothing left this device" | **Personal data sent: 0** | "And we don't ask you to trust us. Every AI call is logged: where it ran, and exactly what left the device. Personal data sent to the cloud: zero." |
| 10 Close | 2:38–2:48 | Title card: Booth Compass logo, tagline, GitHub link | **Plan any expo, privately.** | "Booth Compass. Plan any expo, privately. Built with Firebase AI Logic and Gemini Nano." |

## 3. Eligibility question to Devpost support (send from your personal email)

**Subject:** Eligibility question — #BuildHybridAI 2026 (government employee)

Hello,

I would like to enter #BuildHybridAI 2026 as an individual. I work as an education supervisor at a public education directorate in Saudi Arabia. My project (Booth Compass, a private expo-planning app) is a personal project, built in my own time with my own accounts, and it is not related to my employer or to any Google or Devpost business.

Could you please confirm that my employment does not make me ineligible under the government-employee clause of the Official Rules?

Thank you,
Areej Al-Jabarti
