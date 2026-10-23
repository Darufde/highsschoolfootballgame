/*
 * Recruiting: evaluates every high school player as a college prospect.
 *
 * A prospect's rating blends current ability, career ceiling, measurables (size and speed for
 * the position), on-field production this season and the level of competition. Ratings are
 * ranked by graduating class; rank drives stars, and rating drives college interest.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U } = FNG;
  const P = FNG.Players;

  // Stars per graduating class, best first: 32 five-stars, 350 four-stars, 2,000 three-stars,
  // 1,500 two-stars and 1,000 one-stars. Everyone ranked gets at least one star.
  const STAR_COUNTS = { 5: 32, 4: 350, 3: 2000, 2: 1500, 1: 1000 };
  const STAR_CUTS = [5, 4, 3, 2, 1].map((n, i, a) => a.slice(0, i + 1).reduce((t, k) => t + STAR_COUNTS[k], 0)); // last rank for 5★..1★
  const RANKED_PER_CLASS = STAR_CUTS[STAR_CUTS.length - 1];
  const TRACK_RANK = 1000; // production is tracked for players within reach of this rank
  const MIN_SCORE = 38; // below this a player isn't evaluated at all

  // Ideal size by position: [height inches, weight lbs]
  const IDEAL = {
    QB: [75, 210], RB: [71, 205], WR: [74, 190], TE: [77, 245], OL: [77, 300], DL: [76, 275],
    LB: [74, 230], CB: [72, 185], S: [73, 200], K: [72, 190], P: [74, 200],
  };
  // Expected production points per game for a solid starter.
  const EXPECTED = { QB: 14, RB: 9, WR: 6, TE: 4, DL: 3, LB: 5, CB: 2.5, S: 3.5, K: 5 };

  // Programs below the power conferences. Power conference offers come from FNG.Colleges.
  const COLLEGES = {
    4: ['Toledo', 'Bowling Green', 'Kent State', 'Akron', 'Ohio', 'Miami (OH)', 'Marshall', 'Western Kentucky', 'Ball State', 'Central Michigan', 'Eastern Michigan', 'Buffalo', 'Memphis', 'Middle Tennessee'],
    3: ['Youngstown State', 'Dayton', 'Eastern Kentucky', 'Murray State', 'Morehead State', 'Austin Peay', 'Eastern Illinois', 'Southeast Missouri', 'Duquesne', 'Robert Morris', 'Chattanooga', 'East Tennessee State', 'Tennessee Tech', 'UT Martin', 'Tennessee State'],
    2: ['Ashland', 'Findlay', 'Tiffin', 'Walsh', 'Kentucky Wesleyan', 'Lake Erie', 'Ohio Dominican', 'Hillsdale', 'Grand Valley State', 'Kentucky State', 'Central State', 'Carson-Newman', 'Tusculum', 'Lincoln Memorial'],
    1: ['Mount Union', 'Wittenberg', 'Ohio Wesleyan', 'Denison', 'Kenyon', 'Capital', 'Otterbein', 'Heidelberg', 'Baldwin Wallace', 'Marietta', 'Muskingum', 'Georgetown (KY)', 'Campbellsville', 'Thomas More', 'Centre', 'Pikeville', 'Sewanee', 'Maryville (TN)', 'Cumberland', 'Bethel (TN)', 'Bryan', 'Tennessee Wesleyan'],
  };
  const TIER_NAME = { 5: 'Power Conference (FBS)', 4: 'FBS', 3: 'FCS', 2: 'Division II', 1: 'Division III / NAIA' };

  // Graduating class of a player during a given fall season.
  function classYear(p, seasonYear) {
    return seasonYear + 5 - p.year;
  }

  // Measurables relative to the ideal at the position, plus raw speed.
  function physical(p) {
    const [ht, wt] = IDEAL[p.pos];
    const big = p.pos === 'OL' || p.pos === 'DL' || p.pos === 'TE' || p.pos === 'LB';
    let v = (p.ht - ht) * 0.45 + (p.a.spd - 40) * 0.05;
    if (big) v += U.clamp((p.wt - wt) * 0.02, -2, 1);
    return U.clamp(v, -3, 4);
  }

  // Level of competition: bigger divisions/classes and varsity play count for more.
  function competition(p, school) {
    let v = (4 - (school.tier || 4)) * 0.7;
    if (p.level && p.level !== 'V') v -= 2.5;
    return v;
  }

  // Specialists draw far less college interest than their raw rating suggests.
  function baseScore(p, school) {
    return 0.45 * P.ovr(p) + 0.4 * p.pot + physical(p) + competition(p, school) + 8 - (p.pos === 'K' || p.pos === 'P' ? 12 : 0);
  }

  // Production points for one game's stat line.
  function gamePoints(s) {
    return (s.pYds || 0) / 25 + (s.pTD || 0) * 4 - (s.pInt || 0) * 2 + (s.rYds || 0) / 10 + (s.rTD || 0) * 6 + (s.recYds || 0) / 10 +
      (s.recTD || 0) * 6 + (s.rec || 0) * 0.5 + (s.tkl || 0) + (s.sck || 0) * 3 + (s.dInt || 0) * 4 + (s.fgm || 0) * 3 + (s.xpm || 0);
  }

  // perf entry: [games, points, yards, touchdowns, tackles, sacks, interceptions, recent form]
  // Recent form is a running average that weights the latest game most.
  function addGame(store, s) {
    const e = store[s.id] || (store[s.id] = [0, 0, 0, 0, 0, 0, 0, 0]);
    const pts = gamePoints(s);
    e[7] = Math.round((e[0] ? (e[7] || 0) * 0.5 + pts * 0.5 : pts) * 10) / 10;
    e[0]++;
    e[1] = Math.round((e[1] + pts) * 10) / 10;
    e[2] += (s.pYds || 0) + (s.rYds || 0) + (s.recYds || 0);
    e[3] += (s.pTD || 0) + (s.rTD || 0) + (s.recTD || 0);
    e[4] += s.tkl || 0;
    e[5] += s.sck || 0;
    e[6] += s.dInt || 0;
  }

  // Production adjustment: strong seasons push a prospect up, quiet ones pull them back.
  function production(p, perf, school) {
    if (p.pos === 'OL' || p.pos === 'P') {
      const g = school.rec.gp;
      if (!g) return 0;
      return U.clamp((U.pct(school.rec.w, school.rec.l) - 0.5) * 4 + (school.rec.yds / g - 330) / 60, -3, 4) * Math.min(1, g / 5);
    }
    if (!perf || !perf[0]) return 0;
    const ratio = perf[1] / perf[0] / EXPECTED[p.pos];
    return U.clamp((ratio - 1) * 4, -4, 7) * Math.min(1, perf[0] / 5);
  }

  // Recent performance: the last few games against what a solid starter produces.
  function recent(p, perf) {
    if (!perf || perf[0] < 2 || perf[7] == null || !EXPECTED[p.pos]) return 0;
    return U.clamp((perf[7] / EXPECTED[p.pos] - 1) * 2.5, -2, 3);
  }

  function score(p, school, perf) {
    return Math.round((baseScore(p, school) + production(p, perf, school)) * 10) / 10;
  }

  function stars(rank) {
    if (!rank) return 0;
    for (let i = 0; i < STAR_CUTS.length; i++) if (rank <= STAR_CUTS[i]) return 5 - i;
    return 0;
  }

  // Minimum rating for each level of college to offer.
  const OFFER_AT = { 5: 70, 4: 65, 3: 61, 2: 58, 1: 55 };

  function bestTier(sc) {
    for (const t of [5, 4, 3, 2, 1]) if (sc >= OFFER_AT[t]) return t;
    return 0;
  }

  // Offers from below the power conferences: the best level a player can reach and the one below it
  // (just the level below for power conference prospects). Lists are stable per player, so offers
  // accumulate as the season goes on unless the rating drops.
  function offers(p, sc, seasonYear, progress) {
    const cls = U.clamp(classYear(p, seasonYear) - seasonYear - 1, 0, 3); // 0 = senior
    const classFactor = [1, 0.75, 0.35, 0.12][cls];
    const prog = 0.4 + 0.6 * U.clamp(progress, 0, 1);
    const top = bestTier(sc);
    const out = [];
    for (const tier of [top, top - 1]) {
      if (tier < 1 || tier > 4) continue;
      const raw = tier === top ? 1 + (sc - OFFER_AT[tier]) * 1.3 : 3 + (sc - OFFER_AT[top]) * 1.5;
      const n = Math.min(COLLEGES[tier].length, Math.floor(Math.max(0, raw) * classFactor * prog));
      if (!n) continue;
      const order = new RNG('offers|' + p.id + '|' + tier).shuffle(COLLEGES[tier].slice());
      for (let i = 0; i < n; i++) out.push({ name: order[i], tier });
    }
    return out;
  }

  // Where a senior signs without a power conference offer: the best other offer, or a projection.
  function commitment(p, sc, seasonYear) {
    const list = offers(p, sc, seasonYear, 1);
    if (list.length) return { name: list[0].name, tier: list[0].tier, label: 'Signed with ' + list[0].name + ' (' + TIER_NAME[list[0].tier] + ')' };
    if (sc >= 51) return { name: null, tier: 0, label: 'Preferred walk-on opportunity' };
    return { name: null, tier: 0, label: 'Not continuing in football' };
  }

  function statLine(p, perf) {
    if (!perf || !perf[0]) return '';
    if (['QB', 'RB', 'WR', 'TE'].includes(p.pos)) return U.num(perf[2]) + ' yds · ' + perf[3] + ' TD';
    if (p.pos === 'K' || p.pos === 'P') return perf[0] + ' GP';
    return perf[4] + ' tkl' + (perf[5] ? ' · ' + perf[5] + ' sck' : '') + (perf[6] ? ' · ' + perf[6] + ' INT' : '');
  }

  FNG.Recruits = {
    RANKED_PER_CLASS, STAR_COUNTS, STAR_CUTS, TRACK_RANK, MIN_SCORE, COLLEGES, TIER_NAME, OFFER_AT, bestTier,
    classYear, physical, competition, baseScore, gamePoints, addGame, production, recent, score, stars, offers, commitment, statLine,
  };
})();
