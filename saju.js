/* saju.js — Four Pillars (사주팔자) calculation engine.
 * Pure functions, no DOM. Exposed as window.Saju (browser) / module.exports (node).
 *
 * Conventions:
 *  - Input is solar (양력) date + KST civil time.
 *  - Year pillar changes at 입춘 (sun longitude 315°), month pillar at each 절(節).
 *    Solar terms are computed from a low-precision solar longitude formula
 *    (accuracy ~0.01° ≈ 15 min), valid ~1900-2100.
 *  - Day pillar anchor: 1900-01-01 = 갑술 (index 10 of the 60 cycle),
 *    cross-checked against 1949-10-01 = 갑자.
 *  - Day boundary at 23:00 (자시 시작). Optional apparent-solar-time correction
 *    (-30 min, Seoul) applies to the hour/day boundary only.
 */
(function (global) {
  'use strict';

  var STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  var STEMS_H = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  var BRANCHES_H = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var STEM_ELEM = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];            // 0목 1화 2토 3금 4수
  var BRANCH_ELEM = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  var ELEMS = ['목', '화', '토', '금', '수'];
  var ELEMS_H = ['木', '火', '土', '金', '水'];
  var ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  // 지장간 (마지막 원소가 본기)
  var HIDDEN = [
    [8, 9], [9, 7, 5], [4, 2, 0], [0, 1], [1, 9, 4], [4, 6, 2],
    [2, 5, 3], [3, 1, 5], [4, 8, 6], [6, 7], [7, 3, 4], [4, 0, 8]
  ];

  function mod(a, n) { return ((a % n) + n) % n; }

  function jdFromUtcMs(ms) { return ms / 86400000 + 2440587.5; }

  function kstUtcMs(y, mo, d, h, mi) { return Date.UTC(y, mo - 1, d, h, mi) - 9 * 3600000; }

  // Low-precision solar apparent longitude in degrees.
  function sunLon(jd) {
    var n = jd - 2451545.0;
    var L = 280.460 + 0.9856474 * n;
    var g = (357.528 + 0.9856003 * n) * Math.PI / 180;
    var lam = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
    return mod(lam, 360);
  }

  // 60-cycle index of a KST calendar date. 1900-01-01 = 10 (갑술).
  function dayIndex60(y, mo, d) {
    var days = (Date.UTC(y, mo - 1, d) - Date.UTC(1900, 0, 1)) / 86400000;
    return mod(days + 10, 60);
  }

  function comb60(stem, branch) {
    for (var k = 0; k < 60; k++) if (k % 10 === stem && k % 12 === branch) return k;
    return 0;
  }

  // Find the jd of the nearest 절(節) crossing (sun longitude ≡ 15° mod 30°)
  // after (forwardDir=true) or before (false) the given jd. Bisection.
  function findJieCross(jd, forwardDir) {
    var lam = sunLon(jd);
    var off = mod(lam - 15, 30);
    var target, approx;
    if (forwardDir) {
      var toGo = 30 - off;
      target = mod(lam + toGo, 360);
      approx = jd + toGo / 0.9856;
    } else {
      target = mod(lam - off, 360);
      approx = jd - off / 0.9856;
    }
    var f = function (x) { return mod(sunLon(x) - target + 540, 360) - 180; };
    var lo = approx - 2.5, hi = approx + 2.5, guard = 0;
    while (f(lo) > 0 && guard++ < 20) lo -= 0.5;
    while (f(hi) < 0 && guard++ < 40) hi += 0.5;
    for (var i = 0; i < 60; i++) {
      var m = (lo + hi) / 2;
      if (f(m) < 0) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  // 대운: 양간·남 / 음간·여 → 순행. 3일 = 1년.
  function daeun(jdBirth, yearStem, mStem, mBranch, gender) {
    var forward = (yearStem % 2 === 0) === (gender === 'M');
    var cross = findJieCross(jdBirth, forward);
    var days = Math.abs(cross - jdBirth);
    var num = Math.round(days / 3);
    if (num < 1) num = 1;
    if (num > 10) num = 10;
    var m60 = comb60(mStem, mBranch);
    var list = [];
    for (var i = 1; i <= 8; i++) {
      var k = mod(m60 + (forward ? i : -i), 60);
      list.push({ age: num + 10 * (i - 1), stem: k % 10, branch: k % 12 });
    }
    return { num: num, forward: forward, list: list };
  }

  var TG_NAMES = [['비견', '겁재'], ['식신', '상관'], ['편재', '정재'], ['편관', '정관'], ['편인', '정인']];
  function tenGod(dayStem, otherStem) {
    var rel = mod(STEM_ELEM[otherStem] - STEM_ELEM[dayStem], 5);
    var same = (dayStem % 2) === (otherStem % 2);
    return TG_NAMES[rel][same ? 0 : 1];
  }

  var YUKHAP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  var CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
  var SAMHAP = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];
  var HYEONG = [[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7], [0, 3]];
  var PA = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [10, 7]];
  var HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];

  function hasPair(arr, a, b) {
    return arr.some(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); });
  }
  function branchRelation(a, b) {
    if (hasPair(CHUNG, a, b)) return '충';
    if (hasPair(YUKHAP, a, b)) return '육합';
    if (a !== b && SAMHAP.some(function (g) { return g.indexOf(a) >= 0 && g.indexOf(b) >= 0; })) return '삼합';
    if (hasPair(HYEONG, a, b)) return '형';
    if (hasPair(PA, a, b)) return '파';
    if (hasPair(HAE, a, b)) return '해';
    return null;
  }

  // Full four-pillar computation.
  // opt: { y, mo, d, h, mi, unknownTime, solarCorr, gender: 'M'|'F' }
  function compute(opt) {
    var y = opt.y, mo = opt.mo, d = opt.d;
    var h = opt.unknownTime ? 12 : opt.h;
    var mi = opt.unknownTime ? 0 : opt.mi;

    var jd = jdFromUtcMs(kstUtcMs(y, mo, d, h, mi));
    var lam = sunLon(jd);

    // 연주 (입춘 기준)
    var sy = y;
    if (mo === 1) sy -= 1;
    else if (mo === 2 && lam < 315) sy -= 1;
    var ys = mod(sy - 4, 10), yb = mod(sy - 4, 12);

    // 월주 (절기 기준, 315°=인월)
    var mIdx = Math.floor(mod(lam - 315, 360) / 30);
    var mBranch = mod(mIdx + 2, 12);
    var mStem = mod((ys % 5) * 2 + 2 + mIdx, 10);

    // 시간 보정 후 일주/시주 경계 판정
    var adjMs = Date.UTC(y, mo - 1, d, h, mi);
    if (opt.solarCorr && !opt.unknownTime) adjMs -= 30 * 60000;
    var adj = new Date(adjMs);
    var ah = adj.getUTCHours(), ami = adj.getUTCMinutes();

    var dayMs = Date.UTC(adj.getUTCFullYear(), adj.getUTCMonth(), adj.getUTCDate());
    if (!opt.unknownTime && ah >= 23) dayMs += 86400000;
    var dref = new Date(dayMs);
    var dIdx = dayIndex60(dref.getUTCFullYear(), dref.getUTCMonth() + 1, dref.getUTCDate());
    var ds = dIdx % 10, db = dIdx % 12;

    var hour = null;
    if (!opt.unknownTime) {
      var t = ah * 60 + ami;
      var hb = Math.floor(mod(t + 60, 1440) / 120);
      var hs = mod((ds % 5) * 2 + hb, 10);
      hour = { stem: hs, branch: hb };
    }

    return {
      year: { stem: ys, branch: yb },
      month: { stem: mStem, branch: mBranch },
      day: { stem: ds, branch: db },
      hour: hour,
      unknownTime: !!opt.unknownTime,
      gender: opt.gender || 'M',
      daeun: daeun(jd, ys, mStem, mBranch, opt.gender || 'M'),
      meta: { lam: lam, sajuYear: sy, dayIdx60: dIdx }
    };
  }

  // Pillars of an arbitrary date (for daily/yearly fortune). Noon KST.
  function pillarOfDate(y, mo, d) {
    var lam = sunLon(jdFromUtcMs(kstUtcMs(y, mo, d, 12, 0)));
    var sy = y;
    if (mo === 1) sy -= 1;
    else if (mo === 2 && lam < 315) sy -= 1;
    var dIdx = dayIndex60(y, mo, d);
    return {
      day: { stem: dIdx % 10, branch: dIdx % 12 },
      year: { stem: mod(sy - 4, 10), branch: mod(sy - 4, 12) },
      sajuYear: sy
    };
  }

  function hash(s) {
    var h2 = 5381;
    for (var i = 0; i < s.length; i++) h2 = ((h2 << 5) + h2 + s.charCodeAt(i)) | 0;
    return h2 >>> 0;
  }
  function rand01(s) { return hash(s) / 4294967295; }

  var Saju = {
    STEMS: STEMS, STEMS_H: STEMS_H, BRANCHES: BRANCHES, BRANCHES_H: BRANCHES_H,
    STEM_ELEM: STEM_ELEM, BRANCH_ELEM: BRANCH_ELEM, ELEMS: ELEMS, ELEMS_H: ELEMS_H,
    ANIMALS: ANIMALS, HIDDEN: HIDDEN,
    compute: compute, pillarOfDate: pillarOfDate,
    tenGod: tenGod, branchRelation: branchRelation,
    dayIndex60: dayIndex60, sunLon: sunLon, jdFromUtcMs: jdFromUtcMs, kstUtcMs: kstUtcMs,
    hash: hash, rand01: rand01, mod: mod
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Saju;
  else global.Saju = Saju;
})(this);
