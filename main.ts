// THE WORLD TODAY — front page summing up Monday 23 November 2026.
// Draws the page entirely in code (HTML/CSS + inline SVG) and renders it
// with headless Chrome to a single deterministic PNG. Node 22, stdlib only,
// no network at run time, no timestamps, no randomness.
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN || "",
  "/home/hatch/workspace/make-fun/chrome-for-testing/chrome-linux64/chrome",
  "/opt/meta-chromium/chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function findChrome(): string {
  for (const c of CHROME_CANDIDATES) if (existsSync(c)) return c;
  throw new Error("No Chrome binary found");
}

type Short = { kicker: string; head: string; deck: string; source: string };

const SHORTS: Short[] = [
  { kicker: "MEXICO", head: "\u2018Chapo Isidro\u2019 arrested; 11 dead in Sinaloa firefights", deck: "", source: "AP" },
  { kicker: "AI WEAPONS", head: "UN talks on lethal AI weapons to continue", deck: "", source: "UN" },
  { kicker: "INDONESIA", head: "24 bodies found after factory fire", deck: "", source: "Reuters" },
  { kicker: "NEPAL \u2013 INDIA", head: "Nepal PM Shah meets Modi in New Delhi", deck: "", source: "AP" },
  { kicker: "SOUTH KOREA", head: "Education minister quits over AI exam scandal", deck: "", source: "AP" },
  { kicker: "CRICKET", head: "India post record 720/9 in Wellington Test", deck: "", source: "AP" },
  { kicker: "COP31", head: "90+ nations sign electrification pledge", deck: "", source: "CNN" },
  { kicker: "STRAIT OF HORMUZ", head: "Two tankers hit in Strait of Hormuz", deck: "", source: "UKMTO / Reuters" },
  { kicker: "ISRAEL", head: "Eisenkot condemns settler attacks as \u2018Jewish terrorism\u2019", deck: "", source: "AP" },
  { kicker: "UKRAINE", head: "Russian drone hits Kyiv building; 14 missing", deck: "", source: "AP" },
  { kicker: "MYANMAR", head: "Myanmar govt calls ASEAN decision \u2018unfair\u2019", deck: "", source: "AP" },
  { kicker: "PORTUGAL", head: "Thousands march in Lisbon over living costs", deck: "", source: "AP" },
  { kicker: "FORMULA 1", head: "Verstappen wins chaotic Las Vegas GP", deck: "", source: "AP" },
  { kicker: "CELEBRITY", head: "Miley Cyrus marries Maxx Morando", deck: "", source: "AP" },
  { kicker: "FBI", head: "FBI probes breach of criminal database", deck: "", source: "Al Jazeera" },
  { kicker: "UNITED STATES", head: "Governor calls ICE \u2018out of control\u2019 after arrests", deck: "", source: "AP" },
  { kicker: "AVIATION", head: "Delta delays in Atlanta after system fault", deck: "", source: "AP" },
  { kicker: "EUROPEAN UNION", head: "EU budget plan keeps \u20ac100bn for Ukraine", deck: "", source: "AP" },
  { kicker: "US \u2013 RUSSIA", head: "US intel chief: Putin \u2018not America\u2019s friend\u2019", deck: "", source: "AP" },
  { kicker: "AUKUS", head: "Australia rebukes US budget office on AUKUS", deck: "", source: "AP" },
  { kicker: "MYANMAR", head: "Malaysia to work with UN, OIC on Myanmar", deck: "", source: "AP" },
  { kicker: "YEMEN", head: "Saudi Arabia downs Houthi drone; Sanaa hit", deck: "", source: "Reuters" },
  { kicker: "INDIA", head: "\u20b94,000 crore infrastructure push for Arunachal", deck: "", source: "PTI" },
  { kicker: "FILM", head: "IFFI hosts BRICS film roundtable", deck: "", source: "PTI" },
  { kicker: "INDIA", head: "BJP MP Ramrao Wadkute dies in Delhi", deck: "", source: "PTI" },
  { kicker: "SNOOKER", head: "Anupama keeps world snooker crown", deck: "", source: "PTI" },
  { kicker: "NFL", head: "Tom Jackson, Broncos star, dies at 75", deck: "", source: "AP" },
  { kicker: "UNITED KINGDOM", head: "NHS \u2018wasting billions\u2019, data show", deck: "", source: "AP" },
  { kicker: "UNITED KINGDOM", head: "May tells Burnham: accept Brexit", deck: "", source: "AP" },
  { kicker: "STRAIT OF HORMUZ", head: "Briton swims Strait of Hormuz", deck: "", source: "AP" },
  { kicker: "INDIA \u2013 BULGARIA", head: "India, Bulgaria discuss IMEC, Black Sea", deck: "", source: "PTI" },
  { kicker: "TECHNOLOGY", head: "Nvidia row: AI chips \u2018diverted to China\u2019", deck: "", source: "AP" },
];

function shortCell(s: Short): string {
  return `<div class="cell"><div class="kick">${s.kicker}</div><div class="chead">${s.head}</div><div class="csrc">23 NOV &bull; ${s.source}</div></div>`;
}

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1024px;height:1024px;background:#f6f1e7;color:#111;
font-family:Georgia,'Times New Roman',serif;overflow:hidden}
.page{width:1024px;height:1024px;padding:18px 26px 12px}
.mast{text-align:center}
.mast h1{font-size:58px;letter-spacing:2px;line-height:1;font-weight:900}
.mast .dateline{font-family:Arial,Helvetica,sans-serif;font-size:17px;letter-spacing:5px;
font-weight:700;margin-top:6px}
.rule{border-top:3px solid #111;margin:8px 0 0}
.rule2{border-top:1px solid #111;margin:3px 0 0}
.datebar{background:#111;color:#fff;font-family:Arial,Helvetica,sans-serif;
font-size:12px;font-weight:700;letter-spacing:1.5px;text-align:center;
padding:6px 4px;margin-top:7px}
.lead{display:flex;gap:18px;margin-top:10px;border-bottom:2px solid #111;padding-bottom:10px}
.lead-text{width:600px}
.kick{font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;
letter-spacing:2px;color:#9c1f1f}
.lead-text h2{font-size:38px;line-height:1.02;font-weight:900;margin:5px 0 7px}
.deck{font-size:14.5px;line-height:1.3}
.src{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#555;margin-top:7px;letter-spacing:.5px}
.lead-art{width:330px;flex:none}
.mid{display:flex;gap:18px;margin-top:10px;padding-bottom:10px;border-bottom:2px solid #111}
.mid article{width:472px}
.mid h3{font-size:22px;line-height:1.08;font-weight:900;margin:4px 0 5px}
.mid .deck{font-size:13.5px}
.mid .art{margin-top:6px}
.morebar{font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:800;
letter-spacing:2px;margin:8px 0 6px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px 14px}
.cell{border-top:2px solid #111;padding-top:4px;height:51px;overflow:hidden}
.cell .kick{font-size:9px;letter-spacing:1.2px}
.chead{font-size:12px;line-height:1.15;font-weight:700;margin-top:2px}
.csrc{font-family:Arial,Helvetica,sans-serif;font-size:8.5px;color:#777;margin-top:2px;letter-spacing:.5px}
.foot{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#666;text-align:center;margin-top:8px;letter-spacing:1px}
</style></head><body><div class="page">
<div class="mast"><h1>THE WORLD TODAY</h1>
<div class="dateline">MONDAY, 23 NOVEMBER 2026</div></div>
<div class="rule"></div><div class="rule2"></div>
<div class="datebar">DATE CHECK &mdash; MONDAY 23 NOVEMBER 2026 &bull; ALL STORIES FROM 23 NOVEMBER 2026</div>
<div class="lead"><div class="lead-text">
<div class="kick">CLIMATE &bull; COP31 &bull; ANTALYA, TURKEY</div>
<h2>COP31 CLIMATE SUMMIT COLLAPSES</h2>
<div class="deck">UN climate talks collapsed on Sunday after 190+ countries failed to agree a deal. The final &ldquo;Antalya Pact&rdquo; draft omitted any mention of fossil fuels, so the EU, Panama, the Marshall Islands, Norway and others rejected it &mdash; the longest COP in history, and the first collapse since Copenhagen 2009.</div>
<div class="src">23 NOV &bull; CNN / WSJ / REUTERS</div></div>
<div class="lead-art"><svg width="330" height="168" viewBox="0 0 330 218">
<rect width="330" height="218" fill="#123f4d"/>
<circle cx="165" cy="104" r="72" fill="#2e7d8c"/>
<path d="M93 104 Q165 60 237 104 Q165 148 93 104Z" fill="#7fc4cf" opacity=".55"/>
<path d="M165 32 Q150 104 165 176 M165 32 Q180 104 165 176" stroke="#cfe8ec" stroke-width="2" fill="none"/>
<path d="M100 70 L150 104 L120 150 L185 118 L215 160" stroke="#e8a13a" stroke-width="7" fill="none" stroke-linejoin="round"/>
<circle cx="262" cy="42" r="20" fill="#e8a13a"/>
<path d="M262 14 L262 70 M234 42 L290 42 M242 22 L282 62 M282 22 L242 62" stroke="#e8a13a" stroke-width="3"/>
<rect x="18" y="182" width="294" height="26" fill="#9c1f1f"/>
<text x="165" y="201" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#fff">NO DEAL IN ANTALYA</text>
</svg></div></div>
<div class="mid">
<article><div class="kick">WAR AT SEA &bull; LIBYA &bull; BALTIC</div>
<h3>Russian warship sunk in Libya</h3>
<div class="deck">Ukrainian sea drones struck the Russian corvette <i>Merkury</i> at Benghazi naval base; it burned, capsized and sank, only the bow visible. A second Russian cargo ship, <i>Sparta II</i>, was hit by drones in the Baltic and burned off Finland before being towed out.</div>
<div class="src">23 NOV &bull; WSJ / THE TIMES / AP / REUTERS</div>
<div class="art"><svg width="472" height="40" viewBox="0 0 472 64">
<rect width="472" height="64" fill="#1d4e6b"/>
<path d="M0 44 Q40 36 80 44 T160 44 T240 44 T320 44 T400 44 T472 44 L472 64 L0 64Z" fill="#2e7d8c"/>
<path d="M120 44 L170 44 L160 20 L130 20Z" fill="#333"/>
<path d="M170 44 L210 44 L200 28 L180 28Z" fill="#555"/>
<path d="M150 20 L150 6 M150 6 L168 10 L150 14Z" fill="#c33"/>
<path d="M300 44 L360 44 L350 26 L310 26Z" fill="#444"/>
<path d="M330 26 Q340 10 330 2 M330 26 Q320 12 328 2" stroke="#e8a13a" stroke-width="3" fill="none"/>
<circle cx="335" cy="8" r="4" fill="#e8a13a"/>
</svg></div></article>
<article><div class="kick">UNITED STATES &bull; CONGRESS</div>
<h3>Democrats clinch biggest House majority since 1992</h3>
<div class="deck">At least 258 seats after Chuck Hubbard beat Rep. Virginia Foxx in North Carolina on Sunday &mdash; a gain of 44 seats, with Republicans on at least 173. Divided government, with a Republican president.</div>
<div class="src">23 NOV &bull; AP / REUTERS</div>
<div class="art"><svg width="472" height="40" viewBox="0 0 472 64">
<rect width="472" height="64" fill="#3a3a3a"/>
<path d="M60 58 L60 34 L412 34 L412 58Z" fill="#e8e2d2"/>
<path d="M236 6 Q300 6 316 34 L156 34 Q172 6 236 6Z" fill="#e8e2d2"/>
<rect x="232" y="0" width="8" height="12" fill="#e8e2d2"/>
<circle cx="236" cy="2" r="3" fill="#e8e2d2"/>
<rect x="90" y="40" width="14" height="18" fill="#3a3a3a"/>
<rect x="140" y="40" width="14" height="18" fill="#3a3a3a"/>
<rect x="190" y="40" width="14" height="18" fill="#3a3a3a"/>
<rect x="268" y="40" width="14" height="18" fill="#3a3a3a"/>
<rect x="318" y="40" width="14" height="18" fill="#3a3a3a"/>
<rect x="368" y="40" width="14" height="18" fill="#3a3a3a"/>
</svg></div></article>
</div>
<div class="morebar">MORE FROM 23 NOVEMBER &mdash; AROUND THE WORLD</div>
<div class="grid">${SHORTS.map(shortCell).join("")}</div>
<div class="foot">THE WORLD TODAY &bull; MONDAY 23 NOVEMBER 2026 &bull; 35 STORIES, ALL FROM 23 NOVEMBER 2026</div>
</div></body></html>`;

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const chrome = findChrome();
  const work = mkdtempSync(join(tmpdir(), "world-today-"));
  try {
    const htmlPath = join(work, "page.html");
    const shotPath = join(work, "shot.png");
    writeFileSync(htmlPath, html, "utf8");
    execFileSync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--window-size=1024,1024",
        `--screenshot=${shotPath}`,
        `file://${htmlPath}`,
      ],
      { stdio: "inherit", timeout: 60000 },
    );
    copyFileSync(shotPath, join(outDir, "entry.png"));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main();
