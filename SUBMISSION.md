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

## 2. Demo video script (target 2:45, English, max 3:00)

Recording notes: Chrome desktop, Gemini Nano ready, Privacy shield ON, booth cards already saved.
Scoring 60 booths on device takes ~7 minutes, so speed that part up (8x) or cut to the finished map.

| # | Time | Screen | Voice-over (English) |
|---|---|---|---|
| 1 | 0:00–0:15 | The full expo map, 60 booths | "Sixty booths, one day, and a budget I don't want to share. Today, planning an expo means telling a chatbot your goals and your secrets." |
| 2 | 0:15–0:35 | Header chips: *Online* · *On-device AI: ready (Gemini Nano)* · *Privacy shield* | "Booth Compass is a hybrid AI app built on Firebase AI Logic. Public work runs in the cloud. Personal work runs on this laptop, with Gemini Nano in Chrome." |
| 3 | 0:35–0:55 | Step 1: *60 booth cards saved on this device* (briefly show *Build expo pack*) | "First, the cloud reads the public exhibitor list once and turns it into clean booth cards. Nothing about me is sent, and the cards are saved for offline use." |
| 4 | 0:55–1:25 | Type: "I own a small private school, tight budget, looking for AI tutoring and parent communication tools" → *Find my booths* → booths light up one by one (sped up) | "Now my real goals. They never leave this device. Gemini Nano reads them and scores every booth, right here." |
| 5 | 1:25–1:45 | Finished map: 3 green booths, pink route 1→3; enterprise and gaming booths grey | "Three must-visit booths and a walking route. Simple guard rails keep the small model honest: an enterprise-only booth can't be a must-visit on a tight budget." |
| 6 | 1:45–2:15 | Click *Kitabi* → *30-second booth reel* (English voice, Arabic subtitles, mini-map, 3 questions) | "Each booth gets a thirty-second reel: what they do, where to find them, why it fits me, and three smart questions to ask. Subtitles are translated on device, too." |
| 7 | 2:15–2:25 | Click a tag (e.g. *parents*) → matching booths pulse on the map | "Tap a tag to find similar booths across the hall." |
| 8 | 2:25–2:40 | *What left my device?* → cloud rows say "public listings", every on-device row says "Nothing left this device" | "And full transparency: every AI call, where it ran, and what left the device. Personal data sent to the cloud: zero." |
| 9 | 2:40–2:50 | Title card: Booth Compass + GitHub link | "Booth Compass. Plan any expo, privately. Built with Firebase AI Logic and Gemini Nano." |

## 3. Eligibility question to Devpost support (send from your personal email)

**Subject:** Eligibility question — #BuildHybridAI 2026 (government employee)

Hello,

I would like to enter #BuildHybridAI 2026 as an individual. I work as an education supervisor at a public education directorate in Saudi Arabia. My project (Booth Compass, a private expo-planning app) is a personal project, built in my own time with my own accounts, and it is not related to my employer or to any Google or Devpost business.

Could you please confirm that my employment does not make me ineligible under the government-employee clause of the Official Rules?

Thank you,
Areej Al-Jabarti
