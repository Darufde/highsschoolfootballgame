/*
 * Season flow: new game, weekly simulation, varsity/JV/freshman results, standings,
 * computer points, Ohio playoffs, coaching staff, offseason and the next season.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U, Team, Players, Engine, Schedule, World, Coaches, Recruits, TeamRank, Colleges, Alumni } = FNG;

  const SAVE_VERSION = 6;
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
  const OFFSEASON_STEPS = ['Season Recap', 'Graduation', 'Player Development', 'Incoming Class', 'Staff & Budget'];
  const FOOTBALL_SCORES = [0, 3, 6, 7, 9, 10, 13, 14, 16, 17, 20, 21, 22, 24, 27, 28, 30, 31, 34, 35, 37, 38, 41, 42, 44, 45, 48, 49, 52, 55, 56, 58, 62];

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
    return { w: 0, l: 0, lw: 0, ll: 0, pf: 0, pa: 0, streak: '', pw: 0, seed: 0, result: '', yds: 0, ydsA: 0, to: 0, toF: 0, gp: 0 };
  }

  function addNews(state, text, kind) {
    state.news.unshift({ year: state.year, week: state.week, text, kind: kind || 'info' });
    if (state.news.length > 80) state.news.length = 80;
  }

  function budget(s) {
    return s.type === 'private' ? 50000 + s.enrollment * 12 + s.prestige * 300 : 35000 + s.enrollment * 8 + s.prestige * 250;
  }

  /* ------------------------------------------------------------------ */
  /* AI programs                                                         */
  /* Rosters are rebuilt from seeds and each school's stored class        */
  /* talent, so they live in memory only and never bloat the save.        */
  /* ------------------------------------------------------------------ */
  const aiCache = new WeakMap();

  function aiDevMult(s) {
    return 0.85 + s.staffQ / 250;
  }

  // Each school's developed classes carry over to the next season (cohorts), so a new season
  // develops last year's classes one step instead of rebuilding every roster from scratch.
  function aiCacheFor(state) {
    let c = aiCache.get(state);
    if (!c || c.year !== state.year) {
      const cohorts = c && c.year === state.year - 1 ? c.cohorts : {};
      c = { year: state.year, rosters: {}, contexts: {}, players: {}, cohorts, base: new Map() };
      aiCache.set(state, c);
    }
    return c;
  }

  function aiRoster(state, s) {
    const c = aiCacheFor(state);
    if (!c.rosters[s.id]) {
      const cohorts = c.cohorts[s.id] || (c.cohorts[s.id] = new Map());
      c.rosters[s.id] = Players.aiRoster(s, state.year, aiDevMult(s), cohorts);
      for (const p of c.rosters[s.id]) c.players[p.id] = { p, s };
    }
    return c.rosters[s.id];
  }

  // AI lineups don't change during a season, so their engine contexts are built once.
  function aiContext(state, s) {
    const c = aiCacheFor(state);
    if (!c.contexts[s.id]) c.contexts[s.id] = Team.aiContext(s, aiRoster(state, s));
    return c.contexts[s.id];
  }

  function classTalent(s, year) {
    return Team.programTalent(s) + new RNG('ct|' + s.id + '|' + year).normal(0, 1.6);
  }

  function refreshAIRatings(state) {
    for (const s of state.schools) if (!s.isUser) s.r = Team.aiRatings(s, aiRoster(state, s));
  }

  // States in this save's world, in registry order (a world can hold a subset of the registered states).
  const statesCache = new WeakMap();
  function states(state) {
    let keys = statesCache.get(state.schools);
    if (!keys) {
      const present = new Set(state.schools.map((s) => s.state));
      keys = World.STATES.filter((k) => present.has(k));
      statesCache.set(state.schools, keys);
    }
    return keys;
  }

  // Any player in any state: { p, s } or null.
  function findPlayer(state, id) {
    const u = user(state);
    const mine = state.roster.find((p) => p.id === id);
    if (mine) return { p: mine, s: u };
    const c = aiCacheFor(state);
    if (!c.players[id] && id[0] === 'A') {
      const sid = id.slice(1, id.indexOf('-'));
      const s = school(state, sid);
      if (s) aiRoster(state, s);
    }
    return c.players[id] || null;
  }

  /* ------------------------------------------------------------------ */
  /* Rankings: team power ratings and recruit rankings, every week        */
  /* ------------------------------------------------------------------ */
  function teamRatingsOf(state) {
    const mine = Team.userRatings(state);
    return (s) => (s.isUser ? mine : s.r);
  }

  function updateRecruits(state, label) {
    // Class lists hold [playerId, rating, previous rank (0 = newly ranked)] in rank order.
    const prev = {};
    if (state.recruits && state.recruits.year === state.year) for (const cy in state.recruits.classes) state.recruits.classes[cy].forEach((e, i) => (prev[e[0]] = i + 1));
    const classes = {};
    const pool = [];
    // AI players don't change during a season, so their base score is computed once per season.
    const cached = aiCacheFor(state).base;
    for (const s of state.schools) {
      const roster = s.isUser ? state.roster : aiRoster(state, s);
      for (const p of roster) {
        let base = s.isUser ? undefined : cached.get(p);
        if (base === undefined) {
          base = Recruits.baseScore(p, s);
          if (!s.isUser) cached.set(p, base);
        }
        if (base < Recruits.MIN_SCORE - 6) continue;
        const sc = Math.round((base + Recruits.production(p, state.perf[p.id], s)) * 10) / 10;
        if (sc < Recruits.MIN_SCORE) continue;
        const cy = Recruits.classYear(p, state.year);
        (classes[cy] = classes[cy] || []).push([p.id, sc, 0]);
        // Colleges only look at players who can reach their pool (last week's class offsets, with room).
        if (sc + ((state.cr && state.cr.off && state.cr.off[cy]) || 12) + 2 >= Colleges.POOL_MIN) pool.push({ p, s, sc, cy });
      }
    }
    for (const cy in classes) {
      classes[cy] = classes[cy].sort((a, b) => b[1] - a[1]).slice(0, Recruits.RANKED_PER_CLASS);
      for (const e of classes[cy]) e[2] = prev[e[0]] || 0;
    }
    state.recruits = { year: state.year, week: state.week, label, classes };
    updateColleges(state, pool);
  }

  /* ------------------------------------------------------------------ */
  /* College recruiting: power conference offers, every week              */
  /* ------------------------------------------------------------------ */
  function collegeContext(state) {
    const cr = state.cr;
    const played = state.schools.filter((s) => s.rec && s.rec.gp);
    cr.sosMean = played.length ? Math.round(U.avg(played.map((s) => s.sos || 0)) * 10) / 10 : 0;
    cr.center = { lat: U.round1(U.avg(state.schools.map((s) => s.lat))), lon: U.round1(U.avg(state.schools.map((s) => s.lon))) };
    cr.off = Colleges.offsets(state.recruits.classes, state.year);
  }

  function updateColleges(state, pool) {
    if (!state.cr) state.cr = Colleges.init();
    collegeContext(state);
    const rank = rankIndex(state);
    const progress = state.phase === 'regular' ? (state.week - 1) / 10 : 1;
    const events = Colleges.update(state.cr, pool, {
      year: state.year, week: state.week, progress, perf: state.perf, center: state.cr.center, sosMean: state.cr.sosMean,
      all: state.phase !== 'regular' || state.week === 1,
      rankOf: (id) => (rank[id] ? rank[id].rank : 0),
    });
    // News for the user's own players, one line per player.
    const mine = {};
    const byId = {};
    for (const p of state.roster) byId[p.id] = p;
    for (const ev of events) {
      const p = byId[ev.pid];
      if (!p) continue;
      if (ev.kind === 'offer') (mine[p.id] = mine[p.id] || { p, names: [] }).names.push(Colleges.get(ev.cid).name);
      else if (ev.kind === 'commit') addNews(state, 'Commitment: ' + Players.fullName(p) + ' (' + p.pos + ', class of ' + Recruits.classYear(p, state.year) + ') commits to ' + Colleges.get(ev.cid).name + '!', 'big');
      else if (ev.kind === 'decommit') addNews(state, 'Recruiting: ' + Players.fullName(p) + ' (' + p.pos + ') decommits from ' + Colleges.get(ev.cid).name + '.', 'info');
    }
    for (const id in mine) {
      const { p, names } = mine[id];
      const who = names.length <= 3 ? names.join(names.length === 2 ? ' and ' : ', ') : names.slice(0, 2).join(', ') + ' and ' + (names.length - 2) + ' others';
      addNews(state, 'Recruiting: ' + who + (names.length > 1 ? ' offer ' : ' offers ') + Players.fullName(p) + ' (' + p.pos + ', class of ' + Recruits.classYear(p, state.year) + ').', 'big');
    }
  }

  // What colleges see for one player (used for offers, interest and suitors on profiles).
  function prospectMetrics(state, p, s) {
    const e = rankIndex(state)[p.id];
    const sc = e ? e.score : Recruits.score(p, s, state.perf[p.id]);
    const cr = state.cr || Colleges.init();
    return Colleges.metrics(p, s, sc, Recruits.classYear(p, state.year), state.year, e ? e.rank : 0, state.perf[p.id], cr.off, cr.sosMean);
  }

  // Power conference offers for a player: [{ college, year, week, interest }], most interested first.
  function collegeOffers(state, p, s) {
    if (!state.cr || !state.cr.offers[p.id]) return [];
    if (!s) {
      const f = findPlayer(state, p.id);
      if (!f) return [];
      s = f.s;
    }
    const list = Colleges.offersFor(state.cr, prospectMetrics(state, p, s));
    // The school he committed to comes first, flagged.
    const cm = state.cr.commits && state.cr.commits[p.id];
    if (cm) {
      const at = list.findIndex((o) => o.college.id === cm[0]);
      if (at >= 0) list.unshift(Object.assign(list.splice(at, 1)[0], { committed: true, commitYear: cm[1], commitWeek: cm[2] }));
    }
    return list;
  }

  // A player's commitment: { college, year, week } or null.
  function collegeCommit(state, p) {
    return state.cr ? Colleges.commitOf(state.cr, p.id) : null;
  }

  // Colleges evaluating a player that have not offered yet.
  function collegeSuitors(state, p, s, n) {
    if (!state.cr) return [];
    const progress = state.phase === 'regular' ? (state.week - 1) / 10 : 1;
    return Colleges.suitors(state.cr, prospectMetrics(state, p, s), progress, n);
  }

  // A team's players holding power conference offers: [{ p, offers }], most offers first.
  function offeredPlayers(state, s) {
    if (!state.cr) return [];
    const roster = s.isUser ? state.roster : aiRoster(state, s);
    return roster.filter((p) => state.cr.offers[p.id]).map((p) => ({ p, offers: collegeOffers(state, p, s) }))
      .filter((x) => x.offers.length).sort((a, b) => b.offers.length - a.offers.length || Players.ovr(b.p) - Players.ovr(a.p));
  }

  // Every current offer from one college: [{ p, s, year, week, interest, m }].
  function collegeBoard(state, cid) {
    if (!state.cr) return [];
    const out = [];
    for (const o of Colleges.offersBy(state.cr, cid)) {
      const f = findPlayer(state, o.pid);
      if (!f) continue;
      const m = prospectMetrics(state, f.p, f.s);
      out.push({ p: f.p, s: f.s, year: o.year, week: o.week, m, interest: Colleges.interest(Colleges.get(cid), m), commit: Colleges.commitOf(state.cr, o.pid) });
    }
    return out;
  }

  // Ranked prospects a college is evaluating but has not offered, closest to an offer first.
  function collegeTargets(state, cid, n) {
    const c = Colleges.get(cid);
    const R = state.recruits;
    if (!R || !state.cr) return [];
    const progress = state.phase === 'regular' ? (state.week - 1) / 10 : 1;
    const out = [];
    const floor = Colleges.band(c) - 12;
    for (const cy in R.classes) {
      for (const e of R.classes[cy]) {
        if (e[1] + (state.cr.off[cy] || 0) < floor) break;
        const held = state.cr.offers[e[0]];
        if (held && held.some((o) => o[0] === cid)) continue;
        const f = findPlayer(state, e[0]);
        if (!f) continue;
        const m = prospectMetrics(state, f.p, f.s);
        if (m.proj < Colleges.band(c) - 12) continue;
        const gap = Colleges.evaluate(c, m, progress);
        if (gap > -3) out.push({ p: f.p, s: f.s, m, gap, interest: Colleges.interest(c, m) });
      }
    }
    return out.sort((a, b) => b.gap - a.gap).slice(0, n || 25);
  }

  // Signing day for every senior with a power conference offer. Returns { playerId: offer }.
  function signSeniors(state) {
    if (!state.cr) state.cr = Colleges.init();
    const seniors = [];
    for (const pid in state.cr.offers) {
      const f = findPlayer(state, pid);
      if (!f || f.p.year !== 4) continue;
      seniors.push({ m: prospectMetrics(state, f.p, f.s), name: Players.fullName(f.p) });
    }
    return Colleges.sign(state.cr, seniors, state.year);
  }

  // At the start of a season, drop offers to players no longer on a varsity roster.
  function pruneOffers(state) {
    if (!state.cr) return;
    for (const pid in state.cr.offers) {
      if (findPlayer(state, pid)) continue;
      delete state.cr.offers[pid];
      if (state.cr.meta) delete state.cr.meta[pid];
      if (state.cr.commits) delete state.cr.commits[pid];
    }
  }

  function updateRankings(state, key, label) {
    TeamRank.compute(state, teamRatingsOf(state));
    TeamRank.snapshot(state, key, label);
    updateRecruits(state, label);
  }

  // Index of ranked prospects: id -> { rank, score, cy }.
  const recruitIndex = new WeakMap();
  function rankIndex(state) {
    const R = state.recruits;
    if (!R) return {};
    let idx = recruitIndex.get(R);
    if (!idx) {
      idx = {};
      for (const cy in R.classes) R.classes[cy].forEach((e, i) => (idx[e[0]] = { rank: i + 1, score: e[1], cy: Number(cy), prev: e[2] || 0 }));
      recruitIndex.set(R, idx);
    }
    return idx;
  }

  // Recruit standing for one player: national class rank, rating, stars, movement and offers
  // (power conference offers in `offers`, lower levels in `otherOffers`).
  function recruitInfo(state, p, s) {
    const R = state.recruits;
    if (!R) return null;
    const e = rankIndex(state)[p.id];
    if (!e) return null;
    const progress = state.phase === 'regular' ? (state.week - 1) / 10 : 1;
    return {
      rank: e.rank, score: e.score, classYear: e.cy, stars: Recruits.stars(e.rank),
      prev: e.prev, move: e.prev ? e.prev - e.rank : null,
      offers: collegeOffers(state, p, s),
      otherOffers: Recruits.offers(p, e.score, state.year, progress),
    };
  }

  // Best rated recruits on a team (for game previews and school pages).
  function topRecruits(state, s, n) {
    const roster = s.isUser ? state.roster : aiRoster(state, s);
    return roster.map((p) => ({ p, info: recruitInfo(state, p, s) })).filter((x) => x.info).sort((a, b) => b.info.score - a.info.score).slice(0, n || 3);
  }

  function teamStanding(state, s, scope, snapIndex) {
    return TeamRank.standing(state, s, scope, snapIndex);
  }

  function latestSnap(state) {
    const snaps = state.rankings.snaps;
    return snaps[snaps.length - 1];
  }

  // Bring an older save up to date (school names keep their old spelling).
  // Older saves keep the states they were created with (new states are for new programs). Version 3
  // saves gain college recruiting; version 4 saves lose colleges without logos and get the larger
  // recruit rankings.
  function migrate(state) {
    if (state.version === 2) {
      state.version = 3;
      state.perf = {};
      state.rankings = { snaps: [], finals: [] };
      state.recruits = null;
      for (const s of state.schools) delete s.elo;
      updateRankings(state, 'CUR', state.phase === 'offseason' ? 'Final' : 'Current');
    }
    if (state.version === 3) {
      state.version = 4;
      for (const lg of state.leagues) if (lg.kind === 'district' && !lg.state) lg.state = 'KY';
      state.cr = Colleges.init();
    }
    if (state.version === 4) {
      state.version = 5;
      for (const lg of state.leagues) if (!lg.state) lg.state = lg.kind === 'district' ? 'KY' : 'OH';
      const cr = state.cr || (state.cr = Colleges.init());
      for (const pid in cr.offers) {
        cr.offers[pid] = cr.offers[pid].filter((o) => Colleges.get(o[0]));
        if (!cr.offers[pid].length) {
          delete cr.offers[pid];
          if (cr.meta) delete cr.meta[pid];
        }
      }
      for (const y in cr.signed) cr.signed[y] = cr.signed[y].filter((x) => Colleges.get(x[0]));
      cr.wire = cr.wire.filter((x) => Colleges.get(x[2]));
      state.recruits = null;
      updateRecruits(state, state.phase === 'offseason' ? 'Final' : 'Current');
    }
    if (state.version === 5) {
      state.version = 6;
      if (state.cr && !state.cr.commits) state.cr.commits = {};
      if (!state.alumni) state.alumni = [];
    }
    return state;
  }

  /* ------------------------------------------------------------------ */
  /* New game                                                            */
  /* ------------------------------------------------------------------ */
  function makeUserSchool(setup) {
    const stateKey = setup.state || 'OH';
    const c = World.stateData(stateKey).cities.find((x) => x.name === setup.city);
    const r = new RNG('user|' + setup.name + '|' + setup.city);
    let enrollment = SIZE_ENROLL[setup.size];
    if (!enrollment) {
      if (setup.type === 'private') enrollment = c.pop >= 100000 ? 900 : 450;
      else enrollment = c.pop >= 100000 ? 1700 : Math.round(U.clamp(c.pop * 0.042 + 160, 150, 2600));
    }
    const name = setup.name.trim();
    return {
      id: 'USER',
      state: stateKey,
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
    const active = World.activeStates(s.state, setup.scope || 'region');
    World.restrict(world, active);
    const lg = world.leagues.find((l) => l.id === s.leagueId);
    const byId = {};
    for (const x of world.schools) byId[x.id] = x;
    const sameState = world.schools.filter((x) => x.state === s.state);
    return {
      school: s,
      league: lg.name,
      leagueMates: lg.members.filter((id) => id !== s.id).map((id) => byId[id]),
      groupSize: !s.region ? sameState.filter((x) => x.division === s.division).length : sameState.filter((x) => x.region === s.region).length,
      sameCity: sameState.filter((x) => x.city === s.city && x.id !== s.id),
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
    World.restrict(world, World.activeStates(s.state, setup.scope || 'region'));
    const year = START_YEAR;
    const state = {
      version: SAVE_VERSION,
      year,
      week: 1,
      phase: 'regular',
      userId: s.id,
      coach: { name: setup.coach.trim() || 'Coach', wins: 0, losses: 0, playoffWins: 0, titles: 0, regionTitles: 0, leagueTitles: 0, seasons: 0, prospects: 0 },
      colors: setup.colors,
      schools: world.schools,
      leagues: world.leagues,
      games: [],
      playoffs: null,
      roster: [],
      depth: {},
      staff: {},
      staffRefresh: {},
      lower: { JV: { w: 0, l: 0 }, FR: { w: 0, l: 0 } },
      program: { funds: 0, facilities: { weight: 1, practice: 1, film: 1, stadium: 1, youth: 1, medical: 1 }, focus: 'balanced', revenue: 0 },
      news: [],
      history: [],
      champions: [],
      offseason: null,
      perf: {},
      rankings: { snaps: [], finals: [] },
      recruits: null,
      cr: Colleges.init(),
      alumni: [],
      settings: { autoSave: true },
      scope: setup.scope || 'region',
      created: Date.now(),
    };
    for (const x of state.schools) {
      x.basePrestige = x.prestige;
      x.history = [];
      x.rec = emptyRecord();
      x.cp = 0;
      if (!x.isUser) {
        x.staffQ = Math.round(U.clamp(34 + x.prestige * 0.3 + new RNG('staffq|' + x.id).normal(0, 7), 20, 85));
        x.ct = {};
        for (let y = year - 3; y <= year; y++) x.ct[y] = classTalent(x, y);
      }
    }
    refreshAIRatings(state);

    const rng = new RNG();
    const size = Players.programTarget(s.enrollment);
    state.roster = Players.generateProgram(rng, Team.programTalent(s, state.program.facilities), size);
    Players.autoAssignLevels(state.roster, Players.varsityTarget(size));
    Players.assignNumbers(rng, state.roster);
    state.staff = Coaches.newStaff(rng, s.prestige);
    state.depth = Team.autoDepth(state.roster);
    const pay = Coaches.payroll(state.staff);
    state.program.funds = budget(s) - pay;
    state.games = Schedule.generate(state.schools, state.leagues, year, state.userId);
    computeRatings(state);
    updateRankings(state, 'PRE', 'Preseason');
    const lg = league(state, s.leagueId);
    addNews(state, 'Coach ' + state.coach.name + ' takes over the ' + s.name + ' program: ' + state.roster.length + ' players across varsity, JV and freshman teams. The ' + year + ' season opens ' + Schedule.weekDateStr(year, 1, true) + '.', 'big');
    addNews(state, s.name + ' will compete in ' + World.divLabel(s) + (s.region ? ', Region ' + s.region + ',' : '') + ' as a member of the ' + lg.name + '. Staff payroll: ' + U.money(pay) + '.');
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
  function isUserGame(state, game) {
    return game.home === state.userId || game.away === state.userId;
  }

  function gameWeather(game) {
    return Schedule.weatherFor(new RNG('wx|' + game.id), game.week);
  }

  function context(state, id) {
    const s = school(state, id);
    return s.isUser ? Team.userContext(state, s) : aiContext(state, s);
  }

  function engineGame(state, game, record) {
    const opts = { neutral: !!game.neutral, weather: gameWeather(game), record };
    if (game.home === state.userId) opts.homeBonus = (state.program.facilities.stadium - 1) * 0.4;
    if (state.program.focus === 'film' && isUserGame(state, game)) {
      opts.boost = [0, 0];
      opts.boost[game.home === state.userId ? 0 : 1] = 1;
    }
    return Engine.create(context(state, game.home), context(state, game.away), opts);
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
      if (!game.playoff) simLowerLevels(state, game);
    }
    applyResult(state, game, g);
    trackProduction(state, g);
  }

  // Season production for anyone good enough to be evaluated as a prospect.
  function trackProduction(state, g) {
    for (const st of Object.values(g.pstats)) {
      if (state.perf[st.id]) {
        Recruits.addGame(state.perf, st);
        continue;
      }
      const found = findPlayer(state, st.id);
      if (found && Recruits.baseScore(found.p, found.s) >= trackCutoff(state, found.p)) Recruits.addGame(state.perf, st);
    }
  }

  // Only players within reach of the rankings get their production tracked (keeps saves small).
  function trackCutoff(state, p) {
    const list = state.recruits && state.recruits.classes[Recruits.classYear(p, state.year)];
    const last = list && list.length >= Recruits.TRACK_RANK ? list[Recruits.TRACK_RANK - 1][1] : Recruits.MIN_SCORE;
    return last - 8;
  }

  function simGame(state, game) {
    if (isBackground(state, game)) {
      const q = quickGame(state, game);
      finishGame(state, game, q);
      return q;
    }
    const g = engineGame(state, game, isUserGame(state, game));
    Engine.simToEnd(g);
    finishGame(state, game, g);
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Background games                                                     */
  /* Every game but the user's own is resolved from team ratings instead   */
  /* of play by play, with box-score production for each                   */
  /* team's starters so their recruiting still reflects how they play.     */
  /* The constants are fitted to the play-by-play engine.                  */
  /* ------------------------------------------------------------------ */
  const QUICK = { perPoint: 2.75, home: 2.6, spread: 14.5, total: 45.6, totalSd: 14.8, yards: 326, yardsPerPoint: 9 };

  function isBackground(state, game) {
    return !isUserGame(state, game);
  }

  function quickGame(state, game) {
    const rng = new RNG('quick|' + game.id);
    const h = school(state, game.home);
    const a = school(state, game.away);
    const oh = Team.teamOverall(h.r);
    const oa = Team.teamOverall(a.r);
    const margin = rng.normal((oh - oa) * QUICK.perPoint + (game.neutral ? 0 : QUICK.home), QUICK.spread);
    const total = U.clamp(rng.normal(QUICK.total, QUICK.totalSd), 6, 110);
    let hs = snapScore(Math.max(0, (total + margin) / 2));
    let as = snapScore(Math.max(0, (total - margin) / 2));
    if (hs === as) {
      if (rng.chance(0.5)) hs += 3;
      else as += 3;
    }
    const teams = [[h, hs, oh - oa], [a, as, oa - oh]];
    const pstats = {};
    const totals = teams.map(([s, pts, edge], i) => {
      const yards = Math.max(60, Math.round(rng.normal(QUICK.yards + (pts - QUICK.total / 2) * QUICK.yardsPerPoint + edge * 4, 45)));
      quickBox(state, rng, s, i, pts, yards, teams[1 - i][1], pstats);
      return { totalYds: yards, turnovers: Math.max(0, Math.round(rng.normal(1.6 - edge * 0.05, 1))) };
    });
    return { score: [hs, as], ot: 0, pstats, totals, quick: true };
  }

  // One team's starters' stat lines in a background game: pts scored, yards gained, opp points allowed.
  function quickBox(state, rng, s, ti, pts, yards, oppPts, out) {
    const ctx = aiContext(state, s);
    const pl = ctx.players;
    const cache = aiCacheFor(state).players;
    const ovr = (ref) => (cache[ref.id] ? Players.ovr(cache[ref.id].p) : 40);
    const line = (ref) => out[ref.id] || (out[ref.id] = { id: ref.id, team: ti, pos: ref.pos });
    // Shares within a position group lean toward the better players.
    const split = (refs, weights) => {
      const list = refs.slice(0, weights.length);
      const w = list.map((r, i) => weights[i] * U.clamp(1 + (ovr(r) - 45) / 30, 0.5, 1.6));
      const sum = w.reduce((x, y) => x + y, 0) || 1;
      return list.map((r, i) => [r, w[i] / sum]);
    };
    const tds = Math.max(0, Math.round((pts - rng.float(0, 6)) / 7));
    const fgs = Math.max(0, Math.round((pts - tds * 7) / 3));
    const passYds = yards * rng.float(0.42, 0.58);
    const rushYds = yards - passYds;
    const passTD = Math.round(tds * rng.float(0.4, 0.68));
    const rushTD = tds - passTD;
    const qb = pl.QB[0];
    if (qb) Object.assign(line(qb), { pYds: Math.round(passYds), pTD: passTD, pInt: Math.max(0, Math.round(rng.normal(0.8, 0.8))), rYds: Math.round(rushYds * 0.18) });
    for (const [r, f] of split(pl.RB, [0.68, 0.32])) Object.assign(line(r), { rYds: Math.round(rushYds * 0.87 * f), rTD: Math.round(rushTD * f * rng.float(0.7, 1.3)) });
    const catchers = split(pl.WR, [0.36, 0.3, 0.22]).map(([r, f]) => [r, f * 0.7]).concat(split(pl.TE, [1]).map(([r, f]) => [r, f * 0.18]), split(pl.RB, [1]).map(([r, f]) => [r, f * 0.12]));
    for (const [r, f] of catchers) {
      const y = Math.round(passYds * f * rng.float(0.7, 1.3));
      Object.assign(line(r), { recYds: y, rec: Math.round(y / 12), recTD: Math.round(passTD * f * rng.float(0.6, 1.4)) });
    }
    // Defense: a better day against a weaker offense means more stops and takeaways.
    const stop = U.clamp(1 + (QUICK.total / 2 - oppPts) / 40, 0.7, 1.3);
    const sacks = Math.max(0, rng.normal(1.9, 1.1) * stop);
    const picks = Math.max(0, rng.normal(0.9, 0.8) * stop);
    const db = pl.DB || [];
    const cbs = db.filter((r) => r.pos === 'CB');
    const ss = db.filter((r) => r.pos === 'S');
    for (const [r, f] of split(pl.DL, [0.32, 0.27, 0.23, 0.18])) Object.assign(line(r), { tkl: Math.round(10.5 * f * rng.float(0.6, 1.4)), sck: Math.round(sacks * 0.7 * f) });
    for (const [r, f] of split(pl.LB, [0.42, 0.33, 0.25])) Object.assign(line(r), { tkl: Math.round(21 * f * rng.float(0.7, 1.3)), sck: Math.round(sacks * 0.3 * f) });
    for (const [r, f] of split(cbs, [0.55, 0.45])) Object.assign(line(r), { tkl: Math.round(8 * f * rng.float(0.6, 1.4)), dInt: Math.round(picks * 0.55 * f) });
    for (const [r, f] of split(ss, [0.55, 0.45])) Object.assign(line(r), { tkl: Math.round(6.5 * f * rng.float(0.6, 1.4)), dInt: Math.round(picks * 0.45 * f) });
    if (pl.K[0]) Object.assign(line(pl.K[0]), { fgm: fgs });
  }

  const STAT_KEYS = ['pAtt', 'pCmp', 'pYds', 'pTD', 'pInt', 'rAtt', 'rYds', 'rTD', 'rec', 'recYds', 'recTD', 'tkl', 'sck', 'dInt', 'fgm', 'fga', 'xpm', 'xpa', 'pnt', 'pntYds'];

  function seasonStats(state, p) {
    return (p.stats[state.year] = p.stats[state.year] || { gp: 0 });
  }

  function applyUserGame(state, game, g) {
    const ui = game.home === state.userId ? 0 : 1;
    const byId = {};
    for (const p of state.roster) byId[p.id] = p;
    const appeared = new Set();
    for (const pos in g.teams[ui].lineup.groups) for (const p of g.teams[ui].lineup.groups[pos]) appeared.add(p.id);
    for (const s of Object.values(g.pstats)) if (s.team === ui) appeared.add(s.id);
    for (const id of appeared) {
      const p = byId[id];
      if (!p) continue;
      const season = seasonStats(state, p);
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
      addNews(state, Players.fullName(p) + ' (' + p.pos + ') was injured and is expected to miss ' + (inj.weeks >= 6 ? 'most of the season' : inj.weeks + ' week' + (inj.weeks > 1 ? 's' : '')) + '.', 'injury');
    }
    const s = user(state);
    let gate = 0;
    if (game.home === state.userId && !game.neutral) gate = 2500 + state.program.facilities.stadium * 900 + s.prestige * 25 + (game.playoff ? 3000 : 0);
    else if (game.playoff) gate = 1500 + (game.playoff.round >= 3 ? 2500 : 0);
    if (gate) {
      state.program.funds += gate;
      state.program.revenue += gate;
    }
  }

  /* JV and freshman games: lightly simulated from each squad's strength. -- */
  function snapScore(v) {
    let best = 0;
    for (const s of FOOTBALL_SCORES) if (Math.abs(s - v) < Math.abs(best - v)) best = s;
    return best;
  }

  function squadStrength(players, bonus) {
    const top = players.map(Players.ovr).sort((a, b) => b - a).slice(0, 22);
    while (top.length < 22) top.push(8);
    return U.avg(top) + bonus;
  }

  // Opponent JV/freshman strength, estimated from that program's class talent.
  function opponentSquad(state, s, level) {
    const t = (y) => (s.ct && s.ct[y] != null ? s.ct[y] : Team.programTalent(s));
    const staff = ((s.staffQ || 50) - 50) * 0.06;
    if (level === 'FR') return t(state.year) - 8.7 + 1.7 + 3.5 + staff;
    return (t(state.year - 1) - 2.1 + t(state.year - 2) + 2.5) / 2 + 1.7 - 2.5 + staff;
  }

  function simLowerLevels(state, game) {
    const fx = Team.userEffects(state);
    const opp = opponentOf(state, game, state.userId);
    const home = game.home === state.userId;
    const rng = new RNG();
    for (const level of ['JV', 'FR']) {
      const players = state.roster.filter((p) => p.level === level && p.injury <= 0);
      const key = level.toLowerCase();
      if (players.length < 15) {
        game[key] = { cancelled: true };
        continue;
      }
      const us = squadStrength(players, level === 'JV' ? fx.jvGame : fx.frGame);
      const them = opponentSquad(state, opp, level);
      const margin = rng.normal((us - them) * 1.5 + (home ? 1.5 : -1.5), 12);
      const total = U.clamp(rng.normal(36, 11), 6, 80);
      let a = snapScore(Math.max(0, (total + margin) / 2));
      let b = snapScore(Math.max(0, (total - margin) / 2));
      if (a === b) {
        if (margin >= 0) a += 3;
        else b += 3;
      }
      game[key] = { us: a, them: b };
      state.lower[level][a > b ? 'w' : 'l']++;
      for (const p of players.sort((x, y) => Players.ovr(y) - Players.ovr(x)).slice(0, 30)) seasonStats(state, p).lgp = (seasonStats(state, p).lgp || 0) + 1;
    }
  }

  function streakAdd(rec, won) {
    const m = /^([WL])(\d+)$/.exec(rec.streak);
    const c = won ? 'W' : 'L';
    rec.streak = m && m[1] === c ? c + (Number(m[2]) + 1) : c + '1';
  }

  function applyResult(state, game, g) {
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
    if (g) {
      const T = g.totals || [Engine.totals(g, 0), Engine.totals(g, 1)];
      [[h, 0], [a, 1]].forEach(([s, i]) => {
        s.rec.gp++;
        s.rec.yds += T[i].totalYds;
        s.rec.ydsA += T[1 - i].totalYds;
        s.rec.to += T[i].turnovers;
        s.rec.toF += T[1 - i].turnovers;
      });
    }
    streakAdd(w.rec, true);
    streakAdd(l.rec, false);
    if (game.playoff) {
      w.rec.pw++;
      l.rec.result = 'Lost in ' + ROUND_NAMES[game.playoff.round];
    }
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
  // OHSAA-style computer points: level 1 (wins by opponent size) + level 2 (wins of beaten opponents).
  // Out-of-state opponents count at their Ohio-equivalent division.
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
      L1[wId] += DIV_PTS[school(state, lId).tier];
      beat[wId].push(lId);
    }
    for (const s of state.schools) {
      let L2 = 0;
      for (const id of beat[s.id]) L2 += L1[id];
      s.cp = Math.round(((L1[s.id] + L2 / 10) / Math.max(1, sched[s.id])) * 10000) / 10000;
    }
    const regions = {};
    for (const s of state.schools) if (s.region) (regions[s.region] = regions[s.region] || []).push(s);
    for (const r in regions) regions[r].sort(cpSort).forEach((s, i) => (s.cpRank = i + 1));
  }

  function cpSort(a, b) {
    return b.cp - a.cp || b.rec.w - a.rec.w || (b.tpr || 0) - (a.tpr || 0) || (a.id < b.id ? -1 : 1);
  }

  function regionStandings(state, region) {
    return state.schools.filter((s) => s.region === region).sort(cpSort);
  }

  function leagueStandings(state, leagueId) {
    const lg = league(state, leagueId);
    return lg.members
      .map((id) => school(state, id))
      .sort((a, b) => U.pct(b.rec.lw, b.rec.ll) - U.pct(a.rec.lw, a.rec.ll) || b.rec.lw - a.rec.lw || U.pct(b.rec.w, b.rec.l) - U.pct(a.rec.w, a.rec.l) || b.rec.pf - b.rec.pa - (a.rec.pf - a.rec.pa));
  }

  /* ------------------------------------------------------------------ */
  /* Ohio playoffs                                                       */
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
    if (World.hasPlayoffs(u.state)) {
      if (u.rec.seed) addNews(state, u.name + ' qualifies for the playoffs as the No. ' + u.rec.seed + ' seed in Division ' + U.roman(u.division) + ', Region ' + u.region + '!', 'big');
      else addNews(state, u.name + ' finishes ' + U.ordinal(u.cpRank) + ' in Region ' + u.region + ' and misses the playoffs.', 'loss');
    }
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
            state.champions.push({ year: state.year, state: 'OH', div, id: c.id, name: c.name });
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
        if (c) addNews(state, c.name + ' wins the Ohio Division ' + U.roman(div) + ' state championship.', c.isUser ? 'big' : 'info');
      }
      if (u.rec.result === 'State Champion') state.coach.titles++;
    }
  }

  // Whether the user still has games to play this season.
  function userAlive(state) {
    if (state.phase === 'regular') return true;
    if (state.phase !== 'playoffs') return false;
    const u = user(state);
    if (!World.hasPlayoffs(u.state) || !u.rec.seed) return false;
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

  function practice(state) {
    const rng = new RNG();
    const fac = state.program.facilities;
    const fx = Team.userEffects(state);
    const lineup = Team.resolveLineup(state.roster, state.depth);
    const starters = new Set();
    for (const pos in lineup.groups) for (const p of lineup.groups[pos]) starters.add(p.id);
    for (const p of state.roster) {
      const reps = p.level === 'V' ? (starters.has(p.id) ? 1 : 0.5) : 0.85;
      const mult = p.level === 'V' ? fx.dev[p.pos] : p.level === 'JV' ? fx.jv : fx.fr;
      Players.practiceWeek(rng, p, state.program.focus, fac.practice, reps, mult);
    }
  }

  function postWeek(state) {
    for (const p of state.roster) {
      if (p.injNew) p.injNew = false;
      else if (p.injury > 0) {
        p.injury--;
        if (p.injury === 0) {
          p.injuryNote = '';
          if (p.level === 'V') addNews(state, Players.fullName(p) + ' (' + p.pos + ') has been cleared to return.', 'info');
        }
      }
    }
    if (state.phase === 'regular') practice(state);
    state.depth = Team.autoDepth(state.roster, state.depth);
    computeRatings(state);
    if (state.phase === 'regular') updateRankings(state, 'W' + state.week, 'Week ' + state.week);
    else updateRankings(state, 'P' + (state.week - 10), ROUND_NAMES[state.week - 10]);
    const u = user(state);

    if (state.phase === 'regular') {
      if (state.week === 10) {
        for (const lg of state.leagues) {
          const st = leagueStandings(state, lg.id);
          const top = st[0];
          for (const s of st) if (s.rec.lw === top.rec.lw && s.rec.ll === top.rec.ll) s.rec.leagueChamp = true;
        }
        for (const s of state.schools) if (!World.hasPlayoffs(s.state)) s.rec.result = s.rec.leagueChamp ? World.leagueWord(s.state) + ' Champion' : 'Season complete';
        if (u.rec.leagueChamp) {
          state.coach.leagueTitles++;
          addNews(state, u.name + ' clinches a share of the ' + league(state, u.leagueId).name + ' title!', 'big');
        }
        if (!World.hasPlayoffs(u.state)) addNews(state, u.name + ' finishes the regular season ' + u.rec.w + '-' + u.rec.l + '. ' + World.stateName(u.state) + '’s ' + World.assoc(u.state) + ' playoff format is not in the game yet, so the season ends here.', 'big');
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
  function seasonSummary(s) {
    if (!World.hasPlayoffs(s.state)) return s.rec.leagueChamp ? World.leagueWord(s.state) + ' Champion' : 'Season complete';
    if (s.rec.result === 'State Champion') return 'State Champion';
    if (s.rec.result) return s.rec.result;
    return s.rec.seed ? 'Playoffs' : 'Missed playoffs';
  }

  function beginOffseason(state) {
    state.phase = 'offseason';
    state.week = 17;
    updateRankings(state, 'FINAL', 'Final');
    const fin = latestSnap(state);
    state.rankings.finals.unshift({ year: state.year, order: fin.order.slice(0, 100), tpr: fin.tpr.slice(0, 100) });
    if (state.rankings.finals.length > 25) state.rankings.finals.length = 25;
    const u = user(state);
    for (const s of state.schools) {
      const result = seasonSummary(s);
      s.history.unshift({ year: state.year, w: s.rec.w, l: s.rec.l, lw: s.rec.lw, ll: s.rec.ll, result, league: !!s.rec.leagueChamp });
      if (s.history.length > (s.isUser ? 40 : 8)) s.history.length = s.isUser ? 40 : 8;
      const pct = U.pct(s.rec.w, s.rec.l);
      const delta = (pct - 0.5) * 9 + s.rec.pw * 1.3 + (result === 'State Champion' ? 5 : 0) + (s.rec.leagueChamp ? 1 : 0);
      const anchor = s.isUser ? 50 : s.basePrestige;
      s.prestige = Math.round(U.clamp(s.prestige * 0.9 + anchor * 0.1 + delta, 3, 99));
    }
    state.coach.seasons++;
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
      if (o >= 60 && winning) honor = 'All-State';
      else if (o >= 52 && i < slots / 2) honor = 'All-League 1st Team';
      else if (o >= 45) honor = 'All-League 2nd Team';
      if (honor) {
        p.honors.push(state.year + ' ' + honor);
        awards.push({ id: p.id, name: Players.fullName(p), pos: p.pos, year: Players.CLASS_NAME[p.year], honor });
      }
    });
    state.history.unshift({
      year: state.year, state: u.state, w: u.rec.w, l: u.rec.l, lw: u.rec.lw, ll: u.rec.ll, pf: u.rec.pf, pa: u.rec.pa, division: u.division, region: u.region,
      result: seasonSummary(u), seed: u.rec.seed, leagueChamp: !!u.rec.leagueChamp, prestige: u.prestige,
      jv: Object.assign({}, state.lower.JV), fr: Object.assign({}, state.lower.FR),
      games: userSchedule(state).map((g) => {
        const home = g.home === state.userId;
        const opp = opponentOf(state, g, state.userId);
        return { week: g.week, opp: opp.name, home, neutral: !!g.neutral, us: home ? g.hs : g.as, them: home ? g.as : g.hs, ot: g.ot, round: g.playoff ? g.playoff.round : 0 };
      }),
    });
    // Former players finish their college or pro seasons.
    for (const a of state.alumni || []) if (a.grad < state.year) for (const line of Alumni.playSeason(a, state.year)) addNews(state, 'Alumni: ' + line, 'info');
    const offerCounts = {};
    for (const p of state.roster) if (p.year === 4 && state.cr && state.cr.offers[p.id]) offerCounts[p.id] = state.cr.offers[p.id].length;
    const signings = signSeniors(state);
    const mine = {};
    for (const p of state.roster) if (signings[p.id]) mine[p.id] = signings[p.id];
    state.offseason = { step: 0, awards, graduates: [], development: [], incoming: [], departures: [], promoted: 0, staffChanges: [], budgetAdded: 0, payroll: 0, signings: mine, offerCounts };
    addNews(state, 'The ' + state.year + ' season is complete. ' + u.name + ' finished ' + u.rec.w + '-' + u.rec.l + ' (' + seasonSummary(u) + ').', 'big');
  }

  function offseasonNext(state) {
    const O = state.offseason;
    if (!O) return;
    const rng = new RNG();
    const u = user(state);
    const fac = state.program.facilities;
    const fx = Team.userEffects(state);
    if (O.step === 0) {
      // Graduation, with where each senior projects at the next level.
      const seniors = state.roster.filter((p) => p.year === 4);
      O.graduates = seniors.map((p) => {
        const info = recruitInfo(state, p, u);
        const sc = info ? info.score : Recruits.score(p, u, state.perf[p.id]);
        const pick = (O.signings || {})[p.id];
        const c = pick ? { name: pick.college.name, tier: 5, label: 'Signed with ' + pick.college.name + ' (' + Colleges.confName(pick.college.conf) + ')', cid: pick.college.id } : Recruits.commitment(p, sc, state.year);
        return { cid: c.cid || null, offers: (O.offerCounts || {})[p.id] || 0, id: p.id, name: Players.fullName(p), pos: p.pos, ovr: Players.ovr(p), pot: p.pot, rank: info ? info.rank : 0, stars: info ? info.stars : 0, outlook: c.label, college: c.name, tier: c.tier, honors: p.honors.slice(-2) };
      });
      // Everyone who signs to play in college is followed as an alumnus.
      if (!state.alumni) state.alumni = [];
      for (const p of seniors) {
        const g = O.graduates.find((x) => x.id === p.id);
        if (g && g.tier >= 1 && g.college) state.alumni.push(Alumni.create(p, g, u, state.year));
      }
      const signed = O.graduates.filter((g) => g.tier >= 3);
      state.coach.prospects += signed.length;
      for (const g of signed) addNews(state, g.name + ' (' + g.pos + ') signs with ' + g.college + '.', 'big');
      state.roster = state.roster.filter((p) => p.year < 4);
    } else if (O.step === 1) {
      const physical = fx.physical + (fac.weight - 1) * 0.5;
      O.development = state.roster
        .map((p) => {
          const before = Players.ovr(p);
          const mult = p.level === 'V' ? fx.dev[p.pos] : p.level === 'JV' ? fx.jv : fx.fr;
          const delta = Players.developOffseason(rng, p, { mult, practice: fac.practice, physical: physical / 3 });
          p.year++;
          p.injury = 0;
          p.injuryNote = '';
          return { id: p.id, name: Players.fullName(p), pos: p.pos, year: Players.CLASS_NAME[p.year], before, after: before + delta, delta };
        })
        .sort((a, b) => b.delta - a.delta);
      Players.fixLevels(state.roster);
    } else if (O.step === 2) {
      const talent = Team.programTalent(u, fac);
      const target = Players.programTarget(u.enrollment);
      const nFresh = Math.max(12, Math.round((target / 4) * rng.normal(1.04, 0.07) + (u.prestige - 50) / 12));
      const incoming = [];
      for (const pos of Players.classPositions(rng, nFresh)) incoming.push(Object.assign(Players.generate(rng, pos, 1, talent, null), { origin: 'Freshman', level: 'FR' }));
      const transfers = u.type === 'private' ? Math.round(1 + u.prestige / 35 + rng.next()) : rng.chance(0.3) ? 1 : 0;
      for (let i = 0; i < transfers; i++) {
        const t = Players.generate(rng, rng.weighted(Players.POS_MIX), rng.int(2, 3), talent + (u.type === 'private' ? 4 : 2), null);
        incoming.push(Object.assign(t, { origin: 'Transfer', level: 'JV' }));
      }
      for (const [pos, min] of [['QB', 4], ['K', 2], ['OL', 14], ['DL', 10]]) {
        let have = state.roster.concat(incoming).filter((p) => p.pos === pos).length;
        while (have++ < min) incoming.push(Object.assign(Players.generate(rng, pos, 1, talent, null), { origin: 'Walk-on', level: 'FR' }));
      }
      state.roster = state.roster.concat(incoming);
      // Programs that outgrow their numbers lose a few players buried on the depth chart.
      const cap = Math.round(target * 1.12);
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
      // Fill varsity back up after graduation with the best players from the lower teams.
      const vTarget = Players.varsityTarget(target);
      let varsity = state.roster.filter((p) => p.level === 'V').length;
      const promote = state.roster.filter((p) => p.level !== 'V').sort((a, b) => Players.ovr(b) - Players.ovr(a));
      O.promoted = 0;
      while (varsity < vTarget && promote.length) {
        promote.shift().level = 'V';
        varsity++;
        O.promoted++;
      }
      Players.assignNumbers(rng, state.roster);
      O.incoming = incoming.filter((p) => state.roster.includes(p)).map((p) => ({ id: p.id, name: Players.fullName(p), pos: p.pos, ovr: Players.ovr(p), stars: Players.potentialStars(p), origin: p.origin, year: Players.CLASS_NAME[p.year], level: p.level }));
      for (const p of incoming) delete p.origin;
    } else if (O.step === 3) {
      const before = {};
      for (const id in state.staff) if (state.staff[id]) before[id] = state.staff[id];
      O.staffChanges = Coaches.offseason(state.staff, rng);
      // Alumni who leave the staff: retired for good, or coaching somewhere else for a while.
      for (const ch of O.staffChanges) {
        const a = alumnus(state, before[ch.role] && before[ch.role].alumId);
        if (!a) continue;
        a.status = 'retired';
        if (ch.why === 'retired') a.coachDone = true;
        else a.away = state.year + 4;
      }
      for (const c of O.staffChanges) addNews(state, Coaches.ROLE[c.role].title + ' ' + c.name + ' ' + c.why + '.', 'info');
      state.staffRefresh = {};
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
    state.lower = { JV: { w: 0, l: 0 }, FR: { w: 0, l: 0 } };
    state.games = [];
    state.perf = {};
    state.rankings.snaps = [];
    state.recruits = null;
    for (const s of state.schools) {
      s.rec = emptyRecord();
      s.cp = 0;
      if (!s.isUser) {
        s.ct[state.year] = classTalent(s, state.year);
        for (const y in s.ct) if (Number(y) < state.year - 3) delete s.ct[y];
      }
    }
    refreshAIRatings(state);
    pruneOffers(state);
    Players.fixLevels(state.roster);
    state.depth = Team.autoDepth(state.roster, state.depth);
    const u = user(state);
    const pay = Coaches.payroll(state.staff);
    state.program.funds -= pay;
    state.games = Schedule.generate(state.schools, state.leagues, state.year, state.userId);
    computeRatings(state);
    updateRankings(state, 'PRE', 'Preseason');
    addNews(state, 'The ' + state.year + ' season is here. Staff payroll of ' + U.money(pay) + ' has been paid. Week 1 kicks off ' + Schedule.weekDateStr(state.year, 1, true) + '.', 'big');
    const vacant = Coaches.ROLES.filter((r) => !state.staff[r.id]);
    if (vacant.length) addNews(state, 'Open staff positions: ' + vacant.map((r) => r.title).join(', ') + '. Hire replacements from the Coaching Staff window.', 'injury');
  }

  /* ------------------------------------------------------------------ */
  /* Program management                                                  */
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

  function setLevel(state, playerId, level) {
    const p = state.roster.find((x) => x.id === playerId);
    if (!p || !Players.levelAllowed(p, level) || p.level === level) return false;
    p.level = level;
    Players.assignNumbers(new RNG(), state.roster);
    state.depth = Team.autoDepth(state.roster, state.depth);
    return true;
  }

  function autoLevels(state) {
    const target = Players.programTarget(user(state).enrollment);
    Players.autoAssignLevels(state.roster, Players.varsityTarget(target));
    Players.assignNumbers(new RNG(), state.roster);
    state.depth = Team.autoDepth(state.roster, state.depth);
  }

  // Mid-season hires cost half a season's salary now; offseason hires are covered by next payroll.
  function hireCost(state, coach) {
    return state.phase === 'offseason' ? 0 : Math.round(coach.salary / 2);
  }

  // Coaching candidates for a role: your own alumni first, then the open market.
  function marketFor(state, role) {
    const taken = new Set(Object.values(state.staff).filter(Boolean).map((c) => c.id));
    const year = state.phase === 'offseason' ? state.year + 1 : state.year;
    const alumni = Alumni.candidatesFor(state.alumni || [], role, year).sort((a, b) => Coaches.ovr(b) - Coaches.ovr(a));
    return alumni.concat(Coaches.candidates(role, state.year, state.staffRefresh[role] || 0)).filter((c) => !taken.has(c.id));
  }

  function alumnus(state, id) {
    return id ? (state.alumni || []).find((a) => a.id === id) || null : null;
  }

  function hire(state, role, coach) {
    const cost = hireCost(state, coach);
    if (state.program.funds < cost) return false;
    state.program.funds -= cost;
    const prev = state.staff[role];
    if (prev && alumnus(state, prev.alumId)) alumnus(state, prev.alumId).status = 'retired';
    state.staff[role] = Object.assign({}, coach, { years: 0 });
    const a = alumnus(state, coach.alumId);
    if (a) {
      a.status = 'staff';
      a.staffRole = role;
    }
    state.staffRefresh[role] = (state.staffRefresh[role] || 0) + 1;
    addNews(state, user(state).name + ' hires ' + coach.first + ' ' + coach.last + ' as ' + Coaches.ROLE[role].title + '.', 'info');
    return true;
  }

  function fire(state, role) {
    const c = state.staff[role];
    if (!c) return false;
    state.staff[role] = null;
    const a = alumnus(state, c.alumId);
    if (a) a.status = 'retired';
    addNews(state, Coaches.ROLE[role].title + ' ' + c.first + ' ' + c.last + ' has been let go.', 'info');
    return true;
  }

  // What the user's staff believes about an opponent (film room sharpens the report).
  function scout(state, s) {
    if (s.isUser) return Team.userRatings(state);
    const film = state.program.facilities.film;
    const rng = new RNG('scout|' + s.id + '|' + state.year);
    const sd = (5 - film) * 1.1;
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
    SAVE_VERSION, START_YEAR, ROUND_NAMES, FACILITIES, FOCUS, OFFSEASON_STEPS, SIZE_ENROLL, STATUS_PRESTIGE,
    school, user, league, addNews, states, preview, newGame, weekGames, userGame, userSchedule, opponentOf, gameWeather,
    simGame, advanceWeek, computeRatings, regionStandings, leagueStandings, aiRoster, findPlayer, recruitInfo, topRecruits,
    collegeOffers, collegeSuitors, offeredPlayers, collegeBoard, collegeTargets, collegeCommit, prospectMetrics,
    teamStanding, latestSnap, migrate,
    userAlive, offseasonNext, upgradeCost, upgrade, scout, phaseLabel, budget, isUserGame, seasonSummary,
    setLevel, autoLevels, hire, fire, hireCost, marketFor, alumnus,
  };
})();
