/*
 * Team rankings: a power rating for every varsity team, recomputed each week.
 *
 * Each game is worth its (capped) margin of victory plus the opponent's rating plus a bonus or
 * penalty for the result, so wins, losses, margin, strength of schedule and opponent quality all
 * count. A preseason prior built from the roster fades as games are played. Ratings are solved
 * iteratively because every opponent's rating depends on its own opponents.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U } = FNG;

  const PRIOR_GAMES = 3;
  const MOV_CAP = 24;
  const RESULT = 3;

  function prior(s, ratings) {
    return (FNG.Team.teamOverall(ratings) - 43) * 1.5 + (s.prestige - 50) * 0.04;
  }

  // ratingsOf(school) -> unit ratings. Sets s.tpr (power rating), s.sos and s.mov on every school.
  function compute(state, ratingsOf) {
    const idx = {};
    state.schools.forEach((s, i) => (idx[s.id] = i));
    const n = state.schools.length;
    const pri = state.schools.map((s) => prior(s, ratingsOf(s)));
    const games = state.schools.map(() => []);
    for (const g of state.games) {
      if (!g.played) continue;
      const h = idx[g.home];
      const a = idx[g.away];
      const m = g.hs - g.as;
      games[h].push([a, U.clamp(m, -MOV_CAP, MOV_CAP), m > 0, m]);
      games[a].push([h, U.clamp(-m, -MOV_CAP, MOV_CAP), m < 0, -m]);
    }
    let r = pri.slice();
    for (let it = 0; it < 20; it++) {
      const next = new Array(n);
      for (let i = 0; i < n; i++) {
        let sum = pri[i] * PRIOR_GAMES;
        for (const [o, mov, win] of games[i]) sum += mov + r[o] * 0.9 + (win ? RESULT : -RESULT);
        next[i] = sum / (PRIOR_GAMES + games[i].length);
      }
      r = next;
    }
    state.schools.forEach((s, i) => {
      const list = games[i];
      s.tpr = Math.round(r[i] * 10) / 10;
      s.sos = list.length ? Math.round(U.avg(list.map((x) => r[x[0]])) * 10) / 10 : 0;
      s.mov = list.length ? Math.round(U.avg(list.map((x) => x[3])) * 10) / 10 : 0;
    });
  }

  // A snapshot stores school indexes in rank order plus their ratings (x10), kept compact for saves.
  function snapshot(state, key, label) {
    const order = state.schools.map((s, i) => i).sort((a, b) => state.schools[b].tpr - state.schools[a].tpr || a - b);
    const snap = { key, label, year: state.year, order, tpr: order.map((i) => Math.round(state.schools[i].tpr * 10)) };
    const snaps = state.rankings.snaps;
    const at = snaps.findIndex((x) => x.key === key);
    if (at >= 0) snaps[at] = snap;
    else snaps.push(snap);
    return snap;
  }

  // Ranked list for a scope: [{ s, rank, tpr }]. filter(s) narrows to a state or division.
  function list(state, snap, filter) {
    const out = [];
    snap.order.forEach((i, k) => {
      const s = state.schools[i];
      if (!filter || filter(s)) out.push({ s, rank: out.length + 1, tpr: snap.tpr[k] / 10 });
    });
    return out;
  }

  function rankOf(state, snap, s, filter) {
    if (!snap) return 0;
    const target = state.schools.indexOf(s);
    let r = 0;
    for (const i of snap.order) {
      const x = state.schools[i];
      if (!filter || filter(x)) {
        r++;
        if (i === target) return r;
      }
    }
    return 0;
  }

  const scopes = {
    national: () => null,
    state: (s) => (x) => x.state === s.state,
    division: (s) => (x) => x.state === s.state && x.division === s.division,
  };

  // Rank and movement since the previous snapshot for a school in a scope.
  function standing(state, s, scope, snapIndex) {
    const snaps = state.rankings.snaps;
    const i = snapIndex == null ? snaps.length - 1 : snapIndex;
    const f = scopes[scope](s);
    const rank = rankOf(state, snaps[i], s, f);
    const prev = i > 0 ? rankOf(state, snaps[i - 1], s, f) : 0;
    return { rank, prev, move: prev ? prev - rank : 0 };
  }

  FNG.TeamRank = { compute, snapshot, list, rankOf, standing, scopes };
})();
