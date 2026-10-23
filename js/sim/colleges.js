/*
 * College recruiting: the Big Ten, SEC, ACC, Big 12 and Pac-12 programs (and Notre Dame) evaluate every prospect
 * in the game each week and extend scholarship offers.
 *
 * A college values a player from his recruit rating (ability, ceiling, measurables, production
 * and competition), projected forward for underclassmen, plus its own read on potential, season
 * statistics, recent games, recruit ranking and schedule strength. Prestige sets the level a
 * college recruits at: elite programs chase ranked, proven players and can recruit nationally;
 * lower-prestige programs lean on potential, production and players close to home. A player's
 * interest in a college also depends on prestige and distance, and colleges avoid players who
 * are unlikely to be interested. Each college has a limited number of offers per position in
 * each class. Offers stay on the table unless the player's stock falls well below the bar.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U } = FNG;
  const P = FNG.Players;
  const R = FNG.Recruits;

  const LIST = FNG.DATA.colleges;
  const BY_ID = {};
  const HASH = {};
  LIST.forEach((c, i) => {
    c.i = i;
    BY_ID[c.id] = c;
    HASH[c.id] = FNG.hashString('college|' + c.id);
  });
  const CONF_NAME = {};
  for (const c of FNG.DATA.conferences) CONF_NAME[c.id] = c.name;

  const NEIGHBORS = {
    OH: ['MI', 'IN', 'KY', 'WV', 'PA'],
    KY: ['OH', 'IN', 'IL', 'MO', 'TN', 'VA', 'WV'],
    TN: ['KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR', 'MO'],
    MI: ['OH', 'IN', 'WI'],
    WV: ['OH', 'PA', 'MD', 'VA', 'KY'],
  };
  // Talent depth of each state's competition, on top of division size.
  const STATE_DEPTH = { OH: 0.4, MI: 0.2, TN: 0, KY: -0.4, WV: -0.6 };
  // Offers per position a college extends to one senior class (a national-sized board of ~275), before
  // scaling by how much it recruits the states in the game. Younger classes get a smaller share.
  const SLOTS = { QB: 18, RB: 27, WR: 39, TE: 18, OL: 45, DL: 42, LB: 27, CB: 30, S: 24, K: 4, P: 2 };
  const CLASS_SLOTS = [1, 0.75, 0.35, 0.12]; // seniors, juniors, sophomores, freshmen
  const POOL_MIN = 55.5; // projected rating below which no power program evaluates a player
  const CLASS_PEN = [0, 0.5, 2.5, 5]; // seniors, juniors, sophomores, freshmen: offers to younger players are rarer
  const WITHDRAW_AT = -5;
  const MUST_HAVE = 8; // a player this far above the bar gets an offer even if the position is full...
  const OVERFLOW = 2; // ...up to this many extra offers at the position
  const NO_CHANCE = 28;
  // Commitments: weekly chance by class (seniors, juniors, sophomores, freshmen) at the start and
  // end of the season, how much better another offer must look to flip a commit, and the weekly
  // chance a committed player flips when it does.
  const COMMIT_START = [0.03, 0.012, 0.004, 0.001];
  const COMMIT_END = [0.18, 0.05, 0.01, 0.002];
  const COMMIT_STARS = [1.2, 1.2, 1.2, 1.1, 0.8, 0.5];
  const FLIP_GAP = 12;
  const FLIP_CHANCE = 0.08;
  // A college stops offering at a position once it holds about one commit per this many offer slots.
  const COMMITS_PER_SLOT = 10;
  const SIGNED_YEARS = 6;
  const WIRE = 80;

  function get(id) {
    return BY_ID[id];
  }

  function init() {
    return { offers: {}, meta: {}, commits: {}, signed: {}, wire: [], off: {} };
  }

  // The rating a college typically recruits at.
  function band(c) {
    return 46.5 + c.prestige * 0.22;
  }
  // Distance (km) a college recruits without any penalty: elite programs recruit nationally.
  function reach(c) {
    return 250 + c.prestige * 9;
  }

  // Campus-to-school distances never change, so each school's row is computed once.
  const DIST = new Map();
  function distRow(s) {
    let row = DIST.get(s.id);
    if (!row) {
      row = new Float32Array(LIST.length);
      for (const c of LIST) row[c.i] = U.distKm(c, s);
      DIST.set(s.id, row);
    }
    return row;
  }
  function dist(c, s) {
    return distRow(s)[c.i];
  }
  // Home (2), neighboring (1) or distant (0) state, per college and player state.
  const REL = {};
  function relCode(c, st) {
    const row = REL[st] || (REL[st] = LIST.map((x) => (x.state === st ? 2 : NEIGHBORS[st] && NEIGHBORS[st].includes(x.state) ? 1 : 0)));
    return row[c.i];
  }

  function relation(c, st) {
    if (c.state === st) return 'home';
    return NEIGHBORS[st] && NEIGHBORS[st].includes(c.state) ? 'near' : 'far';
  }

  // Geography from the college's side: home-state and nearby players are easier to land,
  // and lower-prestige programs depend on them more.
  function geo(c, s, d) {
    const rel = relCode(c, s.state);
    const home = rel === 2 ? 2 + (100 - c.prestige) * 0.04 : rel;
    return home - Math.max(0, (d ? d[c.i] : dist(c, s)) - reach(c)) / 100;
  }

  /*
   * Everything a college looks at for one player.
   * cls: 0 senior .. 3 freshman. proj: rating projected to senior year. rank: national class rank (0 = unranked).
   */
  function metrics(p, s, sc, cy, year, rank, perf, off, sosMean) {
    const cls = U.clamp(cy - year - 1, 0, 3);
    const potEdge = U.clamp(p.pot - P.ovr(p) - ((4 - p.year) * 4.5 + 9), -10, 15);
    const sos = s.sos != null && s.rec && s.rec.gp ? U.clamp((s.sos - (sosMean || 0)) / 5, -1, 1) : 0;
    return {
      p, s, sc, cy, cls, rank, h: FNG.hashString(p.id), d: distRow(s),
      proj: sc + ((off && off[cy]) || 0),
      stars: R.stars(rank),
      potEdge,
      statsEdge: R.production(p, perf, s) * 0.5,
      recentEdge: R.recent(p, perf),
      compEdge: sos + (STATE_DEPTH[s.state] || 0),
    };
  }

  const HYPE = [0, 0, 0.1, 0.5, 1.5, 3]; // by stars
  // value = proj + (1-q)*0.3*pot + (0.3 + 0.7*(1-q))*stats + 0.6*recent + q*hype + competition, with q = prestige/100,
  // kept as v0 + q*v1 so the weekly pass over every college and prospect stays cheap.
  function prepare(m) {
    m.v0 = m.proj + 0.3 * m.potEdge + m.statsEdge + 0.6 * m.recentEdge + m.compEdge;
    m.v1 = -0.3 * m.potEdge - 0.7 * m.statsEdge + (m.rank ? HYPE[m.stars] : 0);
    // Best case for any college: top valuation, home-state bonus, full interest and favorable noise.
    m.ub = m.v0 + Math.max(0.5 * m.v1, m.v1) + 4 + 3 + NOISE_MAX - CLASS_PEN[m.cls];
    return m;
  }
  function value(c, m) {
    if (m.v0 == null) prepare(m);
    return m.v0 + (c.prestige / 100) * m.v1;
  }

  // Stable per college and player (how differently staffs grade the same kid). Cheap: runs for
  // every college and prospect every week. Triangular (sum of two uniforms) with the given standard
  // deviation, so it never exceeds 2.45 sd.
  function noise(c, m, sd, salt) {
    let x = (HASH[c.id] ^ Math.imul(m.h, 2654435761) ^ Math.imul(salt || 0, 374761393)) >>> 0;
    x = Math.imul(x ^ (x >>> 15), 2246822507);
    x = Math.imul(x ^ (x >>> 13), 3266489909);
    x = (x ^ (x >>> 16)) >>> 0;
    return ((x & 0xffff) / 65536 + (x >>> 16) / 65536 - 1) * 2.449 * sd;
  }
  const NOISE_MAX = 2.449 * 1.3;

  // A stable roll in [0, 1) for one player and one decision (commit week, flip week).
  function roll(m, salt) {
    let x = (Math.imul(m.h, 2654435761) ^ FNG.hashString(salt)) >>> 0;
    x = Math.imul(x ^ (x >>> 15), 2246822507);
    x = Math.imul(x ^ (x >>> 13), 3266489909);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  }

  // The prestige level a player expects from his suitors.
  function preferred(m) {
    return U.clamp(50 + (m.proj - 64) * 3.2, 20, 92);
  }

  // How interested a player is in a college (1-99): prestige against his own level (falling short of it
  // hurts more than exceeding it helps), home state and distance.
  function interest(c, m) {
    const rel = relCode(c, m.s.state);
    const gap = c.prestige - preferred(m);
    let v = 62 + (gap > 0 ? gap * 0.6 : gap * 1.1) + (rel === 2 ? 12 : rel === 1 ? 5 : 0) - Math.min(22, m.d[c.i] / 90);
    v += noise(c, m, 6, 7);
    return Math.round(U.clamp(v, 1, 99));
  }

  function interestLabel(v) {
    return v >= 80 ? 'Very high' : v >= 65 ? 'High' : v >= 45 ? 'Medium' : v >= 25 ? 'Low' : 'Very low';
  }

  // How far above (positive) or below the college's bar a player is, before position needs.
  function evaluate(c, m, progress) {
    const time = m.cls ? (1 - U.clamp(progress, 0, 1)) * 1.5 : 0;
    return finish(c, m, value(c, m) - band(c) + geo(c, m.s, m.d) - CLASS_PEN[m.cls] - time);
  }
  // The player's interest and the staff's own grade, added to everything else.
  function finish(c, m, base) {
    return base + noise(c, m, 1.3, 0) + U.clamp((interest(c, m) - 50) / 10, -4, 3);
  }

  // How much of a college's recruiting happens in the states in the game (scales its offer slots).
  function share(c, center) {
    return U.clamp(1.2 - U.distKm(c, center) / 1500, 0.35, 1);
  }

  function slotsFor(c, cy, pos, center, cls) {
    const need = 0.6 + 0.8 * (noise(c, { h: FNG.hashString(cy + '|' + pos) }, 1, 3) / 6 + 0.5);
    return Math.max(1, Math.round(SLOTS[pos] * need * share(c, center) * CLASS_SLOTS[cls || 0]));
  }

  /*
   * Weekly update. pool: [{ p, s, sc, cy }] for every player within reach of an offer.
   * ctx: { year, week, progress, rankOf(id), perf, center, sosMean }.
   * Returns new offers and withdrawn offers: [{ cid, pid, kind }].
   */
  function update(cr, pool, ctx) {
    if (!cr.meta) cr.meta = {};
    if (!cr.commits) cr.commits = {};
    const ms = pool.filter((x) => x.sc + (cr.off[x.cy] || 0) >= POOL_MIN).map((x) => prepare(metrics(x.p, x.s, x.sc, x.cy, ctx.year, ctx.rankOf(x.p.id), ctx.perf[x.p.id], cr.off, ctx.sosMean)));
    ms.sort((a, b) => b.ub - a.ub);
    for (const m of ms) {
      relCode(LIST[0], m.s.state);
      m.rel = REL[m.s.state];
      const list = cr.offers[m.p.id];
      m.held = null;
      if (list) {
        m.held = new Uint8Array(LIST.length);
        for (const o of list) if (BY_ID[o[0]]) m.held[BY_ID[o[0]].i] = 1;
      }
    }
    const byPid = {};
    for (const m of ms) {
      byPid[m.p.id] = m;
      m.kpos = m.cy + '|' + m.p.pos;
      const cm = cr.commits[m.p.id];
      m.commit = cm && BY_ID[cm[0]] ? BY_ID[cm[0]] : null;
      m.commitInterest = m.commit ? interest(m.commit, m) : 0;
    }
    // Commitments per college, class and position: a college stops recruiting a position it has filled.
    const committed = {};
    for (const c of LIST) committed[c.id] = {};
    for (const pid in cr.commits) {
      const key = byPid[pid] ? byPid[pid].kpos : cr.meta[pid] ? cr.meta[pid][0] + '|' + cr.meta[pid][1] : null;
      const cid = cr.commits[pid][0];
      if (key && committed[cid]) committed[cid][key] = (committed[cid][key] || 0) + 1;
    }
    // Offer counts per college, then class and position (players outside the pool still count).
    const counts = {};
    for (const c of LIST) counts[c.id] = {};
    for (const pid in cr.offers) {
      const key = byPid[pid] ? byPid[pid].kpos : cr.meta[pid] ? cr.meta[pid][0] + '|' + cr.meta[pid][1] : null;
      if (!key) continue;
      for (const o of cr.offers[pid]) if (counts[o[0]]) counts[o[0]][key] = (counts[o[0]][key] || 0) + 1;
    }
    // The pool as flat arrays: the per-college pass below reads these about a million times a week.
    const n = ms.length;
    const V0 = new Float64Array(n);
    const V1 = new Float64Array(n);
    const UB = new Float64Array(n);
    const PEN = new Float64Array(n);
    const YOUNG = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const m = ms[i];
      V0[i] = m.v0;
      V1[i] = m.v1;
      UB[i] = m.ub;
      PEN[i] = CLASS_PEN[m.cls];
      YOUNG[i] = m.cls ? 1 : 0;
    }
    const events = [];
    for (const c of LIST) {
      // Same as evaluate(), unrolled: this loop runs for every college and prospect each week.
      const bar = band(c);
      const q = c.prestige / 100;
      const rch = reach(c);
      const home = [0, 1, 2 + (100 - c.prestige) * 0.04];
      const time = (1 - U.clamp(ctx.progress, 0, 1)) * 1.5;
      const mine = counts[c.id];
      const slotCache = {};
      const ci = c.i;
      const cands = [];
      for (let i = 0; i < n; i++) {
        if (UB[i] < bar + WITHDRAW_AT) break;
        const m = ms[i];
        const held = m.held !== null && m.held[ci] === 1;
        if (UB[i] < bar && !held) continue;
        const dist = m.d[ci] - rch;
        const base = V0[i] + q * V1[i] - bar + home[m.rel[ci]] - (dist > 0 ? dist / 100 : 0) - PEN[i] - (YOUNG[i] ? time : 0);
        // Interest and the staff's grade add between -4 - NOISE_MAX and 3 + NOISE_MAX.
        if (held ? base - 4 - NOISE_MAX >= WITHDRAW_AT : base + 3 + NOISE_MAX < 0) continue;
        cands.push(m, base);
      }
      // Best first by everything but interest and grading noise; the full grade is computed only
      // for players who could still get (or lose) an offer.
      const order = [];
      for (let i = 0; i < cands.length; i += 2) order.push(i);
      order.sort((x, y) => cands[y + 1] - cands[x + 1]);
      for (const i of order) {
        const m = cands[i];
        const base = cands[i + 1];
        const k = m.kpos;
        if (m.held !== null && m.held[c.i] === 1) {
          // A college never pulls the offer of a player committed to it.
          if (m.commit !== c && finish(c, m, base) < WITHDRAW_AT) {
            const list = cr.offers[m.p.id];
            list.splice(list.findIndex((o) => o[0] === c.id), 1);
            mine[k]--;
            events.push({ cid: c.id, pid: m.p.id, kind: 'pulled' });
          }
          continue;
        }
        const slots = slotCache[k] || (slotCache[k] = slotsFor(c, m.cy, m.p.pos, ctx.center, m.cls));
        const have = mine[k] || 0;
        // Five-stars get offers even when the position is already well stocked.
        const elite = m.rank > 0 && m.stars === 5;
        if (have >= slots + OVERFLOW + (elite ? 2 : 0)) continue;
        // Committed players only hear from schools above their commitment, trying to flip them.
        if (m.commit && c.prestige <= m.commit.prestige) continue;
        if (!elite && (committed[c.id][k] || 0) >= Math.max(1, Math.round(slots / COMMITS_PER_SLOT))) continue;
        if (!elite && base + 3 + NOISE_MAX < (4 * have) / slots) continue;
        const e = finish(c, m, base);
        if (e < 0) continue;
        // A staff won't spend an offer on an out-of-state player with almost no interest in the school.
        if (m.rel[c.i] !== 2 && interest(c, m) < NO_CHANCE) continue;
        if (!elite && e - (4 * have) / slots < 0) continue;
        if (have >= slots && e < MUST_HAVE && !elite) continue;
        if (m.commit && interest(c, m) < m.commitInterest + FLIP_GAP) continue;
        const entry = cr.offers[m.p.id] || (cr.offers[m.p.id] = []);
        entry.push([c.id, ctx.year, ctx.week]);
        mine[k] = have + 1;
        events.push({ cid: c.id, pid: m.p.id, kind: 'offer' });
      }
    }
    // Commitments: players with offers commit to the school they like best, more often as the season
    // goes on and the older they are; committed players flip when a clearly better offer comes along.
    const progress = U.clamp(ctx.progress, 0, 1);
    for (const m of ms) {
      if (!cr.offers[m.p.id]) continue;
      const tag = m.p.id + '|' + ctx.year + '|' + ctx.week;
      const offers = offersFor(cr, m);
      if (!offers.length) continue;
      if (m.commit) {
        const better = offers.find((o) => o.college !== m.commit && o.interest >= m.commitInterest + FLIP_GAP);
        if (better && roll(m, 'flip|' + tag) < FLIP_CHANCE) {
          events.push({ cid: m.commit.id, pid: m.p.id, kind: 'decommit' });
          cr.commits[m.p.id] = [better.college.id, ctx.year, ctx.week];
          events.push({ cid: better.college.id, pid: m.p.id, kind: 'commit' });
        }
        continue;
      }
      const lead = offers[0];
      const chance = (COMMIT_START[m.cls] + (COMMIT_END[m.cls] - COMMIT_START[m.cls]) * progress) * COMMIT_STARS[m.rank ? m.stars : 0] * Math.pow(U.clamp(lead.interest / 65, 0.4, 1.6), 2);
      if (roll(m, 'commit|' + tag) >= chance) continue;
      const pick = choose(cr, m);
      cr.commits[m.p.id] = [pick.college.id, ctx.year, ctx.week];
      events.push({ cid: pick.college.id, pid: m.p.id, kind: 'commit' });
    }
    // Remember class and position so offers to players who leave the pool keep counting against needs.
    for (const pid in cr.offers) {
      if (!cr.offers[pid].length) delete cr.offers[pid];
      else if (byPid[pid]) cr.meta[pid] = [byPid[pid].cy, byPid[pid].p.pos];
    }
    for (const pid in cr.meta) if (!cr.offers[pid]) delete cr.meta[pid];
    for (const pid in cr.commits) if (!cr.offers[pid]) delete cr.commits[pid];
    cr.wire = events.slice(-WIRE).reverse().map((ev) => [ctx.year, ctx.week, ev.cid, ev.pid, ev.kind]).concat(cr.wire).slice(0, WIRE);
    return events;
  }

  // Projection offsets: how far each class trails the seniors at the same national rank.
  function offsets(classes, year) {
    const ref = (cy) => {
      const l = classes[cy];
      if (!l || !l.length) return null;
      return l[Math.min(49, l.length - 1)][1];
    };
    const senior = ref(year + 1);
    const out = {};
    for (const cy in classes) {
      const v = ref(cy);
      out[cy] = senior != null && v != null ? Math.round((senior - v) * 10) / 10 : 0;
    }
    return out;
  }

  // Offers for one player, most interesting first: [{ college, year, week, interest }].
  function offersFor(cr, m) {
    const list = cr.offers[m.p.id];
    if (!list) return [];
    return list.map((o) => ({ college: BY_ID[o[0]], year: o[1], week: o[2], interest: interest(BY_ID[o[0]], m) })).filter((o) => o.college).sort((a, b) => b.interest - a.interest || b.college.prestige - a.college.prestige);
  }

  // Colleges evaluating a player that have not offered yet (closest to offering first).
  function suitors(cr, m, progress, n) {
    const have = new Set((cr.offers[m.p.id] || []).map((o) => o[0]));
    return LIST.filter((c) => !have.has(c.id))
      .map((c) => ({ college: c, gap: evaluate(c, m, progress), interest: interest(c, m) }))
      .filter((x) => x.gap > -3)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, n || 5);
  }

  // Where a senior signs: the offering college he likes best (a little randomness, fixed per player).
  function choose(cr, m) {
    const list = offersFor(cr, m);
    if (!list.length) return null;
    let best = null;
    let bestV = -Infinity;
    for (const o of list) {
      const v = o.interest + noise(o.college, m, 8, 99);
      if (v > bestV) {
        bestV = v;
        best = o;
      }
    }
    return best;
  }

  // Signing day: seniors: [{ m, name }]. Records each signee in his college's class and clears his offers.
  function sign(cr, seniors, year) {
    const out = {};
    const signed = (cr.signed[year] = []);
    for (const { m, name } of seniors) {
      const cm = cr.commits && cr.commits[m.p.id];
      const pick = (cm && offersFor(cr, m).find((o) => o.college.id === cm[0])) || choose(cr, m);
      if (pick) {
        out[m.p.id] = pick;
        signed.push([pick.college.id, m.p.id, name, m.p.pos, m.s.id, m.stars, m.rank, Math.round(m.sc * 10) / 10, (cr.offers[m.p.id] || []).length]);
        cr.wire.unshift([year, 17, pick.college.id, m.p.id, 'signed']);
      }
      delete cr.offers[m.p.id];
      delete cr.meta[m.p.id];
      if (cr.commits) delete cr.commits[m.p.id];
    }
    if (cr.wire.length > WIRE) cr.wire.length = WIRE;
    for (const y in cr.signed) if (Number(y) <= year - SIGNED_YEARS) delete cr.signed[y];
    return out;
  }

  // A player's commitment: { college, year, week } or null.
  function commitOf(cr, pid) {
    const cm = cr.commits && cr.commits[pid];
    return cm && BY_ID[cm[0]] ? { college: BY_ID[cm[0]], year: cm[1], week: cm[2] } : null;
  }

  // Every current offer from one college: [{ pid, year, week }].
  function offersBy(cr, cid) {
    const out = [];
    for (const pid in cr.offers) for (const o of cr.offers[pid]) if (o[0] === cid) out.push({ pid, year: o[1], week: o[2] });
    return out;
  }

  function confName(id) {
    return CONF_NAME[id] || id;
  }

  FNG.Colleges = {
    LIST, POOL_MIN, NEIGHBORS, get, init, band, reach, relation, metrics, value, interest, interestLabel, evaluate,
    update, offsets, offersFor, suitors, sign, offersBy, commitOf, confName, share, slotsFor,
  };
})();
