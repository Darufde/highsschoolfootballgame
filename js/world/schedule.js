/* Regular-season schedule: league round robins late, nearby non-league games early. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U } = FNG;

  const WEEKS = 10;

  function generate(schools, leagues, year, userId) {
    const rng = new RNG('schedule|' + year);
    const byId = {};
    for (const s of schools) byId[s.id] = s;
    const slots = {};
    const played = {};
    const homes = {};
    for (const s of schools) {
      slots[s.id] = new Array(WEEKS + 1).fill(null);
      played[s.id] = new Set();
      homes[s.id] = 0;
    }
    const games = [];
    const add = (week, a, b, league) => {
      let home = a;
      let away = b;
      if (homes[a] > homes[b] || (homes[a] === homes[b] && rng.chance(0.5))) {
        home = b;
        away = a;
      }
      const g = { id: year + '-' + week + '-' + games.length, week, home, away, league, played: false };
      games.push(g);
      slots[a][week] = g.id;
      slots[b][week] = g.id;
      played[a].add(b);
      played[b].add(a);
      homes[home]++;
    };

    // League round robins (circle method), finishing in week 10.
    for (const lg of leagues) {
      const ids = rng.shuffle(lg.members.slice());
      if (ids.length % 2) ids.push(null);
      const n = ids.length;
      const rounds = n - 1;
      const start = WEEKS - rounds + 1;
      for (let r = 0; r < rounds; r++) {
        const week = start + r;
        for (let i = 0; i < n / 2; i++) {
          const a = ids[i];
          const b = ids[n - 1 - i];
          if (a && b) add(week, a, b, true);
        }
        ids.splice(1, 0, ids.pop());
      }
    }

    // Non-league: nearest available similar-sized opponent. User and periphery first.
    const center = FNG.DATA.ohio.center;
    const order = schools.slice().sort((a, b) => {
      if (a.id === userId) return -1;
      if (b.id === userId) return 1;
      return U.distKm(center, b) - U.distKm(center, a);
    });
    for (let w = 1; w <= WEEKS; w++) {
      const free = order.filter((s) => !slots[s.id][w]);
      const open = new Set(free.map((s) => s.id));
      for (const s of free) {
        if (!open.has(s.id)) continue;
        let best = null;
        let bestScore = Infinity;
        for (const t of free) {
          if (t === s || !open.has(t.id) || t.leagueId === s.leagueId || played[s.id].has(t.id)) continue;
          const score = U.distKm(s, t) + 28 * Math.abs(s.tier - t.tier) + rng.next() * 25;
          if (score < bestScore) {
            bestScore = score;
            best = t;
          }
        }
        if (best) {
          add(w, s.id, best.id, false);
          open.delete(s.id);
          open.delete(best.id);
        }
      }
    }
    return games;
  }

  // Friday of each week. Week 1 is the first Friday on or after Aug 20.
  function weekDate(year, week) {
    const d = new Date(year, 7, 20);
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + (week - 1) * 7);
    return d;
  }

  function weekDateStr(year, week, long) {
    const d = weekDate(year, week);
    return d.toLocaleDateString('en-US', long ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' });
  }

  function weatherFor(rng, week) {
    if (week <= 3) return rng.weighted({ Clear: 5, Hot: 3, Cloudy: 2, Rain: 1 });
    if (week <= 8) return rng.weighted({ Clear: 5, Cloudy: 3, Rain: 1.5, Windy: 1, Cold: 0.5 });
    if (week <= 12) return rng.weighted({ Clear: 3, Cloudy: 3, Rain: 2, Windy: 1.5, Cold: 2, Snow: 0.3 });
    return rng.weighted({ Clear: 2, Cloudy: 3, Rain: 1.5, Windy: 1.5, Cold: 3, Snow: 1 });
  }

  FNG.Schedule = { WEEKS, generate, weekDate, weekDateStr, weatherFor };
})();
