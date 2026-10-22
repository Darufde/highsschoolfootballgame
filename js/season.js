/* Season flow: new game, weekly simulation, standings, computer points, playoffs, offseason. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U, Team, Players, Engine, Schedule, World } = FNG;

  const START_YEAR = 2026;
  const SIZE_ENROLL = { small: 240, medium: 600, large: 1200, xl: 2100 };
  const STATUS_PRESTIGE = { rebuild: 28, average: 50, established: 72 };
  const DIV_PTS = [0, 6, 5.5, 5, 4.5, 4, 3.5, 3];
  const SEED_ORDER = [1, 16, 8, 9, 5, 12, 4, 13, 3, 14, 6, 11, 7, 10, 2, 15];
  const ROUND_NAMES = ['', 'Regional First Round', 'Regional Second Round', 'Regional Semifinal', 'Regional Final', 'State Semifinal', 'State Championship'];
  const FACILITIES = {
    weight: { name: 'Weight Room', desc: 'Offseason strength and speed gains.' },
    practice: { name: 'Practice Fields', desc: 'Offseason and in-season player development.' },
    film: { name: 'Film Room', desc: 'Game-day preparation (all units) and sharper scouting.' },
    stadium: { name: 'Stadium', desc: 'Home-field advantage and gate revenue.' },
    youth: { name: 'Youth Program', desc: 'Quality of each incoming freshman class.' },
    medical: { name: 'Training Room', desc: 'Fewer injuries during games.' },
  };
  const UPGRADE_COST = [0, 15000, 30000, 55000, 90000];
  const FOCUS = {
    balanced: 'Balanced', offense: 'Offensive Install', defense: 'Defensive Install', conditioning: 'Conditioning', film: 'Opponent Film Study',
  };

  /* ------------------------------------------------------------------ */
  /* Lookup                                                              */
  /* ------------------------------------------------------------------ */
  const indexCache = new WeakMap();
  function school(state, id) {
    let idx = indexCache.get(state);
    if (!idx || idx.n !== state.schools.length) {
      idx = { n: state.schools.length, map: {} };
      for (const s of state.schools) idx.map[s.id] = s;
      indexCache.set(state, idx);
    }
    return idx.map[id];
  }
  const user = (state) => school(state, state.userId);
  const league = (state, id) => state.leagues.find((l) => l.id === id);

  function emptyRecord() {
    return { w: 0, l: 0, lw: 0, ll: 0, pf: 0, pa: 0, streak: '', pw: 0, seed: 0, result: '' };
  }

  function addNews(state, text, kind) {
    state.news.unshift({ year: state.year, week: state.week, text, kind: kind || 'info' });
    if (state.news.length > 80) state.news.length = 80;
  }

  function budget(s) {
    return s.type === 'private' ? 30000 + s.enrollment * 10 + s.prestige * 220 : 18000 + s.enrollment * 6 + s.prestige * 180;
  }

  function teamRatings(state, s) {
    return s.isUser ? Team.userRatings(state) : s.r;
  }

  function initialElo(r) {
    return 1500 + (Team.teamOverall(r) - 60) * 15;
  }

  /* ------------------------------------------------------------------ */
  /* New game                                                            */
  /* ------------------------------------------------------------------ */
  function makeUserSchool(setup) {
    const c = FNG.DATA.ohio.cities.find((x) => x.name === setup.city);
    const r = new RNG('user|' + setup.name + '|' + setup.city);
    let enrollment = SIZE_ENROLL[setup.size];
    if (!enrollment) {
      if (setup.type === 'private') enrollment = c.pop >= 100000 ? 900 : 450;
      else enrollment = c.pop >= 100000 ? 1700 : Math.round(U.clamp(c.pop * 0.042 + 160, 150, 2600));
    }
    const name = setup.name.trim();
    return {
      id: 'USER',
      name,
      city: c.name,
      county: c.county,
      lat: c.lat + r.float(-0.02, 0.02),
      lon: c.lon + r.float(-0.02, 0.02),
      type: setup.type,
      kind: setup.type === 'private' ? 'private' : 'public',
      enrollment,
      prestige: STATUS_PRESTIGE[setup.status] || 50,
      abbr: World.abbreviate(name),
      isUser: true,
    };
  }

  // Used by the setup screen preview: where would this school land?
  function preview(setup) {
    const world = World.baseWorld();
    const s = makeUserSchool(setup);
    World.placeUserSchool(world, s);
    const lg = world.leagues.find((l) => l.id === s.leagueId);
    const byId = {};
    for (const x of world.schools) byId[x.id] = x;
    return {
      school: s,
      league: lg.name,
      leagueMates: lg.members.filter((id) => id !== s.id).map((id) => byId[id]),
      regionSize: world.schools.filter((x) => x.region === s.region).length,
      sameCity: world.schools.filter((x) => x.city === s.city && x.id !== s.id),
      nearby: world.schools
        .filter((x) => x.id !== s.id)
        .sort((a, b) => U.distKm(a, s) - U.distKm(b, s))
        .slice(0, 8),
    };
  }

  function newGame(setup) {
    const world = World.baseWorld();
    const s = makeUserSchool(setup);
    World.placeUserSchool(world, s);
    const year = START_YEAR;
    const state = {
      version: 1,
      year,
      week: 1,
      phase: 'regular',
      userId: s.id,
      coach: { name: setup.coach.trim() || 'Coach', wins: 0, losses: 0, playoffWins: 0, titles: 0, regionTitles: 0, leagueTitles: 0, seasons: 0 },
      colors: setup.colors,
      schools: world.schools,
      leagues: world.leagues,
      games: [],
      playoffs: null,
      roster: [],
      depth: {},
      program: { funds: 0, facilities: { weight: 1, practice: 1, film: 1, stadium: 1, youth: 1, medical: 1 }, focus: 'balanced', revenue: 0 },
      news: [],
      history: [],
      champions: [],
      offseason: null,
      settings: { autoSave: true, speed: 'normal', autoCall: false },
      created: Date.now(),
    };
    for (const x of state.schools) {
      x.basePrestige = x.prestige;
      x.history = [];
      x.rec = emptyRecord();
      x.cp = 0;
      if (!x.isUser) {
        x.r = Team.aiRatings(x, new RNG('ai|' + x.id + '|' + year));
        x.elo = initialElo(x.r);
      }
    }
    const rng = new RNG();
    state.roster = Players.generateRoster(rng, Team.userTalent(s, state.program.facilities), Players.rosterTarget(s.enrollment));
    state.depth = Team.autoDepth(state.roster);
    s.elo = initialElo(Team.userRatings(state));
    state.program.funds = budget(s);
    state.games = Schedule.generate(state.schools, state.leagues, year, state.userId);
    computeRatings(state);
    const lg = league(state, s.leagueId);
    addNews(state, 'Coach ' + state.coach.name + ' takes over the ' + s.name + ' program. The ' + year + ' season opens ' + Schedule.weekDateStr(year, 1, true) + '.', 'big');
    addNews(state, s.name + ' will compete in Division ' + U.roman(s.division) + ', Region ' + s.region + ', as a member of the ' + lg.name + '.');
    return state;
  }

  /* ------------------------------------------------------------------ */
  /* Games                                                               */
  /* ------------------------------------------------------------------ */
  function weekGames(state, week) {
    return state.games.filter((g) => g.week === (week || state.week));
  }
  function userGame(state, week) {
    const w = week || state.week;
    return state.games.find((g) => g.week === w && (g.home === state.userId || g.away === state.userId));
  }
  function userSchedule(state) {
    return state.games.filter((g) => g.home === state.userId || g.away === state.userId).sort((a, b) => a.week - b.week);
  }
  function opponentOf(state, g, id) {
    return school(state, g.home === id ? g.away : g.home);
  }

  function gameWeather(game) {
    return Schedule.weatherFor(new RNG('wx|' + game.id), game.week);
  }

  function context(state, id) {
    const s = school(state, id);
    return s.isUser ? Team.userContext(state, s) : Team.aiContext(s, state.year);
  }

  function engineGame(state, game, record) {
    const opts = { neutral: !!game.neutral, weather: gameWeather(game), record };
    const fac = state.program.facilities;
    if (game.home === state.userId) opts.homeBonus = (fac.stadium - 1) * 0.4;
    if (state.program.focus === 'film') {
      opts.boost = [0, 0];
      opts.boost[game.home === state.userId ? 0 : 1] = 1;
    }
    return Engine.create(context(state, game.home), context(state, game.away), opts);
  }

  function isUserGame(state, game) {
    return game.home === state.userId || game.away === state.userId;
  }

  function buildBox(g) {
    return {
      names: [g.teams[0].name, g.teams[1].name],
      abbr: [g.teams[0].abbr, g.teams[1].abbr],
      score: g.score.slice(),
      qs: g.qs.map((q) => q.slice()),
      ot: g.ot,
      weather: g.weather,
      totals: [Engine.totals(g, 0), Engine.totals(g, 1)],
      players: Object.values(g.pstats),
      scoring: g.scoring.slice(),
    };
  }

  function finishGame(state, game, g) {
    game.played = true;
    game.hs = g.score[0];
    game.as = g.score[1];
    game.ot = g.ot;
    if (isUserGame(state, game)) {
      game.box = buildBox(g);
      applyUserGame(state, game, g);
    }
    applyResult(state, game);
  }

  function simGame(state, game) {
    const g = engineGame(state, game, isUserGame(state, game));
    Engine.simToEnd(g);
    finishGame(state, game, g);
    return g;
  }

  const STAT_KEYS = ['pAtt', 'pCmp', 'pYds', 'pTD', 'pInt', 'rAtt', 'rYds', 'rTD', 'rec', 'recYds', 'recTD', 'tkl', 'sck', 'dInt', 'fgm', 'fga', 'xpm', 'xpa', 'pnt', 'pntYds'];

  function applyUserGame(state, game, g) {
    const ui = game.home === state.userId ? 0 : 1;
    const byId = {};
    for (const p of state.roster) byId[p.id] = p;
    const lineup = Team.resolveLineup(state.roster, state.depth);
    const appeared = new Set();
    for (const pos in lineup.groups) for (const p of lineup.groups[pos]) appeared.add(p.id);
    for (const s of Object.values(g.pstats)) if (s.team === ui) appeared.add(s.id);
    for (const id of appeared) {
      const p = byId[id];
      if (!p) continue;
      const season = (p.stats[state.year] = p.stats[state.year] || { gp: 0 });
      season.gp++;
      const s = g.pstats[id];
      if (s) for (const k of STAT_KEYS) if (s[k]) season[k] = (season[k] || 0) + s[k];
      if (s && s.rLong) season.rLong = Math.max(season.rLong || 0, s.rLong);
    }
    for (const inj of g.injuries) {
      if (inj.team !== ui) continue;
      const p = byId[inj.id];
      if (!p) continue;
      p.injury = inj.weeks;
      p.injNew = true;
      p.injuryNote = inj.weeks >= 6 ? 'Season-threatening injury' : inj.weeks + ' week' + (inj.weeks > 1 ? 's' : '');
      addNews(state, P_INJ(p, inj.weeks), 'injury');
    }
    // Gate revenue
    const s = user(state);
    let gate = 0;
    if (game.home === state.userId && !game.neutral) gate = 2500 + state.program.facilities.stadium * 900 + s.prestige * 25 + (game.playoff ? 3000 : 0);
    else if (game.playoff) gate = 1500 + (game.playoff.round >= 3 ? 2500 : 0);
    if (gate) {
      state.program.funds += gate;
      state.program.revenue += gate;
    }
  }

  function P_INJ(p, weeks) {
    return Players.fullName(p) + ' (' + p.pos + ') was injured and is expected to miss ' + (weeks >= 6 ? 'most of the season' : weeks + ' week' + (weeks > 1 ? 's' : '')) + '.';
  }

  function streakAdd(rec, won) {
    const m = /^([WL])(\d+)$/.exec(rec.streak);
    const c = won ? 'W' : 'L';
    rec.streak = m && m[1] === c ? c + (Number(m[2]) + 1) : c + '1';
  }

  function applyResult(state, game) {
    const h = school(state, game.home);
    const a = school(state, game.away);
    const hw = game.hs > game.as;
    const w = hw ? h : a;
    const l = hw ? a : h;
    const ws = Math.max(game.hs, game.as);
    const ls = Math.min(game.hs, game.as);
    w.rec.w++;
    l.rec.l++;
    if (game.league) {
      w.rec.lw++;
      l.rec.ll++;
    }
    h.rec.pf += game.hs;
    h.rec.pa += game.as;
    a.rec.pf += game.as;
    a.rec.pa += game.hs;
    streakAdd(w.rec, true);
    streakAdd(l.rec, false);
    if (game.playoff) {
      w.rec.pw++;
      l.rec.result = 'Lost in ' + ROUND_NAMES[game.playoff.round];
    }
    // Elo
    const adv = game.neutral ? 0 : 40;
    const exp = 1 / (1 + Math.pow(10, (a.elo - h.elo - adv) / 400));
    const k = 26 * (Math.log(Math.abs(game.hs - game.as) + 1) * 0.9 + 0.5);
    const delta = k * ((hw ? 1 : 0) - exp);
    h.elo += delta;
    a.elo -= delta;

    if (w.isUser || l.isUser) {
      const won = w.isUser;
      if (won) state.coach.wins++;
      else state.coach.losses++;
      if (game.playoff && won) state.coach.playoffWins++;
      const opp = won ? l : w;
      const tag = game.playoff ? ROUND_NAMES[game.playoff.round] + ': ' : '';
      addNews(state, tag + user(state).name + (won ? ' defeats ' : ' falls to ') + opp.name + ' ' + (won ? ws + '-' + ls : ls + '-' + ws) + (game.ot ? ' in ' + (game.ot > 1 ? game.ot + 'OT' : 'overtime') : '') + '.', won ? 'win' : 'loss');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rankings                                                            */
  /* ------------------------------------------------------------------ */
  // OHSAA-style computer points: level 1 (wins by opponent division) + level 2 (wins of beaten opponents).
  function computeRatings(state) {
    const L1 = {};
    const beat = {};
    const sched = {};
    for (const s of state.schools) {
      L1[s.id] = 0;
      beat[s.id] = [];
      sched[s.id] = 0;
    }
    for (const g of state.games) {
      if (g.playoff) continue;
      sched[g.home]++;
      sched[g.away]++;
      if (!g.played) continue;
      const wId = g.hs > g.as ? g.home : g.away;
      const lId = g.hs > g.as ? g.away : g.home;
      L1[wId] += DIV_PTS[school(state, lId).division];
      beat[wId].push(lId);
    }
    for (const s of state.schools) {
      let L2 = 0;
      for (const id of beat[s.id]) L2 += L1[id];
      s.cp = Math.round(((L1[s.id] + L2 / 10) / Math.max(1, sched[s.id])) * 10000) / 10000;
    }
    const regions = {};
    for (const s of state.schools) (regions[s.region] = regions[s.region] || []).push(s);
    for (const r in regions) {
      regions[r].sort(cpSort).forEach((s, i) => (s.cpRank = i + 1));
    }
  }

  function cpSort(a, b) {
    return b.cp - a.cp || b.rec.w - a.rec.w || b.elo - a.elo || (a.id < b.id ? -1 : 1);
  }

  function regionStandings(state, region) {
    return state.schools.filter((s) => s.region === region).sort(cpSort);
  }

  function poll(state, division) {
    return state.schools
      .filter((s) => !division || s.division === division)
      .slice()
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 25);
  }

  function pollRank(state, s, division) {
    const list = poll(state, division);
    const i = list.indexOf(s);
    return i >= 0 ? i + 1 : 0;
  }

  function leagueStandings(state, leagueId) {
    const lg = league(state, leagueId);
    return lg.members
      .map((id) => school(state, id))
      .sort((a, b) => U.pct(b.rec.lw, b.rec.ll) - U.pct(a.rec.lw, a.rec.ll) || b.rec.lw - a.rec.lw || U.pct(b.rec.w, b.rec.l) - U.pct(a.rec.w, a.rec.l) || b.rec.pf - b.rec.pa - (a.rec.pf - a.rec.pa));
  }

  /* ------------------------------------------------------------------ */
  /* Playoffs                                                            */
  /* ------------------------------------------------------------------ */
  function setupPlayoffs(state) {
    computeRatings(state);
    const P = {};
    for (let div = 1; div <= 7; div++) {
      const D = { regions: {}, state: { rounds: [] }, champion: null };
      for (let k = 1; k <= 4; k++) {
        const region = (div - 1) * 4 + k;
        const list = regionStandings(state, region);
        const seeds = list.slice(0, 16).map((s) => s.id);
        list.forEach((s, i) => {
          s.rec.seed = i < 16 ? i + 1 : 0;
          if (i >= 16) s.rec.result = 'Missed playoffs';
        });
        D.regions[region] = { seeds, rounds: [SEED_ORDER.map((n) => seeds[n - 1] || null)], champion: null };
      }
      P[div] = D;
    }
    state.playoffs = P;
    const u = user(state);
    if (u.rec.seed) addNews(state, u.name + ' qualifies for the playoffs as the No. ' + u.rec.seed + ' seed in Division ' + U.roman(u.division) + ', Region ' + u.region + '!', 'big');
    else addNews(state, u.name + ' finishes ' + U.ordinal(u.cpRank) + ' in Region ' + u.region + ' and misses the playoffs.', 'loss');
    createPlayoffGames(state, 1);
  }

  function seedOf(state, id) {
    return school(state, id).rec.seed || 99;
  }

  function createPlayoffGames(state, round) {
    const week = 10 + round;
    const mk = (a, b, div, region, slot) => {
      let home = a;
      let away = b;
      if (round <= 4 && seedOf(state, b) < seedOf(state, a)) {
        home = b;
        away = a;
      }
      state.games.push({ id: state.year + '-P' + round + '-' + div + '-' + (region || 0) + '-' + slot, week, home, away, league: false, neutral: round >= 3, playoff: { div, region, round, slot }, played: false });
    };
    for (let div = 1; div <= 7; div++) {
      const D = state.playoffs[div];
      if (round <= 4) {
        for (const region in D.regions) {
          const arr = D.regions[region].rounds[round - 1];
          for (let i = 0; i < arr.length / 2; i++) if (arr[2 * i] && arr[2 * i + 1]) mk(arr[2 * i], arr[2 * i + 1], div, Number(region), i);
        }
      } else {
        const arr = D.state.rounds[round - 5];
        for (let i = 0; i < arr.length / 2; i++) if (arr[2 * i] && arr[2 * i + 1]) mk(arr[2 * i], arr[2 * i + 1], div, null, i);
      }
    }
  }

  function resolvePlayoffRound(state, round) {
    const find = (div, region, slot) => state.games.find((g) => g.playoff && g.playoff.round === round && g.playoff.div === div && g.playoff.region === region && g.playoff.slot === slot);
    const advance = (arr, div, region) => {
      const next = [];
      for (let i = 0; i < arr.length / 2; i++) {
        const a = arr[2 * i];
        const b = arr[2 * i + 1];
        if (a && b) {
          const g = find(div, region, i);
          next.push(g.hs > g.as ? g.home : g.away);
        } else next.push(a || b || null);
      }
      return next;
    };
    for (let div = 1; div <= 7; div++) {
      const D = state.playoffs[div];
      if (round <= 4) {
        for (const region in D.regions) {
          const R = D.regions[region];
          R.rounds[round] = advance(R.rounds[round - 1], div, Number(region));
          if (round === 4) {
            R.champion = R.rounds[4][0];
            if (R.champion) school(state, R.champion).rec.regionChamp = true;
          }
        }
        if (round === 4) D.state.rounds[0] = Object.keys(D.regions).map((r) => D.regions[r].champion);
      } else {
        D.state.rounds[round - 4] = advance(D.state.rounds[round - 5], div, null);
        if (round === 6) {
          D.champion = D.state.rounds[2][0];
          if (D.champion) {
            const c = school(state, D.champion);
            c.rec.result = 'State Champion';
            state.champions.push({ year: state.year, div, id: c.id, name: c.name });
          }
        }
      }
    }
    const u = user(state);
    if (round === 4 && u.rec.regionChamp) {
      state.coach.regionTitles++;
      addNews(state, u.name + ' wins the Region ' + u.region + ' championship and advances to the state semifinals!', 'big');
    }
    if (round === 6) {
      for (let div = 1; div <= 7; div++) {
        const c = school(state, state.playoffs[div].champion);
        if (c) addNews(state, c.name + ' wins the Division ' + U.roman(div) + ' state championship.', c.isUser ? 'big' : 'info');
      }
      if (u.rec.result === 'State Champion') state.coach.titles++;
    }
  }

  function userAlive(state) {
    if (state.phase !== 'playoffs') return state.phase === 'regular';
    const u = user(state);
    if (!u.rec.seed) return false;
    return !/^Lost/.test(u.rec.result) && u.rec.result !== 'State Champion';
  }

  /* ------------------------------------------------------------------ */
  /* Weekly advance                                                      */
  /* ------------------------------------------------------------------ */
  function advanceWeek(state) {
    if (state.phase === 'offseason') return;
    for (const g of weekGames(state)) if (!g.played) simGame(state, g);
    postWeek(state);
  }

  function postWeek(state) {
    const rng = new RNG();
    const fac = state.program.facilities;
    for (const p of state.roster) {
      if (p.injNew) p.injNew = false;
      else if (p.injury > 0) {
        p.injury--;
        if (p.injury === 0) {
          p.injuryNote = '';
          addNews(state, Players.fullName(p) + ' (' + p.pos + ') has been cleared to return.', 'info');
        }
      }
      Players.practiceWeek(rng, p, state.program.focus, fac.practice);
    }
    // Injured starters are swapped out automatically; healthy ones return to their slots.
    state.depth = Team.autoDepth(state.roster, state.depth);
    computeRatings(state);
    const u = user(state);

    if (state.phase === 'regular') {
      if (state.week === 10) {
        // League champions
        for (const lg of state.leagues) {
          const st = leagueStandings(state, lg.id);
          const top = st[0];
          for (const s of st) if (s.rec.lw === top.rec.lw && s.rec.ll === top.rec.ll) s.rec.leagueChamp = true;
        }
        if (u.rec.leagueChamp) {
          state.coach.leagueTitles++;
          addNews(state, u.name + ' clinches a share of the ' + league(state, u.leagueId).name + ' title!', 'big');
        }
        state.phase = 'playoffs';
        state.week = 11;
        setupPlayoffs(state);
      } else {
        state.week++;
      }
    } else if (state.phase === 'playoffs') {
      const round = state.week - 10;
      resolvePlayoffRound(state, round);
      if (round < 6) {
        state.week++;
        createPlayoffGames(state, round + 1);
      } else {
        beginOffseason(state);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Offseason                                                           */
  /* ------------------------------------------------------------------ */
  const OFFSEASON_STEPS = ['Season Recap', 'Graduation', 'Player Development', 'Incoming Class', 'Program Budget'];

  function seasonSummary(s) {
    if (s.rec.result === 'State Champion') return 'State Champion';
    if (s.rec.result) return s.rec.result;
    return s.rec.seed ? 'Playoffs' : 'Missed playoffs';
  }

  function beginOffseason(state) {
    state.phase = 'offseason';
    state.week = 17;
    const u = user(state);
    // Season record for every school, prestige drift.
    for (const s of state.schools) {
      const result = seasonSummary(s);
      s.history.unshift({ year: state.year, w: s.rec.w, l: s.rec.l, lw: s.rec.lw, ll: s.rec.ll, result, league: !!s.rec.leagueChamp });
      if (s.history.length > (s.isUser ? 40 : 12)) s.history.length = s.isUser ? 40 : 12;
      const pct = U.pct(s.rec.w, s.rec.l);
      let delta = (pct - 0.5) * 9 + s.rec.pw * 1.3 + (result === 'State Champion' ? 5 : 0) + (s.rec.leagueChamp ? 1 : 0);
      const anchor = s.isUser ? 50 : s.basePrestige;
      s.prestige = Math.round(U.clamp(s.prestige * 0.9 + anchor * 0.1 + delta, 3, 99));
    }
    state.coach.seasons++;
    // Honors for user players
    const awards = [];
    const lineup = Team.resolveLineup(state.roster, state.depth);
    const starters = new Set();
    for (const pos in lineup.groups) for (const p of lineup.groups[pos]) starters.add(p.id);
    const winning = u.rec.w > u.rec.l;
    const ranked = state.roster.filter((p) => starters.has(p.id)).sort((a, b) => Players.ovr(b) - Players.ovr(a));
    const slots = Math.round(3 + U.pct(u.rec.w, u.rec.l) * 5);
    ranked.slice(0, slots).forEach((p, i) => {
      const o = Players.ovr(p);
      let honor = null;
      if (o >= 84 && winning) honor = 'All-Ohio';
      else if (o >= 76 && i < slots / 2) honor = 'All-League 1st Team';
      else if (o >= 69) honor = 'All-League 2nd Team';
      if (honor) {
        p.honors.push(state.year + ' ' + honor);
        awards.push({ id: p.id, name: Players.fullName(p), pos: p.pos, year: Players.CLASS_NAME[p.year], honor });
      }
    });
    state.history.unshift({
      year: state.year, w: u.rec.w, l: u.rec.l, lw: u.rec.lw, ll: u.rec.ll, pf: u.rec.pf, pa: u.rec.pa, division: u.division, region: u.region,
      result: seasonSummary(u), seed: u.rec.seed, leagueChamp: !!u.rec.leagueChamp, prestige: u.prestige,
      games: userSchedule(state).map((g) => {
        const home = g.home === state.userId;
        const opp = opponentOf(state, g, state.userId);
        return { week: g.week, opp: opp.name, home, neutral: !!g.neutral, us: home ? g.hs : g.as, them: home ? g.as : g.hs, ot: g.ot, round: g.playoff ? g.playoff.round : 0 };
      }),
    });
    state.offseason = { step: 0, awards, graduates: [], development: [], incoming: [], budgetAdded: 0 };
    addNews(state, 'The ' + state.year + ' season is complete. ' + u.name + ' finished ' + u.rec.w + '-' + u.rec.l + ' (' + seasonSummary(u) + ').', 'big');
  }

  function offseasonNext(state) {
    const O = state.offseason;
    if (!O) return;
    const rng = new RNG();
    const u = user(state);
    const fac = state.program.facilities;
    if (O.step === 0) {
      // Graduation
      O.graduates = state.roster.filter((p) => p.year === 4).map((p) => ({ name: Players.fullName(p), pos: p.pos, ovr: Players.ovr(p), honors: p.honors.slice(-2) }));
      state.roster = state.roster.filter((p) => p.year < 4);
    } else if (O.step === 1) {
      // Development
      O.development = state.roster
        .map((p) => {
          const before = Players.ovr(p);
          const delta = Players.developOffseason(rng, p, fac);
          p.year++;
          p.injury = 0;
          p.injuryNote = '';
          return { id: p.id, name: Players.fullName(p), pos: p.pos, year: Players.CLASS_NAME[p.year], before, after: before + delta, delta };
        })
        .sort((a, b) => b.delta - a.delta);
    } else if (O.step === 2) {
      // Incoming freshmen (+ transfers)
      const talent = Team.userTalent(u, fac);
      const taken = new Set(state.roster.map((p) => p.num));
      const nFresh = Math.max(5, Math.round((Players.rosterTarget(u.enrollment) / 4) * rng.normal(1.05, 0.12) + (u.prestige - 50) / 25));
      const incoming = [];
      for (const pos of Players.classPositions(rng, nFresh)) incoming.push(Object.assign(Players.generate(rng, pos, 1, talent, taken), { origin: 'Freshman' }));
      const transfers = u.type === 'private' ? Math.round(1 + u.prestige / 35 + rng.next()) : rng.chance(0.3) ? 1 : 0;
      for (let i = 0; i < transfers; i++) {
        const pos = rng.weighted(Players.POS_MIX);
        incoming.push(Object.assign(Players.generate(rng, pos, rng.int(2, 3), talent + (u.type === 'private' ? 4 : 2), taken), { origin: 'Transfer' }));
      }
      // Make sure the cupboard is never bare at key spots.
      for (const [pos, min] of [['QB', 2], ['K', 1], ['OL', 6], ['DL', 4]]) {
        let have = state.roster.concat(incoming).filter((p) => p.pos === pos).length;
        while (have++ < min) incoming.push(Object.assign(Players.generate(rng, pos, 1, talent, taken), { origin: 'Walk-on' }));
      }
      state.roster = state.roster.concat(incoming);
      // Big rosters thin out: a few underclassmen buried on the depth chart move on.
      const cap = Math.round(Players.rosterTarget(u.enrollment) * 1.3);
      O.departures = [];
      if (state.roster.length > cap) {
        const fresh = new Set(incoming.map((p) => p.id));
        const leaving = state.roster
          .filter((p) => !fresh.has(p.id) && p.pos !== 'QB' && p.pos !== 'K')
          .sort((a, b) => Players.ovr(a) - Players.ovr(b))
          .slice(0, state.roster.length - cap);
        const gone = new Set(leaving.map((p) => p.id));
        state.roster = state.roster.filter((p) => !gone.has(p.id));
        O.departures = leaving.map((p) => Players.fullName(p) + ' (' + p.pos + ')');
      }
      O.incoming = incoming.map((p) => ({ id: p.id, name: Players.fullName(p), pos: p.pos, ovr: Players.ovr(p), stars: Players.potentialStars(p), origin: p.origin, year: Players.CLASS_NAME[p.year] }));
      for (const p of incoming) delete p.origin;
    } else if (O.step === 3) {
      const add = budget(u);
      state.program.funds += add;
      O.budgetAdded = add;
    } else {
      newSeason(state);
      return;
    }
    O.step++;
  }

  function newSeason(state) {
    state.year++;
    state.week = 1;
    state.phase = 'regular';
    state.playoffs = null;
    state.offseason = null;
    state.program.revenue = 0;
    // Keep only this season's games (and last season's user box scores live in history via player stats).
    state.games = [];
    for (const s of state.schools) {
      s.rec = emptyRecord();
      s.cp = 0;
      if (!s.isUser) {
        s.r = Team.aiRatings(s, new RNG('ai|' + s.id + '|' + state.year), s.r);
        s.elo = s.elo * 0.55 + initialElo(s.r) * 0.45;
      }
    }
    state.depth = Team.autoDepth(state.roster, state.depth);
    const u = user(state);
    u.elo = u.elo * 0.55 + initialElo(Team.userRatings(state)) * 0.45;
    state.games = Schedule.generate(state.schools, state.leagues, state.year, state.userId);
    computeRatings(state);
    addNews(state, 'The ' + state.year + ' season is here. Week 1 kicks off ' + Schedule.weekDateStr(state.year, 1, true) + '.', 'big');
  }

  /* ------------------------------------------------------------------ */
  /* Program                                                             */
  /* ------------------------------------------------------------------ */
  function upgradeCost(state, key) {
    const lvl = state.program.facilities[key];
    return lvl >= 5 ? null : UPGRADE_COST[lvl];
  }

  function upgrade(state, key) {
    const cost = upgradeCost(state, key);
    if (cost == null || state.program.funds < cost) return false;
    state.program.funds -= cost;
    state.program.facilities[key]++;
    addNews(state, FACILITIES[key].name + ' upgraded to level ' + state.program.facilities[key] + '.', 'info');
    return true;
  }

  // What the user's staff believes about an opponent (film room sharpens the report).
  function scout(state, s) {
    if (s.isUser) return Team.userRatings(state);
    const film = state.program.facilities.film;
    const rng = new RNG('scout|' + s.id + '|' + state.year);
    const sd = (5 - film) * 1.3;
    const out = {};
    for (const k in s.r) out[k] = Math.round(s.r[k] + rng.normal(0, sd));
    return out;
  }

  function phaseLabel(state) {
    if (state.phase === 'offseason') return 'Offseason';
    if (state.phase === 'playoffs') return ROUND_NAMES[state.week - 10];
    return 'Week ' + state.week;
  }

  FNG.Season = {
    START_YEAR, ROUND_NAMES, FACILITIES, FOCUS, OFFSEASON_STEPS, SIZE_ENROLL, STATUS_PRESTIGE,
    school, user, league, addNews, preview, newGame, weekGames, userGame, userSchedule, opponentOf, gameWeather,
    engineGame, finishGame, simGame, advanceWeek, computeRatings, regionStandings, poll, pollRank, leagueStandings,
    userAlive, offseasonNext, upgradeCost, upgrade, scout, phaseLabel, teamRatings, budget, isUserGame, seasonSummary,
  };
})();
