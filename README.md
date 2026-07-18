# 달빛사주 (Moonlit Saju)

A Jeomsin-style Korean fortune-telling (사주팔자) single-page site. Fully static,
no dependencies, no server — open `index.html` in a browser.

## Features
- **Four pillars (사주 명식)**: year/month/day/hour pillars with ten gods (십신),
  hidden stems (지장간), element-colored tiles. Day pillar highlighted as 일원.
- **Daily fortune (오늘의 운세)**: total score donut + 4 category scores
  (love/money/work/health), deterministic per (birth, date) — same result all day.
  Lucky color/number/direction from the weakest element in the chart.
- **Yearly flow (올해의 흐름)**: ten-god relation between the day master and the
  current year pillar.
- **Five elements (오행 분석)**: distribution bars + strongest/weakest reading.
- **Day-master personality (타고난 성품)**: 10 일간 readings.
- **Major luck cycles (대운)**: direction (순행/역행) + start age from 절입일,
  8 decades listed.

## Calculation notes (`saju.js`)
- Input is **solar (양력) date + KST**. Lunar input is not supported.
- Solar terms from a low-precision solar-longitude formula (~0.01° ≈ 15 min),
  valid ~1900–2100. Year pillar flips at 입춘 (λ=315°), month pillar at each 절.
- Day pillar anchor: 1900-01-01 = 갑술, cross-checked against 1949-10-01 = 갑자.
  Day boundary at 23:00 (자시).
- Optional apparent-solar-time correction (−30 min, Seoul) for the hour pillar,
  on by default.
- Ten gods, branch relations (육합/삼합/충/형/파/해), and 대운 (3일=1년, 양남음녀
  순행) implemented classically.

Engine is pure JS with a CommonJS export, so it is testable with node.

`index.html?demo=1` renders a sample chart (used for headless screenshot checks).

Interpretation texts are for entertainment; the 명식 math follows 만세력 conventions.
