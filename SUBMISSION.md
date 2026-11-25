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

## 2. Demo video script (target 2:40, English)

| Time | Screen | Voice-over |
|---|---|---|
| 0:00–0:15 | Wide shot of a crowded expo floor plan | "Six hundred booths. Two days. And the only way to plan is to tell a chatbot your budget and your secrets." |
| 0:15–0:35 | Booth Compass, step 1, click *Build expo pack* | "Booth Compass splits the work. The cloud reads the public exhibitor list once — nothing about me is sent." |
| 0:35–1:05 | Type goals (school owner, tight budget), click *Find my booths*; map lights up | "My real goals stay on this laptop. Gemini Nano scores every booth right here, one by one." |
| 1:05–1:25 | Turn Wi-Fi off; change goals; run again | "Wi-Fi off. Still works — the device does the personal part." |
| 1:25–1:50 | Click top booth, play 30-second briefing | "A spoken briefing, and questions to ask that don't reveal my budget." |
| 1:50–2:15 | Open *What left my device?* | "Every AI call, where it ran, and exactly what left the device. Personal data sent to the cloud: zero." |
| 2:15–2:30 | *Use another expo* → paste a list | "Works with any expo — paste the exhibitor list." |
| 2:30–2:40 | Logo | "Booth Compass. Plan any expo, privately. Built with Firebase AI Logic." |

## 3. Eligibility question to Devpost support (send from your personal email)

**Subject:** Eligibility question — #BuildHybridAI 2026 (government employee)

Hello,

I would like to enter #BuildHybridAI 2026 as an individual. I work as an education supervisor at a public education directorate in Saudi Arabia. My project (Booth Compass, a private expo-planning app) is a personal project, built in my own time with my own accounts, and it is not related to my employer or to any Google or Devpost business.

Could you please confirm that my employment does not make me ineligible under the government-employee clause of the Official Rules?

Thank you,
Areej Al-Jabarti
