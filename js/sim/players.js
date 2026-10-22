/* Players: attributes, position ratings, generation and development. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U } = FNG;

  const ATTRS = ['spd', 'str', 'agi', 'thr', 'acc', 'cat', 'blk', 'tak', 'cov', 'awr', 'kck'];
  const ATTR_LABEL = {
    spd: 'Speed', str: 'Strength', agi: 'Agility', thr: 'Arm Strength', acc: 'Accuracy', cat: 'Hands',
    blk: 'Blocking', tak: 'Tackling', cov: 'Coverage', awr: 'Awareness', kck: 'Kicking',
  };
  const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'];
  const POS_NAME = {
    QB: 'Quarterback', RB: 'Running Back', WR: 'Wide Receiver', TE: 'Tight End', OL: 'Offensive Line',
    DL: 'Defensive Line', LB: 'Linebacker', CB: 'Cornerback', S: 'Safety', K: 'Kicker', P: 'Punter',
  };
  const WEIGHTS = {
    QB: { thr: 0.3, acc: 0.35, awr: 0.2, agi: 0.1, spd: 0.05 },
    RB: { spd: 0.3, agi: 0.25, str: 0.15, cat: 0.1, awr: 0.1, blk: 0.1 },
    WR: { spd: 0.3, cat: 0.35, agi: 0.2, awr: 0.1, str: 0.05 },
    TE: { cat: 0.3, blk: 0.3, str: 0.2, spd: 0.1, awr: 0.1 },
    OL: { blk: 0.5, str: 0.35, awr: 0.1, agi: 0.05 },
    DL: { str: 0.35, tak: 0.3, spd: 0.15, agi: 0.1, awr: 0.1 },
    LB: { tak: 0.35, str: 0.15, spd: 0.2, cov: 0.1, awr: 0.2 },
    CB: { cov: 0.4, spd: 0.3, agi: 0.15, awr: 0.1, cat: 0.05 },
    S: { cov: 0.3, tak: 0.25, spd: 0.2, awr: 0.2, agi: 0.05 },
    K: { kck: 0.85, awr: 0.15 },
    P: { kck: 0.85, str: 0.15 },
  };
  const BODY = {
    QB: [74, 190], RB: [70, 185], WR: [72, 172], TE: [75, 220], OL: [74, 262], DL: [74, 240],
    LB: [72, 210], CB: [70, 168], S: [71, 180], K: [70, 165], P: [72, 178],
  };
  const NUMBERS = {
    QB: [[1, 19]], RB: [[20, 49], [1, 9]], WR: [[1, 19], [80, 89]], TE: [[80, 89], [40, 49]],
    OL: [[50, 79]], DL: [[90, 99], [50, 79]], LB: [[30, 59]], CB: [[1, 39]], S: [[1, 49]],
    K: [[1, 49], [90, 99]], P: [[1, 49], [90, 99]],
  };
  // Typical share of a roster at each position.
  const POS_MIX = { QB: 0.065, RB: 0.085, WR: 0.14, TE: 0.05, OL: 0.2, DL: 0.145, LB: 0.12, CB: 0.09, S: 0.07, K: 0.02, P: 0.015 };
  const CLASS_NAME = ['', 'FR', 'SO', 'JR', 'SR'];
  const CLASS_OFFSET = [0, -11, -5, 0, 4];

  function ovrAt(p, pos) {
    const w = WEIGHTS[pos];
    let s = 0;
    for (const k in w) s += p.a[k] * w[k];
    return Math.round(s);
  }

  function ovr(p) {
    return ovrAt(p, p.pos);
  }

  function bestPosition(p) {
    let best = p.pos;
    let bv = -1;
    for (const pos of POSITIONS) {
      const v = ovrAt(p, pos);
      if (v > bv) {
        bv = v;
        best = pos;
      }
    }
    return best;
  }

  let idCounter = 0;
  function newId(rng) {
    idCounter = (idCounter + 1) % 1e6;
    return 'P' + Date.now().toString(36).slice(-4) + Math.floor(rng.next() * 1e9).toString(36) + idCounter.toString(36);
  }

  function pickNumber(rng, pos, taken) {
    for (const [a, b] of NUMBERS[pos]) {
      const opts = [];
      for (let n = a; n <= b; n++) if (!taken.has(n)) opts.push(n);
      if (opts.length) return rng.pick(opts);
    }
    for (let n = 1; n <= 99; n++) if (!taken.has(n)) return n;
    return 0;
  }

  /*
   * talent: the expected overall of a junior at this school (program quality).
   * year: 1..4 (FR..SR)
   */
  function generate(rng, pos, year, talent, taken) {
    const N = FNG.DATA.names;
    const T = rng.normal(talent + CLASS_OFFSET[year], 8.5);
    const w = WEIGHTS[pos];
    const a = {};
    for (const k of ATTRS) {
      let v;
      if (w[k] >= 0.2) v = T + rng.normal(3, 6);
      else if (w[k]) v = T + rng.normal(-2, 7);
      else if (k === 'kck') v = rng.normal(25, 9);
      else if (k === 'thr' || k === 'acc') v = T - 22 + rng.normal(0, 9);
      else if (k === 'spd' || k === 'str' || k === 'agi') v = T - 6 + rng.normal(0, 8);
      else v = T - 14 + rng.normal(0, 9);
      a[k] = Math.round(U.clamp(v, 12, 99));
    }
    if (pos === 'K' || pos === 'P') a.kck = Math.round(U.clamp(T + rng.normal(-1, 8), 15, 99));
    const [ht, wt] = BODY[pos];
    const youth = (4 - year) * 0.6;
    const p = {
      id: newId(rng),
      first: rng.pick(N.first),
      last: rng.pick(N.last),
      pos,
      year,
      num: pickNumber(rng, pos, taken || new Set()),
      ht: Math.round(rng.normal(ht - youth, 2)),
      wt: Math.round(rng.normal(wt - youth * 8, wt * 0.07)),
      a,
      injury: 0,
      injuryNote: '',
      stats: {},
      career: {},
      honors: [],
    };
    const cur = ovr(p);
    p.pot = Math.round(U.clamp(cur + Math.max(0, rng.normal((4 - year) * 6.5 + 4, 6)), cur, 99));
    if (taken) taken.add(p.num);
    return p;
  }

  function rosterTarget(enrollment) {
    return Math.round(U.clamp(20 + enrollment / 28, 26, 78));
  }

  function classPositions(rng, count) {
    const out = [];
    for (let i = 0; i < count; i++) out.push(rng.weighted(POS_MIX));
    if (!out.includes('QB')) out[0] = 'QB';
    return out;
  }

  function generateRoster(rng, talent, size) {
    const taken = new Set();
    const roster = [];
    for (let year = 1; year <= 4; year++) {
      const n = Math.round(size / 4 + rng.normal(0, 1.5));
      for (const pos of classPositions(rng, n)) roster.push(generate(rng, pos, year, talent, taken));
    }
    // Guarantee a playable core: enough linemen, a QB and a kicker.
    const need = { QB: 2, RB: 2, WR: 3, TE: 1, OL: 6, DL: 4, LB: 3, CB: 2, S: 2, K: 1 };
    for (const pos in need) {
      let have = roster.filter((p) => p.pos === pos).length;
      while (have < need[pos]) {
        roster.push(generate(rng, pos, rng.int(1, 4), talent, taken));
        have++;
      }
    }
    return roster;
  }

  function potentialStars(p) {
    return U.clamp(Math.round((p.pot - 50) / 9), 1, 5);
  }

  // Grow attributes so overall at primary position rises by roughly `gain`.
  function applyGrowth(rng, p, gain, extra) {
    const w = WEIGHTS[p.pos];
    for (const k of ATTRS) {
      let d = w[k] ? gain * (0.75 + w[k]) : gain * 0.45;
      d += rng.normal(0, 1.1);
      if (extra && extra[k]) d += extra[k];
      p.a[k] = Math.round(U.clamp(p.a[k] + d, 10, 99));
    }
  }

  // Offseason progression. facilities: {weight, practice}
  function developOffseason(rng, p, facilities) {
    const before = ovr(p);
    const room = Math.max(0, p.pot - before);
    const ageFactor = p.year === 1 ? 1 : p.year === 2 ? 0.92 : 0.84;
    let gain = room * rng.float(0.16, 0.42) * ageFactor + (facilities.practice - 1) * 0.5 + rng.normal(0.2, 1.6);
    gain = Math.max(-1, gain);
    const wr = (facilities.weight - 1) * 0.5;
    applyGrowth(rng, p, gain, { str: wr, spd: wr * 0.6 });
    p.ht = Math.min(p.ht + (p.year <= 2 ? rng.int(0, 1) : 0), 80);
    p.wt += rng.int(2, 12);
    return ovr(p) - before;
  }

  // Small in-season gains from the weekly practice focus.
  const FOCUS_ATTRS = {
    balanced: ATTRS,
    offense: ['thr', 'acc', 'cat', 'blk', 'agi'],
    defense: ['tak', 'cov', 'str', 'agi'],
    conditioning: ['spd', 'str', 'agi'],
    film: ['awr'],
  };
  function practiceWeek(rng, p, focus, practiceLevel) {
    if (p.injury > 0) return;
    const room = Math.max(0, p.pot - ovr(p));
    const chance = 0.18 + room * 0.012 + practiceLevel * 0.03;
    const attrs = FOCUS_ATTRS[focus] || ATTRS;
    if (!rng.chance(chance)) return;
    const k = rng.pick(attrs);
    if (WEIGHTS[p.pos][k] || focus !== 'balanced') p.a[k] = Math.min(99, p.a[k] + 1);
  }

  function fullName(p) {
    return p.first + ' ' + p.last;
  }
  function shortName(p) {
    return p.first[0] + '. ' + p.last;
  }
  function heightStr(inches) {
    return Math.floor(inches / 12) + "'" + (inches % 12) + '"';
  }

  // Lightweight starters for AI schools (named, numbered) used for play-by-play only.
  function opponentStarters(school, year, ratings) {
    const rng = new RNG('opp|' + school.id + '|' + year);
    const N = FNG.DATA.names;
    const taken = new Set();
    const mk = (pos, slot, unit) => {
      const p = { id: 'X' + school.id + pos + slot, first: rng.pick(N.first), last: rng.pick(N.last), pos, num: pickNumber(rng, pos, taken), year: rng.int(2, 4) };
      taken.add(p.num);
      p.rating = Math.round(U.clamp(rng.normal(ratings[unit], 4), 20, 99));
      return p;
    };
    const g = (pos, n, unit) => Array.from({ length: n }, (_, i) => mk(pos, i, unit));
    return {
      QB: g('QB', 2, 'qb'),
      RB: g('RB', 3, 'rb'),
      WR: g('WR', 4, 'wr'),
      TE: g('TE', 2, 'wr'),
      OL: g('OL', 6, 'ol'),
      DL: g('DL', 5, 'dl'),
      LB: g('LB', 4, 'lb'),
      DB: g('CB', 3, 'db').concat(g('S', 3, 'db')),
      K: g('K', 1, 'k'),
      P: g('P', 1, 'p'),
    };
  }

  FNG.Players = {
    ATTRS, ATTR_LABEL, POSITIONS, POS_NAME, WEIGHTS, CLASS_NAME, POS_MIX,
    ovrAt, ovr, bestPosition, generate, generateRoster, rosterTarget, classPositions, potentialStars,
    developOffseason, practiceWeek, fullName, shortName, heightStr, opponentStarters, pickNumber,
  };
})();
