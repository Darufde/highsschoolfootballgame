/* Team composition: depth charts, lineups, unit ratings for user and AI schools. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U } = FNG;
  const P = FNG.Players;

  const SLOTS = {
    offense: [['QB', 1], ['RB', 2], ['WR', 3], ['TE', 1], ['OL', 5]],
    defense: [['DL', 4], ['LB', 3], ['CB', 2], ['S', 2]],
    special: [['K', 1], ['P', 1]],
  };
  const SIDE_OF = {};
  for (const side in SLOTS) for (const [pos] of SLOTS[side]) SIDE_OF[pos] = side;

  const UNIT_LABEL = { qb: 'Quarterback', rb: 'Running Game', wr: 'Receivers', ol: 'Offensive Line', dl: 'Defensive Line', lb: 'Linebackers', db: 'Secondary', k: 'Kicking', p: 'Punting' };
  const UNIT_WEIGHT = { qb: 0.16, rb: 0.1, wr: 0.12, ol: 0.16, dl: 0.15, lb: 0.12, db: 0.13, k: 0.04, p: 0.02 };

  function teamOverall(r) {
    let s = 0;
    for (const k in UNIT_WEIGHT) s += (r[k] || 0) * UNIT_WEIGHT[k];
    return Math.round(s);
  }

  // Fill one side of the ball. `used` holds players already starting on this side.
  function fillSide(roster, slots, used, otherSide, current) {
    const out = {};
    const healthy = roster.filter((p) => p.injury <= 0);
    // Keep valid current picks first.
    for (const [pos, n] of slots) {
      out[pos] = [];
      const keep = (current && current[pos]) || [];
      for (const id of keep) {
        if (out[pos].length >= n) break;
        const p = healthy.find((x) => x.id === id);
        if (p && !used.has(p.id)) {
          out[pos].push(p.id);
          used.add(p.id);
        }
      }
    }
    // Primary-position players next.
    for (const [pos, n] of slots) {
      const cands = healthy.filter((p) => p.pos === pos && !used.has(p.id)).sort((a, b) => P.ovrAt(b, pos) - P.ovrAt(a, pos));
      while (out[pos].length < n && cands.length) {
        const p = cands.shift();
        out[pos].push(p.id);
        used.add(p.id);
      }
    }
    // Anyone else, preferring players not already starting on the other side.
    for (const [pos, n] of slots) {
      while (out[pos].length < n) {
        let best = null;
        let bv = -Infinity;
        for (const p of healthy) {
          if (used.has(p.id)) continue;
          const v = P.ovrAt(p, pos) - (otherSide && otherSide.has(p.id) ? 6 : 0) - (p.pos === 'K' || p.pos === 'P' ? 10 : 0);
          if (v > bv) {
            bv = v;
            best = p;
          }
        }
        if (!best) break;
        out[pos].push(best.id);
        used.add(best.id);
      }
    }
    return out;
  }

  // Build a full depth chart. With `current`, valid existing choices are preserved.
  function autoDepth(roster, current) {
    const usedOff = new Set();
    const usedDef = new Set();
    const off = fillSide(roster, SLOTS.offense, usedOff, null, current);
    const def = fillSide(roster, SLOTS.defense, usedDef, usedOff, current);
    const depth = Object.assign({}, off, def);
    for (const [pos] of SLOTS.special) {
      const healthy = roster.filter((p) => p.injury <= 0);
      const keep = current && current[pos] && healthy.find((p) => p.id === current[pos][0]);
      const best = keep || healthy.slice().sort((a, b) => P.ovrAt(b, pos) - P.ovrAt(a, pos))[0];
      depth[pos] = best ? [best.id] : [];
    }
    return depth;
  }

  // Resolve the game-day lineup: injured starters are replaced automatically.
  function resolveLineup(roster, depth) {
    const fixed = autoDepth(roster, depth);
    const byId = {};
    for (const p of roster) byId[p.id] = p;
    const groups = {};
    const offIds = new Set();
    const defIds = new Set();
    for (const pos in fixed) {
      groups[pos] = fixed[pos].map((id) => byId[id]).filter(Boolean);
      for (const p of groups[pos]) {
        if (SIDE_OF[pos] === 'offense') offIds.add(p.id);
        if (SIDE_OF[pos] === 'defense') defIds.add(p.id);
      }
    }
    const twoWay = new Set([...offIds].filter((id) => defIds.has(id)));
    return { depth: fixed, groups, twoWay };
  }

  function unitRatings(lineup, facilities) {
    const g = lineup.groups;
    const val = (p, pos) => (p ? P.ovrAt(p, pos) * (lineup.twoWay.has(p.id) ? 0.965 : 1) : 25);
    const avgOf = (pos) => U.avg((g[pos] || []).map((p) => val(p, pos))) || 25;
    const wr = g.WR || [];
    const r = {
      qb: val(g.QB && g.QB[0], 'QB'),
      rb: 0.72 * val(g.RB && g.RB[0], 'RB') + 0.28 * val(g.RB && g.RB[1], 'RB'),
      wr: 0.3 * val(wr[0], 'WR') + 0.25 * val(wr[1], 'WR') + 0.18 * val(wr[2], 'WR') + 0.27 * val(g.TE && g.TE[0], 'TE'),
      ol: avgOf('OL'),
      dl: avgOf('DL'),
      lb: avgOf('LB'),
      db: U.avg([...(g.CB || []).map((p) => val(p, 'CB')), ...(g.S || []).map((p) => val(p, 'S'))]) || 25,
      k: val(g.K && g.K[0], 'K'),
      p: val(g.P && g.P[0], 'P'),
    };
    const film = facilities ? (facilities.film - 1) * 0.35 : 0;
    for (const k in r) r[k] = U.round1(r[k] + (k === 'k' || k === 'p' ? 0 : film));
    return r;
  }

  function userRatings(state) {
    const lineup = resolveLineup(state.roster, state.depth);
    return unitRatings(lineup, state.program.facilities);
  }

  /* AI programs ------------------------------------------------------ */
  function sizeBonus(enrollment) {
    return U.clamp(Math.log2(enrollment / 300) * 3.5, -4, 9);
  }

  function aiBase(school) {
    return 43 + school.prestige * 0.3 + sizeBonus(school.enrollment) + (school.type === 'private' ? 2 : 0);
  }

  function aiRatings(school, rng, previous) {
    const base = aiBase(school) + rng.normal(0, 4.5);
    const r = {};
    for (const k of ['qb', 'rb', 'wr', 'ol', 'dl', 'lb', 'db']) r[k] = base + rng.normal(0, 5);
    r.k = base * 0.85 + rng.normal(0, 9);
    r.p = base * 0.85 + rng.normal(0, 8);
    for (const k in r) {
      let v = r[k];
      if (previous && previous[k] != null) v = previous[k] * 0.42 + v * 0.58;
      r[k] = U.round1(U.clamp(v, 22, 96));
    }
    return r;
  }

  // Talent level used to generate the user's players (expected junior overall).
  function userTalent(school, facilities) {
    return aiBase(school) - 5 - sizeBonus(school.enrollment) * 0.35 + (facilities ? (facilities.youth - 1) * 1.2 : 0) + (school.type === 'private' ? 1 : 0);
  }

  /* Engine contexts --------------------------------------------------- */
  function playerRef(p, pos) {
    return { id: p.id, name: P.shortName(p), num: p.num, pos: pos || p.pos };
  }

  function userContext(state, school) {
    const lineup = resolveLineup(state.roster, state.depth);
    const ratings = unitRatings(lineup, state.program.facilities);
    const g = lineup.groups;
    const healthy = state.roster.filter((p) => p.injury <= 0);
    const bench = (pos, starters) => {
      const ids = new Set(starters.map((p) => p.id));
      return healthy
        .filter((p) => !ids.has(p.id) && (p.pos === pos || (pos === 'DB' && (p.pos === 'CB' || p.pos === 'S'))))
        .sort((a, b) => P.ovrAt(b, pos === 'DB' ? 'CB' : pos) - P.ovrAt(a, pos === 'DB' ? 'CB' : pos))
        .slice(0, 3);
    };
    const grp = (pos, list) => list.concat(bench(pos, list)).map((p) => playerRef(p, pos === 'DB' ? p.pos : pos));
    const db = (g.CB || []).concat(g.S || []);
    return {
      id: school.id,
      name: school.name,
      abbr: school.abbr,
      isUser: true,
      injuries: true,
      medical: state.program.facilities.medical,
      colors: state.colors,
      r: ratings,
      players: {
        QB: grp('QB', g.QB || []), RB: grp('RB', g.RB || []), WR: grp('WR', g.WR || []), TE: grp('TE', g.TE || []),
        OL: grp('OL', g.OL || []), DL: grp('DL', g.DL || []), LB: grp('LB', g.LB || []), DB: grp('DB', db),
        K: (g.K || []).map((p) => playerRef(p, 'K')), P: (g.P || []).map((p) => playerRef(p, 'P')),
      },
    };
  }

  function aiContext(school, year) {
    const starters = P.opponentStarters(school, year, school.r);
    const players = {};
    for (const k in starters) players[k] = starters[k].map((p) => ({ id: p.id, name: P.shortName(p), num: p.num, pos: p.pos }));
    return { id: school.id, name: school.name, abbr: school.abbr, isUser: false, injuries: false, r: Object.assign({}, school.r), players };
  }

  FNG.Team = {
    SLOTS, SIDE_OF, UNIT_LABEL, teamOverall, autoDepth, resolveLineup, unitRatings, userRatings,
    aiRatings, aiBase, userTalent, userContext, aiContext, sizeBonus,
  };
})();
