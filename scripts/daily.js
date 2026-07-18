/* scripts/daily.js — generate today's fortune JSON for the personal morning page.
 * Run by GitHub Actions daily (see .github/workflows/daily-fortune.yml).
 * Birth data comes from env (repo secrets) so it is never committed:
 *   SAJU_BIRTH  = YYYY-MM-DD   (required)
 *   SAJU_GENDER = M | F        (default M)
 *   SAJU_NAME   = display name (default '나')
 *   SAJU_BTIME  = HH:MM        (optional; omit if birth time unknown)
 * Output: data/daily.json (+ data/history/YYYY-MM-DD.json). The JSON contains the
 * chart pillars and fortune text, not the raw birth date. */
'use strict';
const fs = require('fs');
const path = require('path');
const S = require('../saju.js');
const F = require('../fortune.js');

const birth = (process.env.SAJU_BIRTH || '').trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
  console.error('SAJU_BIRTH env must be YYYY-MM-DD');
  process.exit(1);
}
const gender = (process.env.SAJU_GENDER || 'M').trim().toUpperCase() === 'F' ? 'F' : 'M';
const name = (process.env.SAJU_NAME || '나').trim();
const btime = (process.env.SAJU_BTIME || '').trim();

const [y, mo, d] = birth.split('-').map(Number);
const unknownTime = !/^\d{1,2}:\d{2}$/.test(btime);
const [h, mi] = unknownTime ? [12, 0] : btime.split(':').map(Number);
const input = { y, mo, d, h, mi, unknownTime, solarCorr: true, gender };

const res = S.compute(input);
const now = new Date(Date.now() + 9 * 3600000); // KST
const t = { y: now.getUTCFullYear(), mo: now.getUTCMonth() + 1, d: now.getUTCDate() };
const df = F.daily(S, res, input, t);
const yf = F.yearly(S, res, df.tp);
const dom = F.domains(S, res);

const pill = p => S.STEMS[p.stem] + S.BRANCHES[p.branch];
const pillH = p => S.STEMS_H[p.stem] + S.BRANCHES_H[p.branch];
const pad = n => String(n).padStart(2, '0');
const dateStr = `${t.y}-${pad(t.mo)}-${pad(t.d)}`;

const out = {
  date: dateStr,
  generated_kst: `${dateStr} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`,
  name,
  ilgan: S.STEMS[res.day.stem] + S.ELEMS[S.STEM_ELEM[res.day.stem]],
  saju: {
    year: pill(res.year) + '(' + pillH(res.year) + ')',
    month: pill(res.month) + '(' + pillH(res.month) + ')',
    day: pill(res.day) + '(' + pillH(res.day) + ')',
    hour: res.hour ? pill(res.hour) + '(' + pillH(res.hour) + ')' : null
  },
  todayPillar: pill(df.tp.day) + '(' + pillH(df.tp.day) + ')',
  tenGod: df.tg,
  branchRel: df.rel,
  tot: df.tot,
  heroText: df.heroText,
  cats: df.cats.map(c => ({ label: c.label, score: c.score, text: c.text, base: dom[c.key] })),
  lucky: df.lucky,
  yearly: { year: `${df.tp.sajuYear} ${pill(df.tp.year)}년`, tg: yf.tg, text: yf.text }
};

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const histDir = path.join(dataDir, 'history');
fs.mkdirSync(histDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'daily.json'), JSON.stringify(out, null, 2) + '\n');
fs.writeFileSync(path.join(histDir, dateStr + '.json'), JSON.stringify(out, null, 2) + '\n');

console.log(`[daily] ${dateStr} ${name} | 명식 ${pill(res.year)}년 ${pill(res.month)}월 ${pill(res.day)}일` +
  (res.hour ? ` ${pill(res.hour)}시` : ' (시간모름)') +
  ` | 오늘 ${pill(df.tp.day)}일 → ${df.tg}${df.rel ? '·' + df.rel : ''} | 총운 ${df.tot}`);
