/* Team composition: depth charts, lineups, unit ratings and engine contexts for every school. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U } = FNG;
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

  // Only healthy varsity players can be on the varsity depth chart.
  function eligible(roster) {
    return roster.filter((p) => p.injury <= 0 && (p.level || 'V') === 'V');
  }

  function fillSide(pool, slots, used, otherSide, current) {
    const out = {};
    for (const [pos, n] of slots) {
      out[pos] = [];
      for (const id of (current && current[pos]) || []) {
        if (out[pos].length >= n) break;
        const p = pool.find((x) => x.id === id);
        if (p && !used.has(p.id)) {
          out[pos].push(p.id);
          used.add(p.id);
        }
      }
    }
    for (const [pos, n] of slots) {
      const cands = pool.filter((p) => p.pos === pos && !used.has(p.id)).sort((a, b) => P.ovrAt(b, pos) - P.ovrAt(a, pos));
      while (out[pos].length < n && cands.length) {
        const p = cands.shift();
        out[pos].push(p.id);
        used.add(p.id);
      }
    }
    for (const [pos, n] of slots) {
      while (out[pos].length < n) {
        let best = null;
        let bv = -Infinity;
        for (const p of pool) {
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
    const pool = eligible(roster);
    const usedOff = new Set();
    const off = fillSide(pool, SLOTS.offense, usedOff, null, current);
    const def = fillSide(pool, SLOTS.defense, new Set(), usedOff, current);
    const depth = Object.assign({}, off, def);
    for (const [pos] of SLOTS.special) {
      const keep = current && current[pos] && pool.find((p) => p.id === current[pos][0]);
      const best = keep || pool.slice().sort((a, b) => P.ovrAt(b, pos) - P.ovrAt(a, pos))[0];
      depth[pos] = best ? [best.id] : [];
    }
    return depth;
  }

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

  // Unit ratings on the player scale, including coaching (fx) and film room bonuses.
  function unitRatings(lineup, fx, facilities) {
    const g = lineup.groups;
    const val = (p, pos) => (p ? P.ovrAt(p, pos) * (lineup.twoWay.has(p.id) ? 0.965 : 1) : 12);
    const avgOf = (pos) => U.avg((g[pos] || []).map((p) => val(p, pos))) || 12;
    const wr = g.WR || [];
    const r = {
      qb: val(g.QB && g.QB[0], 'QB'),
      rb: 0.72 * val(g.RB && g.RB[0], 'RB') + 0.28 * val(g.RB && g.RB[1], 'RB'),
      wr: 0.3 * val(wr[0], 'WR') + 0.25 * val(wr[1], 'WR') + 0.18 * val(wr[2], 'WR') + 0.27 * val(g.TE && g.TE[0], 'TE'),
      ol: avgOf('OL'),
      dl: avgOf('DL'),
      lb: avgOf('LB'),
      db: U.avg([...(g.CB || []).map((p) => val(p, 'CB')), ...(g.S || []).map((p) => val(p, 'S'))]) || 12,
      k: val(g.K && g.K[0], 'K'),
      p: val(g.P && g.P[0], 'P'),
    };
    const film = facilities ? (facilities.film - 1) * 0.35 : 0;
    for (const k in r) r[k] = U.round1(r[k] + (fx ? fx.units[k] : 0) + (k === 'k' || k === 'p' ? 0 : film));
    return r;
  }

  function sizeBonus(enrollment) {
    return U.clamp(Math.log2(enrollment / 300) * 3.5, -4, 9);
  }

  // Expected overall of an average junior in a program: tradition, size and youth program.
  function programTalent(school, facilities) {
    return 28 + (school.prestige - 50) * 0.14 + sizeBonus(school.enrollment) * 0.5 + (school.type === 'private' ? 1.5 : 0) + (facilities ? (facilities.youth - 1) * 1 : 0);
  }

  function userEffects(state) {
    return FNG.Coaches.effects(state.staff);
  }

  function userRatings(state) {
    return unitRatings(resolveLineup(state.roster, state.depth), userEffects(state), state.program.facilities);
  }

  /* Engine contexts --------------------------------------------------- */
  function playerRef(p, pos) {
    return { id: p.id, name: P.shortName(p), num: p.num, pos: pos || p.pos };
  }

  function buildContext(school, roster, depth, fx, facilities) {
    const lineup = resolveLineup(roster, depth);
    const g = lineup.groups;
    const pool = eligible(roster);
    const bench = (pos, starters) => {
      const ids = new Set(starters.map((p) => p.id));
      const match = (p) => p.pos === pos || (pos === 'DB' && (p.pos === 'CB' || p.pos === 'S'));
      return pool.filter((p) => !ids.has(p.id) && match(p)).sort((a, b) => P.ovr(b) - P.ovr(a)).slice(0, 3);
    };
    const grp = (pos, list) => list.concat(bench(pos, list)).map((p) => playerRef(p, pos === 'DB' ? p.pos : pos));
    const db = (g.CB || []).concat(g.S || []);
    return {
      id: school.id,
      name: school.name,
      abbr: school.abbr,
      r: unitRatings(lineup, fx, facilities),
      offIQ: fx.offIQ,
      defIQ: fx.defIQ,
      offStyle: fx.offStyle,
      defStyle: fx.defStyle,
      players: {
        QB: grp('QB', g.QB || []), RB: grp('RB', g.RB || []), WR: grp('WR', g.WR || []), TE: grp('TE', g.TE || []),
        OL: grp('OL', g.OL || []), DL: grp('DL', g.DL || []), LB: grp('LB', g.LB || []), DB: grp('DB', db),
        K: (g.K || []).map((p) => playerRef(p, 'K')), P: (g.P || []).map((p) => playerRef(p, 'P')),
      },
      lineup,
    };
  }

  function userContext(state, school) {
    const fx = userEffects(state);
    const ctx = buildContext(school, state.roster, state.depth, fx, state.program.facilities);
    ctx.isUser = true;
    ctx.injuries = true;
    ctx.injuryMult = fx.injury * (1 - (state.program.facilities.medical - 1) * 0.08);
    return ctx;
  }

  function aiContext(school, roster) {
    const ctx = buildContext(school, roster, null, FNG.Coaches.aiEffects(school), null);
    ctx.isUser = false;
    ctx.injuries = false;
    return ctx;
  }

  function aiRatings(school, roster) {
    return unitRatings(resolveLineup(roster, null), FNG.Coaches.aiEffects(school), null);
  }

  FNG.Team = {
    SLOTS, SIDE_OF, UNIT_LABEL, teamOverall, eligible, autoDepth, resolveLineup, unitRatings, userRatings, userEffects,
    programTalent, sizeBonus, userContext, aiContext, aiRatings,
  };
})();
