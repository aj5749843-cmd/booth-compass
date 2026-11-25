# Generates src/expo-data.js: a fictional expo used for the demo.
# All companies are invented. No real exhibitor data is copied.
import json, pathlib

ZONES = [
  ("AI", "AI & Data", "#6C5CE7"),
  ("EDU", "EdTech", "#00A8A8"),
  ("HLT", "HealthTech", "#E17055"),
  ("FIN", "FinTech", "#0984E3"),
  ("CTY", "Smart Cities & Mobility", "#00B894"),
  ("GAM", "Gaming & Esports", "#D63031"),
]

# name | zone | size(S/M/L) | raw directory listing (messy, like a scraped PDF)
EX = [
 # AI & Data
 ("Larkspur Labs","AI","L","LARKSPUR LABS - enterprise LLM platform; private deployment on-prem; RAG over company docs; Arabic+English; looking for: large enterprises, gov't; pricing: enterprise contracts"),
 ("Quillmind","AI","M","Quillmind :: AI writing assistant for marketing teams. brand-voice tuning. integrations w/ CMS. SaaS from $29/user/mo. Seeking resellers MENA"),
 ("DataDune","AI","M","DataDune -- data labeling & annotation services, Arabic NLP datasets, speech corpora. pay-per-task. looking for AI startups needing training data"),
 ("Vectorly","AI","S","Vectorly: vector database startup (seed). fast semantic search. free tier + usage pricing. hiring backend engineers!"),
 ("Sahm Analytics","AI","M","SAHM ANALYTICS | BI dashboards + forecasting for retail chains; demand prediction; POS integration; mid-market; demo at booth"),
 ("Nimbus Agents","AI","L","Nimbus Agents - build AI agents for customer service; voice + chat; 40 languages; enterprise; partner program open"),
 ("PromptForge","AI","S","PromptForge (startup) - prompt testing & evaluation tool for developers; open-source core; looking for investors (pre-seed)"),
 ("Oryx Vision","AI","M","Oryx Vision :: computer vision for quality inspection in factories; defect detection; edge devices; manufacturing clients"),
 ("Mirage Synth","AI","S","Mirage Synth - synthetic data generator for privacy-safe ML training; healthcare & finance use cases; seed stage; seeking pilots"),
 ("Cortexa","AI","M","CORTEXA - AI governance & compliance platform; model risk mgmt; audit trails; banks & regulators"),
 # EdTech
 ("Kitabi","EDU","M","Kitabi - interactive Arabic reading app for kids 4-10; gamified; schools + parents subscriptions; seeking school partnerships"),
 ("TutorLoop","EDU","S","TutorLoop: AI tutor for math & science (grades 6-12); adaptive practice; freemium; looking for distribution partners"),
 ("CampusOS","EDU","L","CampusOS - university management system; admissions, LMS, exams; cloud; universities & colleges; enterprise pricing"),
 ("SkillBridge","EDU","M","SkillBridge :: corporate upskilling platform; micro-credentials; AI career paths; HR teams; per-seat pricing"),
 ("LabVerse","EDU","M","LabVerse - VR science labs for high schools; physics/chem/bio simulations; headset bundles; ministry procurement welcome"),
 ("Hafiz Coach","EDU","S","Hafiz Coach - speech-recognition app for language memorization & pronunciation practice; consumer app; seed"),
 ("ProctorPeak","EDU","S","ProctorPeak: online exam proctoring w/ privacy-first design; universities & certification bodies"),
 ("Inkwell Studio","EDU","S","Inkwell Studio - animated educational video production; custom curriculum content; agencies & publishers"),
 ("CodeCamel","EDU","M","CodeCamel - coding bootcamps for teens; Python, game dev, robotics kits; summer camps; parents & schools"),
 ("Mentora","EDU","S","Mentora: mentorship matching platform for gifted students & researchers; non-profit pricing; seeking mentors + sponsors"),
 # HealthTech
 ("PulseRing","HLT","M","PulseRing - smart ring for sleep & heart-rate tracking; consumer wearable; retail $199; distributors wanted"),
 ("ClinicFlow","HLT","L","ClinicFlow :: clinic management & e-prescription system; appointment booking; insurance claims; private clinics"),
 ("Dawa Direct","HLT","M","Dawa Direct - pharmacy delivery platform; 2-hr delivery; B2C app; partnering w/ pharmacies"),
 ("MediScribe","HLT","M","MediScribe - AI medical scribe; turns doctor-patient conversation into notes; Arabic/English; hospitals"),
 ("CareNest","HLT","S","CareNest - home elderly care coordination app; caregivers marketplace; families; seed stage"),
 ("GenomeGate","HLT","S","GenomeGate: genetic testing lab services; research partnerships; B2B"),
 ("RehabXR","HLT","S","RehabXR - VR physiotherapy games for stroke rehab; clinical pilots; seeking hospitals"),
 ("NutriLens","HLT","S","NutriLens - photo-based nutrition tracking app; consumer; freemium"),
 ("BioSense Kits","HLT","M","BioSense Kits - rapid diagnostic test kits; distributors & labs; regulatory approvals GCC"),
 ("MindHarbor","HLT","M","MindHarbor - employee wellbeing platform; therapy sessions; corporate HR clients"),
 # FinTech
 ("Riyal Pay","FIN","L","RIYAL PAY - payment gateway & POS; merchants of all sizes; low fees; instant settlement; Mada/Apple Pay"),
 ("LedgerLeaf","FIN","M","LedgerLeaf: accounting & e-invoicing for SMEs (ZATCA-ready); $15/mo; accountants partner program"),
 ("SplitSaga","FIN","S","SplitSaga - group expense splitting app; consumer; free; seed; looking for investors"),
 ("Sanad Credit","FIN","M","Sanad Credit - SME lending marketplace; fast approval; Sharia-compliant; businesses seeking financing"),
 ("Tamweel Cloud","FIN","L","Tamweel Cloud :: core banking software for digital banks; enterprise; implementation partners"),
 ("CoinCompass","FIN","S","CoinCompass - personal finance & budgeting app w/ AI insights; consumer; freemium"),
 ("InsurEase","FIN","M","InsurEase - insurance comparison & instant motor policies; B2C; partners: insurers"),
 ("PayrollPal","FIN","M","PayrollPal - payroll & HR compliance (WPS) for SMEs; per-employee pricing"),
 ("FraudShield","FIN","M","FraudShield - real-time fraud detection API for payments; banks & fintechs; usage pricing"),
 ("WaqfWorks","FIN","S","WaqfWorks - donation & endowment management platform for non-profits; low cost; NGOs"),
 # Smart Cities & Mobility
 ("ParkSense","CTY","M","ParkSense - smart parking sensors + app; municipalities & malls; hardware + SaaS"),
 ("SolarTile","CTY","M","SolarTile - building-integrated solar panels; real-estate developers; installation partners"),
 ("RouteRiver","CTY","S","RouteRiver - last-mile delivery route optimization; logistics SMEs; per-vehicle pricing"),
 ("AquaMeter","CTY","M","AquaMeter - smart water meters & leak detection; utilities & compounds"),
 ("Kharita 3D","CTY","L","Kharita 3D - digital twin & 3D city mapping; urban planners; government & developers"),
 ("EVolt","CTY","M","EVolt - EV charging stations & network software; malls, hotels, fleets"),
 ("SafeStreet AI","CTY","S","SafeStreet AI - traffic camera analytics for road safety; municipalities; pilots"),
 ("GreenRoof Co","CTY","S","GreenRoof Co - rooftop gardens & cooling solutions; villas & commercial buildings"),
 ("HomeHub","CTY","M","HomeHub - smart home kits (lighting, AC, security) ; consumers & developers; retail bundles"),
 ("TransitTap","CTY","S","TransitTap - public transport ticketing & journey planning app; transit authorities"),
 # Gaming & Esports
 ("Falcon Forge Games","GAM","L","FALCON FORGE GAMES - AAA-style action game studio; publishing deals; hiring artists & devs"),
 ("ArenaStat","GAM","M","ArenaStat - esports analytics & scouting for coaches; match data; teams & academies"),
 ("PixelSouq","GAM","S","PixelSouq - indie game marketplace for Arabic games; devs revenue share; seeking indie devs"),
 ("StreamDeckers","GAM","S","StreamDeckers - streaming studio setups & creator gear; content creators; retail"),
 ("EduQuest","GAM","M","EduQuest - educational games for classrooms; curriculum-aligned; schools; seeking pilots"),
 ("ClutchCoach AI","GAM","S","ClutchCoach AI - AI coaching tool for competitive players; replays analysis; subscription"),
 ("LANtern Events","GAM","M","LANtern Events - esports tournament organization & venue services; brands & sponsors"),
 ("Joystick Junction","GAM","S","Joystick Junction - accessible game controllers for players with disabilities; consumers & clinics"),
 ("MetaMajlis","GAM","M","MetaMajlis - virtual events & 3D meeting spaces; brands; enterprise"),
 ("Saga Sound","GAM","S","Saga Sound - game audio & Arabic voice acting studio; game studios; per-project"),
]

SIZES = {"S": (1, 1), "M": (2, 1), "L": (2, 2)}
UNIT_W, UNIT_H, GAP = 48, 52, 8

# zone blocks on a 1200 x 700 floor (3 x 2 grid)
ZONE_BOX = {}
zw, zh = 360, 290
origins = [(40, 70), (420, 70), (800, 70), (40, 380), (420, 380), (800, 380)]
for (code, _, _), (ox, oy) in zip(ZONES, origins):
    ZONE_BOX[code] = (ox, oy, zw, zh)

def place(zone_items, box):
    ox, oy, w, h = box
    cols = 6
    grid = [[False] * cols for _ in range(4)]
    out = []
    for item in zone_items:
        cw, ch = SIZES[item[2]]
        done = False
        for r in range(4):
            for c in range(cols):
                if c + cw > cols or r + ch > 4:
                    continue
                if all(not grid[r + dr][c + dc] for dr in range(ch) for dc in range(cw)):
                    for dr in range(ch):
                        for dc in range(cw):
                            grid[r + dr][c + dc] = True
                    x = ox + 16 + c * (UNIT_W + GAP)
                    y = oy + 40 + r * (UNIT_H + GAP)
                    out.append((item, x, y, cw * UNIT_W + (cw - 1) * GAP, ch * UNIT_H + (ch - 1) * GAP))
                    done = True
                    break
            if done:
                break
        if not done:
            raise SystemExit("no room for " + item[0])
    return out

booths = []
for code, label, color in ZONES:
    items = [e for e in EX if e[1] == code]
    items.sort(key=lambda e: "LMS".index(e[2]))
    for n, (item, x, y, w, h) in enumerate(place(items, ZONE_BOX[code]), 1):
        name, zone, size, raw = item
        booths.append({
            "id": f"{code}-{n:02d}",
            "name": name,
            "zone": zone,
            "raw": raw,
            "x": x, "y": y, "w": w, "h": h,
        })

expo = {
    "name": "NEXA Tech Expo 2027",
    "city": "Riyadh (fictional demo event)",
    "floor": {"w": 1200, "h": 700, "entrance": {"x": 600, "y": 690}},
    "zones": [{"code": c, "label": l, "color": col, "box": ZONE_BOX[c]} for c, l, col in ZONES],
    "booths": booths,
}
out = pathlib.Path(__file__).resolve().parent / "expo-data.js"
out.write_text("// Generated by tools/make_expo.py - fictional demo data, all companies invented.\nexport const EXPO = " + json.dumps(expo, ensure_ascii=False, indent=1) + ";\n")
print(len(booths), "booths ->", out)
