/*
 * Players: attributes, position ratings, generation and development.
 *
 * Rating scale is career-long: 99 is a Hall of Fame pro. High schoolers mostly sit between
 * 10 (raw freshman) and 60 (all-state senior); a 70 senior is an elite college prospect.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U } = FNG;

  const ATTRS = ['spd', 'str', 'agi', 'thr', 'acc', 'cat', 'blk', 'tak', 'cov', 'awr', 'kck'];
  const ATTR_LABEL = {
    spd: 'Speed', str: 'Strength', agi: 'Agility', thr: 'Arm Strength', acc: 'Accuracy', cat: 'Hands',
    blk: 'Blocking', tak: 'Tackling', cov: 'Coverage', awr: 'Awareness', kck: 'Kicking',
  };
  const PHYSICAL = { spd: 1, str: 1, agi: 1 };
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
  const POS_MIX = { QB: 0.065, RB: 0.085, WR: 0.14, TE: 0.05, OL: 0.2, DL: 0.145, LB: 0.12, CB: 0.09, S: 0.07, K: 0.02, P: 0.015 };
  const CLASS_NAME = ['', 'FR', 'SO', 'JR', 'SR'];
  const CLASS_OFFSET = [0, -8.7, -2.1, 2.5, 5.9];
  const LEVELS = ['V', 'JV', 'FR'];
  const LEVEL_NAME = { V: 'Varsity', JV: 'Junior Varsity', FR: 'Freshman' };

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

  // Which teams a player may suit up for: freshman team is freshmen only, JV excludes seniors.
  function levelAllowed(p, level) {
    if (level === 'FR') return p.year === 1;
    if (level === 'JV') return p.year <= 3;
    return true;
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
   * talent: expected overall of an average junior in this program.
   * year: 1..4 (FR..SR)
   */
  function generate(rng, pos, year, talent, taken, id) {
    const N = FNG.DATA.names;
    const T = rng.normal(talent + CLASS_OFFSET[year], 7.5);
    const w = WEIGHTS[pos];
    const a = {};
    for (const k of ATTRS) {
      let v;
      if (w[k] >= 0.2) v = T + rng.normal(3, 5);
      else if (w[k]) v = T + rng.normal(-2, 6);
      else if (k === 'kck') v = rng.normal(12, 6);
      else if (k === 'thr' || k === 'acc') v = T - 16 + rng.normal(0, 7);
      else if (PHYSICAL[k]) v = T - 4 + rng.normal(0, 7);
      else v = T - 10 + rng.normal(0, 8);
      a[k] = Math.round(U.clamp(v, 5, 99));
    }
    if (pos === 'K' || pos === 'P') a.kck = Math.round(U.clamp(T + rng.normal(0, 7), 5, 99));
    const [ht, wt] = BODY[pos];
    const youth = (4 - year) * 0.6;
    const p = {
      id: id || newId(rng),
      first: rng.pick(N.first),
      last: rng.pick(N.last),
      pos,
      year,
      level: 'V',
      num: taken ? pickNumber(rng, pos, taken) : 0,
      ht: Math.round(rng.normal(ht - youth, 2)),
      wt: Math.round(rng.normal(wt - youth * 8, wt * 0.07)),
      a,
      injury: 0,
      injuryNote: '',
      stats: {},
      honors: [],
    };
    const cur = ovr(p);
    // Potential is a career ceiling (college and beyond), not a high school one.
    let pot = cur + Math.max(0, rng.normal((4 - year) * 4.5 + 9, 7));
    if (rng.chance(0.04)) pot += rng.normal(14, 6);
    p.pot = Math.round(U.clamp(pot, cur, 99));
    if (taken) taken.add(p.num);
    return p;
  }

  // Program size for the user's school: roughly 100-150 players depending on enrollment.
  function programTarget(enrollment) {
    return Math.round(100 + 50 * U.clamp((enrollment - 200) / 1800, 0, 1));
  }

  function classPositions(rng, count) {
    const out = [];
    for (let i = 0; i < count; i++) out.push(rng.weighted(POS_MIX));
    if (!out.includes('QB')) out[0] = 'QB';
    return out;
  }

  function generateProgram(rng, talent, size) {
    const roster = [];
    for (let year = 1; year <= 4; year++) {
      const n = Math.round((size / 4) * rng.normal(1, 0.06));
      for (const pos of classPositions(rng, n)) roster.push(generate(rng, pos, year, talent, null));
    }
    const need = { QB: 5, RB: 6, WR: 9, TE: 4, OL: 16, DL: 12, LB: 10, CB: 7, S: 6, K: 2, P: 1 };
    for (const pos in need) {
      let have = roster.filter((p) => p.pos === pos).length;
      while (have++ < need[pos]) roster.push(generate(rng, pos, rng.int(1, 4), talent, null));
    }
    return roster;
  }

  // Each team (varsity, JV, freshman) has its own set of jersey numbers.
  function assignNumbers(rng, roster) {
    for (const level of LEVELS) {
      const taken = new Set();
      const group = roster.filter((p) => (p.level || 'V') === level).sort((a, b) => b.year - a.year);
      for (const p of group) {
        if (p.num && !taken.has(p.num)) taken.add(p.num);
        else p.num = 0;
      }
      for (const p of group) {
        if (!p.num) {
          p.num = pickNumber(rng, p.pos, taken);
          taken.add(p.num);
        }
      }
    }
  }

  // Default team assignment: seniors and the best others play varsity, then JV, then freshman team.
  function autoAssignLevels(roster, varsitySize) {
    const score = (p) => ovr(p) + [0, 0, 2, 4, 8][p.year];
    const sorted = roster.slice().sort((a, b) => score(b) - score(a));
    let v = roster.filter((p) => p.year === 4).length;
    for (const p of sorted) {
      if (p.year === 4) p.level = 'V';
      else if (v < varsitySize) {
        p.level = 'V';
        v++;
      } else p.level = p.year === 1 ? 'FR' : 'JV';
    }
  }

  function varsityTarget(programSize) {
    return Math.round(U.clamp(programSize * 0.42, 44, 62));
  }

  // Keep levels legal after players move up a class.
  function fixLevels(roster) {
    for (const p of roster) if (!levelAllowed(p, p.level)) p.level = p.year === 4 ? 'V' : 'JV';
  }

  function potentialStars(p) {
    const v = p.pot;
    return v >= 63 ? 5 : v >= 54 ? 4 : v >= 46 ? 3 : v >= 38 ? 2 : 1;
  }

  // Where a player projects to play after high school, from current ability and ceiling.
  function collegeOutlook(p) {
    const s = 0.65 * ovr(p) + 0.35 * p.pot;
    if (s >= 68) return { tier: 5, label: 'FBS Power Conference prospect' };
    if (s >= 62) return { tier: 4, label: 'FBS prospect' };
    if (s >= 57) return { tier: 3, label: 'FCS prospect' };
    if (s >= 52) return { tier: 2, label: 'Division II prospect' };
    if (s >= 46) return { tier: 1, label: 'Division III / NAIA prospect' };
    return { tier: 0, label: 'No college football projection' };
  }

  // Grow attributes so overall at primary position rises by roughly `gain`.
  function applyGrowth(rng, p, gain, physical) {
    const w = WEIGHTS[p.pos];
    for (const k of ATTRS) {
      let d = w[k] ? gain * (0.75 + w[k]) : gain * 0.45;
      d += rng.normal(0, 1);
      if (PHYSICAL[k]) d += physical || 0;
      p.a[k] = Math.round(U.clamp(p.a[k] + d, 3, 99));
    }
  }

  /*
   * Offseason progression.
   * mods: { mult: coaching multiplier (~0.8-1.25), practice: facility level, physical: extra str/spd/agi }
   */
  function developOffseason(rng, p, mods) {
    const before = ovr(p);
    const room = Math.max(0, p.pot - before);
    const age = p.year === 1 ? 1 : p.year === 2 ? 0.95 : 0.9;
    let gain = room * rng.float(0.16, 0.34) * age * mods.mult + (mods.practice - 1) * 0.35 + rng.normal(0.5, 1.3);
    gain = Math.max(-1, gain);
    applyGrowth(rng, p, gain, mods.physical || 0);
    p.ht = Math.min(p.ht + (p.year <= 2 ? rng.int(0, 1) : 0), 80);
    p.wt += rng.int(2, 12);
    return ovr(p) - before;
  }

  const FOCUS_ATTRS = {
    balanced: ATTRS,
    offense: ['thr', 'acc', 'cat', 'blk', 'agi'],
    defense: ['tak', 'cov', 'str', 'agi'],
    conditioning: ['spd', 'str', 'agi'],
    film: ['awr'],
  };
  // In-season gains. reps: playing time (varsity starter 1.0, JV/freshman 0.85, varsity bench 0.5); mult: coaching.
  function practiceWeek(rng, p, focus, practiceLevel, reps, mult) {
    if (p.injury > 0) return;
    const room = Math.max(0, p.pot - ovr(p));
    const chance = (0.1 + room * 0.01 + practiceLevel * 0.025) * reps * mult;
    if (!rng.chance(chance)) return;
    const attrs = FOCUS_ATTRS[focus] || ATTRS;
    const k = rng.pick(attrs);
    if (WEIGHTS[p.pos][k] || focus !== 'balanced') p.a[k] = Math.min(99, p.a[k] + 1);
  }

  /* ------------------------------------------------------------------ */
  /* AI varsity rosters                                                  */
  /* Rebuilt from seeds plus each class's stored talent level, so they   */
  /* never need to be saved: the same inputs rebuild the same players.   */
  /* ------------------------------------------------------------------ */
  function aiVarsitySize(enrollment) {
    return Math.round(U.clamp(30 + enrollment / 45, 34, 62));
  }

  // Varsity roster shape: share of the roster at each position, with a floor.
  const AI_MIN = { QB: 3, RB: 3, WR: 5, TE: 2, OL: 8, DL: 6, LB: 5, CB: 3, S: 3, K: 1, P: 1 };

  function aiCohort(schoolId, entryYear, talent, poolSize) {
    const rng = new RNG('aic|' + schoolId + '|' + entryYear);
    const forced = ['QB', 'K', 'P', 'OL', 'OL', 'DL', 'LB', 'WR'];
    const pool = [];
    for (let i = 0; i < poolSize; i++) {
      const pos = i < forced.length ? forced[i] : rng.weighted(POS_MIX);
      pool.push(generate(rng, pos, 1, talent, null, 'A' + schoolId + '-' + entryYear + '-' + i));
    }
    return pool;
  }

  // school.ct maps entry year -> class talent. devMult reflects the program's coaching.
  // Each class is developed to its current grade, then every position keeps its best players.
  function aiRoster(school, year, devMult) {
    const V = aiVarsitySize(school.enrollment);
    const poolSize = Math.round(V * 0.5) + 4;
    const all = [];
    for (let grade = 1; grade <= 4; grade++) {
      const entry = year - grade + 1;
      const talent = (school.ct && school.ct[entry] != null ? school.ct[entry] : 28) + 0.5;
      for (const p of aiCohort(school.id, entry, talent, poolSize)) {
        for (let step = 1; step < grade; step++) {
          developOffseason(new RNG(p.id + '|' + step), p, { mult: devMult, practice: 1, physical: 0 });
          p.year++;
        }
        all.push(p);
      }
    }
    all.sort((a, b) => ovr(b) - ovr(a));
    const roster = [];
    const taken = new Set();
    for (const pos of POSITIONS) {
      const want = Math.max(AI_MIN[pos], Math.round(V * POS_MIX[pos]));
      for (const p of all) {
        if (roster.filter((x) => x.pos === pos).length >= want) break;
        if (p.pos === pos && !taken.has(p.id)) {
          roster.push(p);
          taken.add(p.id);
        }
      }
    }
    for (const p of all) {
      if (roster.length >= V) break;
      if (!taken.has(p.id) && p.pos !== 'K' && p.pos !== 'P') {
        roster.push(p);
        taken.add(p.id);
      }
    }
    assignNumbers(new RNG('ainum|' + school.id + '|' + year), roster);
    return roster;
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

  FNG.Players = {
    ATTRS, ATTR_LABEL, POSITIONS, POS_NAME, WEIGHTS, CLASS_NAME, POS_MIX, LEVELS, LEVEL_NAME,
    ovrAt, ovr, bestPosition, generate, generateProgram, programTarget, varsityTarget, classPositions,
    potentialStars, collegeOutlook, developOffseason, practiceWeek, fullName, shortName, heightStr, pickNumber,
    levelAllowed, autoAssignLevels, fixLevels, assignNumbers, aiRoster, aiVarsitySize,
  };
})();
