/*
 * Play-by-play football engine (NFHS / OHSAA flavored).
 * 12-minute quarters, kickoffs from the 40, OT possessions from the 20,
 * running clock in the second half with a 30-point margin.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U } = FNG;

  const QLEN = 720;

  const OFF_CALLS = [
    { id: 'run_in', label: 'Inside Run', kind: 'run', hint: 'Power between the tackles. Reliable short yardage.' },
    { id: 'run_out', label: 'Outside Run', kind: 'run', hint: 'Stretch to the edge. Boom or bust.' },
    { id: 'option', label: 'QB Option', kind: 'run', hint: 'QB reads the end. Needs a mobile QB.' },
    { id: 'screen', label: 'Screen', kind: 'pass', hint: 'Punishes the blitz. Low risk.' },
    { id: 'pass_quick', label: 'Quick Pass', kind: 'pass', hint: 'Slants and hitches. High percentage.' },
    { id: 'pass_med', label: 'Medium Pass', kind: 'pass', hint: 'Intermediate routes to move the chains.' },
    { id: 'pass_deep', label: 'Deep Pass', kind: 'pass', hint: 'Shot downfield. Risky but explosive.' },
    { id: 'play_action', label: 'Play Action', kind: 'pass', hint: 'Fake the run, throw behind a loaded box.' },
    { id: 'punt', label: 'Punt', kind: 'special', hint: 'Flip the field.' },
    { id: 'fg', label: 'Field Goal', kind: 'special', hint: 'Three points.' },
    { id: 'kneel', label: 'Kneel', kind: 'special', hint: 'Burn the clock.' },
  ];
  const DEF_CALLS = [
    { id: 'base', label: 'Base 4-3', hint: 'Balanced front and coverage.' },
    { id: 'run_stop', label: 'Load the Box', hint: 'Eight in the box. Vulnerable to play action.' },
    { id: 'nickel', label: 'Nickel', hint: 'Extra DB. Softer against the run.' },
    { id: 'blitz', label: 'Blitz', hint: 'Bring pressure. Screens can burn you.' },
    { id: 'prevent', label: 'Prevent', hint: 'Keep everything in front. Gives up underneath.' },
  ];
  const CALL = {};
  for (const c of OFF_CALLS) CALL[c.id] = c;

  // Defensive call modifiers against each offensive call.
  const MOD = {
    base: {},
    run_stop: {
      run_in: { yd: -1.7, big: -0.015 }, run_out: { yd: -1.0, big: -0.01 }, option: { yd: -1.2 },
      screen: { cmp: 0.03, yd: 1 }, pass_quick: { cmp: 0.04 }, pass_med: { cmp: 0.06, yd: 1.5 },
      pass_deep: { cmp: 0.07, big: 0.03 }, play_action: { cmp: 0.1, yd: 3, big: 0.03 },
    },
    nickel: {
      run_in: { yd: 1.3, big: 0.01 }, run_out: { yd: 0.4 }, option: { yd: 0.9 }, screen: { cmp: -0.02 },
      pass_quick: { cmp: -0.05 }, pass_med: { cmp: -0.06, int: 0.01 }, pass_deep: { cmp: -0.05, int: 0.01 },
      play_action: { cmp: -0.03 },
    },
    blitz: {
      run_in: { yd: -0.6, big: 0.025 }, run_out: { yd: -0.4, big: 0.03 }, option: { yd: -0.3, big: 0.03 },
      screen: { cmp: 0.05, yd: 3, big: 0.06 }, pass_quick: { sack: 0.015 }, pass_med: { sack: 0.07, cmp: -0.02 },
      pass_deep: { sack: 0.09, cmp: 0.04, big: 0.04 }, play_action: { sack: 0.08 },
    },
    prevent: {
      run_in: { yd: 2.2 }, run_out: { yd: 1.8 }, option: { yd: 2.0 }, screen: { yd: 2 },
      pass_quick: { cmp: 0.08, yd: 2 }, pass_med: { cmp: 0.02 }, pass_deep: { cmp: -0.16, int: 0.015, big: -0.04 },
      play_action: { cmp: -0.08 },
    },
  };
  const PASS = {
    screen: { cmp: 0.76, air: [-1, 1.5], yac: [5, 4], int: 0.008, sack: 0.02, big: 0.05, desc: 'screen' },
    pass_quick: { cmp: 0.69, air: [5, 2], yac: [2.5, 2.5], int: 0.016, sack: 0.035, big: 0.025, desc: 'short' },
    pass_med: { cmp: 0.56, air: [12, 3], yac: [3, 3], int: 0.027, sack: 0.065, big: 0.035, desc: 'over the middle' },
    pass_deep: { cmp: 0.37, air: [28, 7], yac: [5, 5], int: 0.048, sack: 0.085, big: 0.06, desc: 'deep' },
    play_action: { cmp: 0.53, air: [16, 5], yac: [4, 4], int: 0.03, sack: 0.075, big: 0.05, desc: 'off play action' },
  };

  const WEATHER = {
    Clear: { pass: 0, fum: 0, kick: 0 },
    Cloudy: { pass: 0, fum: 0, kick: 0 },
    Hot: { pass: 0, fum: 0, kick: 0.01 },
    Windy: { pass: -0.04, fum: 0, kick: -0.08 },
    Rain: { pass: -0.06, fum: 0.008, kick: -0.05 },
    Cold: { pass: -0.02, fum: 0.003, kick: -0.03 },
    Snow: { pass: -0.08, fum: 0.01, kick: -0.08 },
  };

  function mod(dcall, call) {
    return (MOD[dcall] && MOD[dcall][call]) || {};
  }

  /* ------------------------------------------------------------------ */
  /* Setup                                                               */
  /* ------------------------------------------------------------------ */
  function teamStats() {
    return {
      plays: 0, firstDowns: 0, rushAtt: 0, rushYds: 0, passAtt: 0, passCmp: 0, passYds: 0, sacked: 0, sackYds: 0,
      int: 0, fum: 0, fumLost: 0, penalties: 0, penYds: 0, thirdAtt: 0, thirdConv: 0, fourthAtt: 0, fourthConv: 0,
      top: 0, punts: 0, puntYds: 0,
    };
  }

  function prepTeam(t, idx, opts) {
    const team = Object.assign({}, t);
    team.r = Object.assign({}, t.r);
    team.out = new Set();
    if (!opts.neutral && idx === 0) {
      const bonus = 1.5 + (opts.homeBonus || 0);
      for (const k of ['qb', 'rb', 'wr', 'ol', 'dl', 'lb', 'db']) team.r[k] += bonus;
    }
    if (opts.boost && opts.boost[idx]) for (const k in team.r) team.r[k] += opts.boost[idx];
    // Game-day form: teenagers have good nights and bad nights.
    const form = opts.rng.normal(0, 3.2);
    for (const k in team.r) team.r[k] += form + opts.rng.normal(0, 1.5);
    team.form = form;
    return team;
  }

  function create(home, away, opts) {
    opts = opts || {};
    const rng = new RNG(opts.seed);
    opts.rng = rng;
    const g = {
      rng,
      record: opts.record !== false,
      teams: [prepTeam(home, 0, opts), prepTeam(away, 1, opts)],
      neutral: !!opts.neutral,
      weather: opts.weather || 'Clear',
      score: [0, 0],
      qs: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
      quarter: 1,
      clock: QLEN,
      ot: 0,
      otPoss: 0,
      otOrder: null,
      poss: 0,
      spot: 25,
      down: 1,
      togo: 10,
      next: 'kickoff',
      kickTeam: 0,
      secondHalfKick: 1,
      patTeam: 0,
      timeouts: [3, 3],
      clockRunning: false,
      final: false,
      log: [],
      scoring: [],
      stats: [teamStats(), teamStats()],
      pstats: {},
      injuries: [],
      lastCalls: null,
      lastResult: null,
    };
    const winner = rng.chance(0.5) ? 0 : 1;
    g.kickTeam = winner;
    g.secondHalfKick = 1 - winner;
    g.otFirst = rng.chance(0.5) ? 0 : 1;
    note(g, g.teams[winner].name + ' wins the coin toss and defers to the second half.');
    return g;
  }

  /* ------------------------------------------------------------------ */
  /* Logging helpers                                                     */
  /* ------------------------------------------------------------------ */
  function periodLabel(g) {
    return g.ot ? 'OT' + (g.ot > 1 ? g.ot : '') : 'Q' + g.quarter;
  }

  function spotText(g, spot, poss) {
    if (spot === 50) return 'the 50';
    if (spot < 50) return g.teams[poss].abbr + ' ' + spot;
    return g.teams[1 - poss].abbr + ' ' + (100 - spot);
  }

  function downText(down, togo, spot) {
    const d = ['', '1st', '2nd', '3rd', '4th'][down] || '4th';
    return d + ' & ' + (100 - spot <= togo ? 'Goal' : togo);
  }

  function situation(g) {
    return downText(g.down, g.togo, g.spot) + ' at ' + spotText(g, g.spot, g.poss);
  }

  function push(g, entry) {
    if (!g.record) return;
    entry.period = periodLabel(g);
    entry.clock = g.ot ? '' : U.clock(g.clock);
    entry.score = g.score.slice();
    g.log.push(entry);
  }

  function note(g, text, kind) {
    push(g, { text, kind: kind || 'info' });
  }

  function addScore(g, team, pts, text) {
    g.score[team] += pts;
    const qi = g.ot ? 4 : g.quarter - 1;
    g.qs[team][qi] += pts;
    if (g.record) {
      g.scoring.push({ period: periodLabel(g), clock: g.ot ? '' : U.clock(g.clock), team, text, score: g.score.slice() });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Player selection & stats                                            */
  /* ------------------------------------------------------------------ */
  function active(g, ti, group) {
    const t = g.teams[ti];
    return (t.players[group] || []).filter((p) => !t.out.has(p.id));
  }

  function pick(g, ti, group, weights) {
    const list = active(g, ti, group);
    if (!list.length) return { id: 'T' + ti + group, name: g.teams[ti].abbr + ' ' + group, num: 0, pos: group };
    const n = Math.min(list.length, weights ? weights.length : list.length);
    let total = 0;
    for (let i = 0; i < n; i++) total += weights ? weights[i] : 1;
    let r = g.rng.next() * total;
    for (let i = 0; i < n; i++) {
      r -= weights ? weights[i] : 1;
      if (r < 0) return list[i];
    }
    return list[0];
  }

  function ps(g, ti, p) {
    if (!g.record) return DUMMY;
    let s = g.pstats[p.id];
    if (!s) {
      s = g.pstats[p.id] = {
        id: p.id, name: p.name, num: p.num, pos: p.pos, team: ti,
        pAtt: 0, pCmp: 0, pYds: 0, pTD: 0, pInt: 0, rAtt: 0, rYds: 0, rTD: 0, rLong: 0, rec: 0, recYds: 0, recTD: 0,
        tgt: 0, tkl: 0, sck: 0, dInt: 0, fgm: 0, fga: 0, xpm: 0, xpa: 0, pnt: 0, pntYds: 0,
      };
    }
    return s;
  }
  const DUMMY = new Proxy({}, { get: () => 0, set: () => true });

  function tackler(g, groupWeights) {
    const d = 1 - g.poss;
    const group = g.rng.weighted(groupWeights);
    const p = pick(g, d, group);
    ps(g, d, p).tkl++;
    return p;
  }

  /* ------------------------------------------------------------------ */
  /* Clock                                                               */
  /* ------------------------------------------------------------------ */
  function mercy(g) {
    return !g.ot && g.quarter >= 3 && Math.abs(g.score[0] - g.score[1]) >= 30;
  }

  function huddleTime(g) {
    const o = g.poss;
    const diff = g.score[o] - g.score[1 - o];
    if (mercy(g)) return g.rng.int(32, 38);
    if ((g.quarter === 4 && diff <= 0 && g.clock < 240) || (g.quarter === 2 && g.clock < 100)) return g.rng.int(9, 15);
    if (g.quarter === 4 && diff > 0 && g.clock < 420) return g.rng.int(32, 38);
    return g.rng.int(22, 32);
  }

  // Time that runs before the snap. Returns false if the period expires first.
  function preSnap(g) {
    if (g.ot || !g.clockRunning) return true;
    const h = huddleTime(g);
    if (h >= g.clock) {
      g.stats[g.poss].top += g.clock;
      g.clock = 0;
      return false;
    }
    g.clock -= h;
    g.stats[g.poss].top += h;
    return true;
  }

  function consume(g, secs) {
    if (g.ot) return;
    const t = Math.min(secs, g.clock);
    g.clock -= t;
    g.stats[g.poss].top += t;
  }

  function callTimeout(g, team) {
    if (g.ot || g.timeouts[team] <= 0 || !g.clockRunning) return false;
    g.timeouts[team]--;
    g.clockRunning = false;
    note(g, 'Timeout, ' + g.teams[team].name + ' (' + g.timeouts[team] + ' left).', 'timeout');
    return true;
  }

  function aiTimeouts(g, userTeam) {
    if (g.ot || !g.clockRunning) return;
    const o = g.poss;
    const d = 1 - o;
    const diffO = g.score[o] - g.score[d];
    if (g.quarter === 4 && g.clock < 170) {
      if (diffO > 0 && diffO <= 16 && d !== userTeam) callTimeout(g, d);
      else if (diffO < 0 && diffO >= -16 && g.clock < 150 && o !== userTeam) callTimeout(g, o);
      else if (diffO === 0 && g.clock < 50 && g.spot >= 50 && o !== userTeam) callTimeout(g, o);
    } else if (g.quarter === 2 && g.clock < 70 && g.spot >= 45 && o !== userTeam) {
      callTimeout(g, o);
    }
  }

  function checkClock(g) {
    if (g.final || g.ot || g.clock > 0) return;
    if (g.quarter === 1 || g.quarter === 3) {
      note(g, 'End of the ' + U.ordinal(g.quarter) + ' quarter.', 'period');
      g.quarter++;
      g.clock = QLEN;
      g.clockRunning = false;
    } else if (g.quarter === 2) {
      note(g, 'Halftime: ' + g.teams[1].name + ' ' + g.score[1] + ', ' + g.teams[0].name + ' ' + g.score[0] + '.', 'period');
      g.quarter = 3;
      g.clock = QLEN;
      g.next = 'kickoff';
      g.kickTeam = g.secondHalfKick;
      g.timeouts = [3, 3];
      g.clockRunning = false;
    } else if (g.score[0] === g.score[1]) {
      note(g, 'End of regulation. We are headed to overtime!', 'period');
      startOT(g);
    } else {
      endGame(g);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Overtime                                                            */
  /* ------------------------------------------------------------------ */
  function startOT(g) {
    g.ot++;
    g.otPoss = 0;
    const first = g.ot % 2 === 1 ? g.otFirst : 1 - g.otFirst;
    g.otOrder = [first, 1 - first];
    g.timeouts = [1, 1];
    note(g, 'Overtime period ' + g.ot + ' begins. ' + g.teams[first].name + ' will go first from the 20.', 'period');
    beginOTPossession(g);
  }

  function beginOTPossession(g) {
    g.poss = g.otOrder[g.otPoss];
    g.spot = 80;
    g.down = 1;
    g.togo = 10;
    g.next = 'scrimmage';
    g.clockRunning = false;
  }

  function otPossessionDone(g) {
    g.otPoss++;
    if (g.otPoss < 2) beginOTPossession(g);
    else if (g.score[0] !== g.score[1]) endGame(g);
    else startOT(g);
  }

  // In the second OT possession the game ends as soon as that team leads.
  function otWalkoff(g, team) {
    return g.ot && g.otPoss === 1 && g.score[team] > g.score[1 - team];
  }

  function endGame(g) {
    g.final = true;
    g.next = 'final';
    g.clock = 0;
  }

  // Logged after the deciding play so the play-by-play reads in order.
  function logFinal(g) {
    if (!g.final || g.finalLogged) return;
    g.finalLogged = true;
    const w = g.score[0] > g.score[1] ? 0 : 1;
    note(g, 'FINAL' + (g.ot ? ' (' + (g.ot > 1 ? g.ot + 'OT' : 'OT') + ')' : '') + ': ' + g.teams[w].name + ' ' + g.score[w] + ', ' + g.teams[1 - w].name + ' ' + g.score[1 - w] + '.', 'final');
  }

  /* ------------------------------------------------------------------ */
  /* Possession changes & scoring                                        */
  /* ------------------------------------------------------------------ */
  function changePossession(g, newSpot) {
    g.poss = 1 - g.poss;
    g.spot = U.clamp(Math.round(newSpot), 1, 99);
    g.down = 1;
    g.togo = Math.min(10, 100 - g.spot);
    g.clockRunning = false;
    g.next = 'scrimmage';
  }

  function touchdown(g, team, how) {
    addScore(g, team, 6, how || 'Touchdown');
    g.clockRunning = false;
    if (otWalkoff(g, team)) {
      endGame(g);
      return;
    }
    g.next = 'pat';
    g.patTeam = team;
  }

  function safety(g) {
    const o = g.poss;
    addScore(g, 1 - o, 2, 'Safety');
    g.clockRunning = false;
    if (g.ot) {
      otPossessionDone(g);
      return;
    }
    g.next = 'freekick';
    g.kickTeam = o;
  }

  function conv(g, snapDown) {
    const st = g.stats[g.poss];
    if (snapDown === 3) st.thirdConv++;
    if (snapDown === 4) st.fourthConv++;
  }

  // Applies a gain for the offense. Returns 'td' | 'safety' | 'first' | 'ok' | 'downs'.
  function applyGain(g, y, snapDown) {
    const o = g.poss;
    if (g.spot + y >= 100) {
      conv(g, snapDown);
      touchdown(g, o);
      return 'td';
    }
    if (g.spot + y <= 0) {
      safety(g);
      return 'safety';
    }
    g.spot += y;
    if (y >= g.togo) {
      g.down = 1;
      g.togo = Math.min(10, 100 - g.spot);
      g.stats[o].firstDowns++;
      conv(g, snapDown);
      return 'first';
    }
    g.togo -= y;
    g.down++;
    if (g.down > 4) {
      if (g.ot) otPossessionDone(g);
      else changePossession(g, 100 - g.spot);
      return 'downs';
    }
    return 'ok';
  }

  // Defense takes over. spotForDef is in the defense's frame; ret is return yardage.
  function turnover(g, spotForDef, ret) {
    if (g.ot) {
      otPossessionDone(g);
      return 'ot';
    }
    const newSpot = spotForDef + ret;
    if (newSpot >= 100) {
      g.poss = 1 - g.poss;
      touchdown(g, g.poss, 'Return touchdown');
      return 'td';
    }
    changePossession(g, newSpot);
    return 'to';
  }

  function resultSuffix(g, res, team) {
    if (res === 'td') return ' TOUCHDOWN ' + g.teams[team].name + '!';
    if (res === 'first') return ' First down.';
    if (res === 'safety') return ' SAFETY!';
    if (res === 'downs') return ' Turnover on downs.';
    return '';
  }

  function yardsText(y) {
    if (y === 0) return 'no gain';
    if (y < 0) return 'a loss of ' + -y;
    return y + (y === 1 ? ' yard' : ' yards');
  }

  /* ------------------------------------------------------------------ */
  /* Kicking game                                                        */
  /* ------------------------------------------------------------------ */
  function fgProb(g, dist, k) {
    const slope = U.clamp(0.03 - (k - 45) * 0.00037, 0.011, 0.04);
    return U.clamp(0.985 - Math.max(0, dist - 19) * slope + WEATHER[g.weather].kick, 0.02, 0.99);
  }

  function kickRange(g, k) {
    let d = 19;
    while (d < 65 && fgProb(g, d + 1, k) >= 0.5) d++;
    return d;
  }

  function doKickoff(g, userKick, free) {
    const k = g.kickTeam;
    const r = 1 - k;
    const K = g.teams[k].r;
    const rng = g.rng;
    const kind = free ? 'normal' : userKick || aiKick(g, k);
    g.poss = r;
    const returner = pick(g, r, rng.chance(0.5) ? 'RB' : 'DB', [1, 1]);
    let text;
    if (kind === 'onside') {
      consume(g, rng.int(3, 5));
      const spot = rng.int(48, 53);
      if (rng.chance(0.16)) {
        g.poss = k;
        g.spot = 100 - spot;
        text = g.teams[k].name + ' onside kick... RECOVERED by the kicking team at ' + spotText(g, g.spot, k) + '!';
      } else {
        g.spot = spot;
        text = g.teams[k].name + ' onside kick is recovered by ' + g.teams[r].name + ' at ' + spotText(g, g.spot, r) + '.';
      }
      finishKick(g);
      push(g, { text, kind: 'kick' });
      return;
    }
    const from = free ? 20 : 40;
    const dist = Math.round(free ? rng.normal(40, 7) : rng.normal(44 + (K.k - 60) * 0.22, 6));
    let land = 100 - from - dist;
    if (land <= 0 && rng.chance(0.8)) {
      g.spot = 20;
      finishKick(g);
      push(g, { text: g.teams[k].name + (free ? ' free kick' : ' kicks off') + ' into the end zone. Touchback.', kind: 'kick' });
      return;
    }
    land = Math.max(land, -3);
    let ret = Math.max(0, Math.round(rng.normal(17, 7)));
    if (rng.chance(0.022)) ret += Math.round(15 + rng.expo(22));
    consume(g, rng.int(5, 8));
    const spot = land + ret;
    if (spot >= 100) {
      text = returner.name + ' takes the kick at the ' + Math.max(0, land) + ' and returns it ALL THE WAY! Kickoff return touchdown!';
      push(g, { text, kind: 'score' });
      touchdown(g, r, 'Kickoff return');
      return;
    }
    g.spot = U.clamp(spot, 1, 99);
    finishKick(g);
    push(g, { text: g.teams[k].name + (free ? ' free kick' : ' kicks off') + '. ' + returner.name + ' returns it ' + ret + ' yards to ' + spotText(g, g.spot, r) + '.', kind: 'kick' });
  }

  function finishKick(g) {
    g.down = 1;
    g.togo = Math.min(10, 100 - g.spot);
    g.next = 'scrimmage';
    g.clockRunning = false;
  }

  function doPAT(g, userChoice) {
    const t = g.patTeam;
    const O = g.teams[t].r;
    const D = g.teams[1 - t].r;
    const rng = g.rng;
    let choice = userChoice || aiPAT(g, t);
    if (g.ot >= 3) choice = 'two';
    g.poss = t;
    if (choice === 'two') {
      const p = U.clamp(0.42 + ((O.ol + O.rb + O.qb + O.wr) / 4 - (D.dl + D.lb + D.db) / 3) * 0.008, 0.2, 0.72);
      const passing = rng.chance(0.5);
      const good = rng.chance(p);
      const qb = pick(g, t, 'QB', [1]);
      const who = passing ? pick(g, t, rng.chance(0.5) ? 'WR' : 'TE', [1, 1, 1]) : pick(g, t, 'RB', [1]);
      if (good) addScore(g, t, 2, 'Two-point conversion');
      push(g, {
        text: 'Two-point try: ' + (passing ? qb.name + ' pass to ' + who.name : who.name + ' run') + (good ? ' is GOOD.' : ' fails.'),
        kind: good ? 'score' : 'play',
      });
    } else {
      const kicker = pick(g, t, 'K', [1]);
      const s = ps(g, t, kicker);
      s.xpa++;
      const good = rng.chance(U.clamp(0.8 + (O.k - 55) * 0.005 + WEATHER[g.weather].kick * 0.5, 0.55, 0.985));
      if (good) {
        s.xpm++;
        addScore(g, t, 1, 'Extra point');
      }
      push(g, { text: kicker.name + ' extra point is ' + (good ? 'good.' : 'NO GOOD.'), kind: good ? 'score' : 'play' });
    }
    if (g.ot) {
      if (otWalkoff(g, t)) endGame(g);
      else otPossessionDone(g);
    } else {
      g.next = 'kickoff';
      g.kickTeam = t;
    }
  }

  function doPunt(g) {
    const o = g.poss;
    const rng = g.rng;
    if (g.ot) {
      note(g, g.teams[o].name + ' declines to attempt anything. Possession over.');
      otPossessionDone(g);
      return;
    }
    const punter = pick(g, o, 'P', [1]);
    const st = g.stats[o];
    consume(g, rng.int(8, 11));
    if (rng.chance(0.008)) {
      push(g, { text: punter.name + ' punt is BLOCKED!', kind: 'turnover' });
      turnover(g, 100 - Math.max(1, g.spot - 7), 0);
      return;
    }
    const dist = Math.round(U.clamp(rng.normal(34 + (g.teams[o].r.p - 60) * 0.2, 6.5), 12, 65));
    st.punts++;
    const s = ps(g, o, punter);
    s.pnt++;
    const land = g.spot + dist;
    if (land >= 100) {
      st.puntYds += 100 - g.spot - 20;
      s.pntYds += 100 - g.spot - 20;
      push(g, { text: punter.name + ' punts into the end zone. Touchback.', kind: 'kick' });
      changePossession(g, 20);
      return;
    }
    st.puntYds += dist;
    s.pntYds += dist;
    const d = 1 - o;
    const returner = pick(g, d, 'DB', [1, 1]);
    const fair = rng.chance(0.35);
    let ret = fair ? 0 : Math.max(0, Math.round(rng.normal(6, 5)));
    if (!fair && rng.chance(0.012)) ret = 100;
    const newSpot = 100 - land + ret;
    if (newSpot >= 100) {
      push(g, { text: punter.name + ' punts ' + dist + ' yards. ' + returner.name + ' breaks free... PUNT RETURN TOUCHDOWN!', kind: 'score' });
      g.poss = d;
      touchdown(g, d, 'Punt return');
      return;
    }
    changePossession(g, newSpot);
    push(g, {
      text: punter.name + ' punts ' + dist + ' yards. ' + (fair ? returner.name + ' fair catch' : returner.name + ' returns it ' + ret + ' yards') + ' at ' + spotText(g, g.spot, g.poss) + '.',
      kind: 'kick',
    });
  }

  function doFieldGoal(g) {
    const o = g.poss;
    const rng = g.rng;
    const dist = 100 - g.spot + 17;
    const kicker = pick(g, o, 'K', [1]);
    const s = ps(g, o, kicker);
    consume(g, rng.int(5, 6));
    s.fga++;
    if (rng.chance(0.025)) {
      push(g, { text: kicker.name + ' ' + dist + '-yard field goal attempt is BLOCKED!', kind: 'turnover' });
      if (g.ot) otPossessionDone(g);
      else changePossession(g, 100 - g.spot);
      return;
    }
    if (rng.chance(fgProb(g, dist, g.teams[o].r.k))) {
      s.fgm++;
      addScore(g, o, 3, dist + '-yard field goal');
      push(g, { text: kicker.name + ' ' + dist + '-yard field goal is GOOD!', kind: 'score' });
      g.clockRunning = false;
      if (g.ot) {
        if (otWalkoff(g, o)) endGame(g);
        else otPossessionDone(g);
      } else {
        g.next = 'kickoff';
        g.kickTeam = o;
      }
    } else {
      push(g, { text: kicker.name + ' ' + dist + '-yard field goal is NO GOOD' + (rng.chance(0.5) ? ', wide right.' : ', wide left.'), kind: 'play' });
      if (g.ot) otPossessionDone(g);
      else changePossession(g, Math.max(20, 100 - g.spot));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Scrimmage plays                                                     */
  /* ------------------------------------------------------------------ */
  function doKneel(g) {
    const qb = pick(g, g.poss, 'QB', [1]);
    consume(g, g.rng.int(2, 3));
    const sit = situation(g);
    const res = applyGain(g, -1, g.down);
    g.clockRunning = res === 'ok' || res === 'first';
    push(g, { sit, text: qb.name + ' takes a knee.' + resultSuffix(g, res, g.poss), kind: 'play' });
  }

  function doPenalty(g, call) {
    const o = g.poss;
    const rng = g.rng;
    const passing = CALL[call].kind === 'pass';
    const type = rng.weighted({ false_start: 2, offside: 2, holding: 2.5, dpi: passing ? 1.4 : 0, personal: 0.8, delay: 0.7 });
    const P = {
      false_start: [5, 'off', 'False start'], delay: [5, 'off', 'Delay of game'], holding: [10, 'off', 'Holding'],
      offside: [5, 'def', 'Offside'], dpi: [15, 'def', 'Pass interference'], personal: [15, 'def', 'Personal foul'],
    }[type];
    let [y, side, label] = P;
    const sit = situation(g);
    const team = side === 'off' ? o : 1 - o;
    g.stats[team].penalties++;
    if (side === 'off') {
      y = Math.min(y, Math.floor((g.spot - 1) / 2) || 0);
      g.spot -= y;
      g.togo += y;
      if (type === 'holding') consume(g, rng.int(5, 7));
    } else {
      y = Math.min(y, Math.floor((100 - g.spot) / 2));
      g.spot += y;
      g.togo -= y;
      if (type !== 'offside') consume(g, rng.int(5, 7));
      if (g.togo <= 0 || type === 'personal') {
        g.down = 1;
        g.togo = Math.min(10, 100 - g.spot);
        g.stats[o].firstDowns++;
      }
    }
    g.stats[team].penYds += y;
    g.clockRunning = false;
    push(g, { sit, text: 'PENALTY: ' + label + ', ' + g.teams[team].name + ', ' + y + ' yards.' + (side === 'def' && g.down === 1 && type !== 'offside' ? ' Automatic first down.' : ''), kind: 'penalty' });
    return true;
  }

  function doRun(g, call, dcall, sit, snapDown) {
    const o = g.poss;
    const d = 1 - o;
    const O = g.teams[o].r;
    const D = g.teams[d].r;
    const rng = g.rng;
    const m = mod(dcall, call);
    const W = WEATHER[g.weather];
    let power;
    let stop;
    let base;
    let sd;
    let big;
    if (call === 'run_in') {
      power = 0.55 * O.ol + 0.45 * O.rb;
      stop = 0.5 * D.dl + 0.4 * D.lb + 0.1 * D.db;
      base = 4.0; sd = 2.9; big = 0.03;
    } else if (call === 'run_out') {
      power = 0.35 * O.ol + 0.55 * O.rb + 0.1 * O.wr;
      stop = 0.25 * D.dl + 0.4 * D.lb + 0.35 * D.db;
      base = 4.1; sd = 4.5; big = 0.048;
    } else {
      power = 0.35 * O.ol + 0.4 * O.qb + 0.25 * O.rb;
      stop = 0.3 * D.dl + 0.45 * D.lb + 0.25 * D.db;
      base = 4.2; sd = 4.3; big = 0.043;
    }
    const diff = power - stop;
    let y = rng.normal(base + diff * 0.085 + (m.yd || 0), sd);
    if (rng.chance(U.clamp(0.09 - diff * 0.002, 0.03, 0.18))) y = Math.min(y, rng.int(-3, 0));
    if (rng.chance(U.clamp(big + diff * 0.0018 + (m.big || 0), 0.005, 0.16))) y = Math.max(y, 2) + 8 + rng.expo(16);
    y = Math.round(U.clamp(y, -g.spot, 100 - g.spot));

    let carrier;
    let how;
    if (call === 'option') {
      carrier = rng.chance(0.5) ? pick(g, o, 'QB', [1]) : pick(g, o, 'RB', [0.8, 0.2]);
      how = carrier.pos === 'QB' ? 'keeps it on the option' : 'takes the option pitch';
    } else if (call === 'run_out' && rng.chance(0.08)) {
      carrier = pick(g, o, 'WR', [0.5, 0.3, 0.2]);
      how = 'on the jet sweep';
    } else {
      carrier = pick(g, o, 'RB', [0.7, 0.27, 0.03]);
      how = call === 'run_in' ? rng.pick(['up the middle', 'off right tackle', 'off left tackle', 'on the dive']) : rng.pick(['around the left end', 'around the right end', 'on the toss sweep', 'on the stretch']);
    }

    const st = g.stats[o];
    st.rushAtt++;
    const cs = ps(g, o, carrier);
    cs.rAtt++;

    // Fumble
    if (rng.chance(0.011 + (call === 'option' ? 0.007 : 0) + W.fum)) {
      st.fum++;
      const yy = Math.min(y, 99 - g.spot);
      if (rng.chance(0.52)) {
        st.fumLost++;
        st.rushYds += yy;
        cs.rYds += yy;
        const rec = tackler(g, { DL: 3, LB: 3, DB: 2 });
        consume(g, rng.int(5, 7));
        const ret = rng.chance(0.06) ? 100 : Math.max(0, Math.round(rng.normal(2, 4)));
        push(g, { sit, text: carrier.name + ' ' + how + ' for ' + yardsText(yy) + ' and FUMBLES! Recovered by ' + rec.name + '.', kind: 'turnover' });
        const r = turnover(g, 100 - (g.spot + yy), ret);
        if (r === 'td') push(g, { text: rec.name + ' scoops it up and takes it to the house! TOUCHDOWN ' + g.teams[d].name + '!', kind: 'score' });
        return;
      }
      push(g, { text: 'Fumble by ' + carrier.name + ', but ' + g.teams[o].name + ' recovers.', kind: 'info' });
    }

    st.rushYds += y;
    cs.rYds += y;
    cs.rLong = Math.max(cs.rLong, y);
    const oob = call !== 'run_in' && rng.chance(0.22);
    consume(g, rng.int(5, 7));
    let tk = null;
    if (g.spot + y < 100) tk = tackler(g, call === 'run_in' ? { DL: 4, LB: 5, DB: 1 } : { DL: 1.5, LB: 4.5, DB: 4 });
    const res = applyGain(g, y, snapDown);
    if (res === 'td') cs.rTD++;
    g.clockRunning = (res === 'ok' || res === 'first') && !oob;
    if (mercy(g) && res !== 'td') g.clockRunning = true;
    push(g, {
      sit,
      text: carrier.name + ' ' + how + ' for ' + yardsText(y) + (tk && res !== 'td' ? ' (' + tk.name + ')' : '') + (oob && res !== 'td' ? ', out of bounds' : '') + '.' + resultSuffix(g, res, o),
      kind: res === 'td' || res === 'safety' ? 'score' : res === 'downs' ? 'turnover' : 'play',
    });
    injuryCheck(g, o, carrier, tk);
  }

  function doPass(g, call, dcall, sit, snapDown) {
    const o = g.poss;
    const d = 1 - o;
    const O = g.teams[o].r;
    const D = g.teams[d].r;
    const rng = g.rng;
    const m = mod(dcall, call);
    const T = PASS[call];
    const W = WEATHER[g.weather];
    const st = g.stats[o];
    const qb = pick(g, o, 'QB', [1]);
    const qs = ps(g, o, qb);

    // Sack
    const sackP = U.clamp(T.sack + (D.dl - O.ol) * 0.0028 + (m.sack || 0), 0.01, 0.22);
    if (rng.chance(sackP)) {
      const loss = Math.min(rng.int(3, 10), g.spot);
      const sacker = pick(g, d, rng.weighted({ DL: 7, LB: 2.5, DB: 0.5 }));
      ps(g, d, sacker).sck++;
      ps(g, d, sacker).tkl++;
      st.sacked++;
      st.sackYds += loss;
      consume(g, rng.int(5, 7));
      if (rng.chance(0.07)) {
        st.fum++;
        if (rng.chance(0.6)) {
          st.fumLost++;
          push(g, { sit, text: qb.name + ' is sacked by ' + sacker.name + ' and the ball comes LOOSE! ' + g.teams[d].name + ' recovers.', kind: 'turnover' });
          turnover(g, 100 - (g.spot - loss), 0);
          return;
        }
      }
      const res = applyGain(g, -loss, snapDown);
      g.clockRunning = res === 'ok' || res === 'first';
      push(g, { sit, text: qb.name + ' sacked by ' + sacker.name + ' for ' + yardsText(-loss) + '.' + resultSuffix(g, res, o), kind: res === 'safety' ? 'score' : 'play' });
      injuryCheck(g, o, qb, sacker);
      return;
    }

    // Scramble
    if (rng.chance(0.03 + (O.qb > 70 ? 0.01 : 0))) {
      const y = Math.round(U.clamp(rng.normal(4, 5), -2, 100 - g.spot));
      st.rushAtt++;
      st.rushYds += y;
      qs.rAtt++;
      qs.rYds += y;
      consume(g, rng.int(5, 7));
      const tk = g.spot + y < 100 ? tackler(g, { DL: 2, LB: 4, DB: 4 }) : null;
      const res = applyGain(g, y, snapDown);
      if (res === 'td') qs.rTD++;
      g.clockRunning = res === 'ok' || res === 'first';
      push(g, { sit, text: qb.name + ' scrambles for ' + yardsText(y) + (tk && res !== 'td' ? ' (' + tk.name + ')' : '') + '.' + resultSuffix(g, res, o), kind: res === 'td' ? 'score' : 'play' });
      return;
    }

    const passPow = 0.5 * O.qb + 0.35 * O.wr + 0.15 * O.ol;
    const cover = 0.6 * D.db + 0.3 * D.lb + 0.1 * D.dl;
    const cmp = U.clamp(0.02 + T.cmp + (passPow - cover) * 0.0062 + (m.cmp || 0) + W.pass, 0.08, 0.93);
    const intP = U.clamp(T.int + (cover - passPow) * 0.0006 - (O.qb - 60) * 0.0004 + (m.int || 0), 0.004, 0.09);
    let target;
    if (call === 'screen') target = rng.chance(0.65) ? pick(g, o, 'RB', [0.8, 0.2]) : pick(g, o, 'WR', [1, 1]);
    else target = pick(g, o, rng.weighted({ WR: 6.5, TE: 1.6, RB: 1.1 }), [0.42, 0.33, 0.25]);
    const ts = ps(g, o, target);
    st.passAtt++;
    qs.pAtt++;
    ts.tgt++;
    const r = rng.next();

    if (r < intP) {
      const air = Math.round(rng.normal(T.air[0], T.air[1]));
      const defender = pick(g, d, rng.chance(0.78) ? 'DB' : 'LB');
      ps(g, d, defender).dInt++;
      qs.pInt++;
      st.int++;
      consume(g, rng.int(5, 8));
      let at = 100 - (g.spot + air);
      let ret = Math.max(0, Math.round(rng.normal(8, 9)));
      if (rng.chance(0.07)) ret = 100;
      if (at <= 0) {
        at = 20;
        ret = 0;
      }
      push(g, { sit, text: qb.name + ' pass ' + T.desc + ' is INTERCEPTED by ' + defender.name + '!' + (ret > 0 && ret < 100 ? ' Returned ' + ret + ' yards.' : ''), kind: 'turnover' });
      const res = turnover(g, at, ret);
      if (res === 'td') push(g, { text: defender.name + ' takes it back for a PICK-SIX!', kind: 'score' });
      return;
    }

    if (r < intP + cmp * (1 - intP)) {
      let air = rng.normal(T.air[0], T.air[1]);
      let yac = Math.max(0, rng.normal(T.yac[0], T.yac[1]));
      if (rng.chance(U.clamp(T.big + (O.wr - D.db) * 0.0015 + (m.big || 0), 0.005, 0.2))) yac += 10 + rng.expo(15);
      let y = Math.round(air + yac + (m.yd || 0));
      y = U.clamp(y, -Math.min(5, g.spot - 1), 100 - g.spot);
      st.passCmp++;
      st.passYds += y;
      qs.pCmp++;
      qs.pYds += y;
      ts.rec++;
      ts.recYds += y;
      // Fumble after the catch
      if (rng.chance(0.006 + W.fum * 0.5) && g.spot + y < 100) {
        st.fum++;
        st.fumLost++;
        const rec = tackler(g, { LB: 1, DB: 2 });
        consume(g, rng.int(5, 8));
        push(g, { sit, text: qb.name + ' pass complete to ' + target.name + ' for ' + yardsText(y) + ', but the ball comes LOOSE! Recovered by ' + rec.name + '.', kind: 'turnover' });
        turnover(g, 100 - (g.spot + y), 0);
        return;
      }
      const oob = rng.chance(0.18);
      consume(g, rng.int(5, 8));
      const tk = g.spot + y < 100 ? tackler(g, { DL: 0.5, LB: 3, DB: 5 }) : null;
      const res = applyGain(g, y, snapDown);
      if (res === 'td') {
        qs.pTD++;
        ts.recTD++;
      }
      g.clockRunning = (res === 'ok' || res === 'first') && !oob;
      if (mercy(g) && res !== 'td') g.clockRunning = true;
      push(g, {
        sit,
        text: qb.name + ' pass ' + T.desc + ' complete to ' + target.name + ' for ' + yardsText(y) + (tk && res !== 'td' ? ' (' + tk.name + ')' : '') + '.' + resultSuffix(g, res, o),
        kind: res === 'td' ? 'score' : res === 'downs' ? 'turnover' : 'play',
      });
      injuryCheck(g, o, target, tk);
      return;
    }

    // Incomplete
    consume(g, rng.int(5, 7));
    const res = applyGain(g, 0, snapDown);
    g.clockRunning = mercy(g);
    let why = '';
    if (rng.chance(0.3)) why = ', broken up by ' + pick(g, d, 'DB').name;
    else if (rng.chance(0.15)) why = ', dropped';
    push(g, { sit, text: qb.name + ' pass ' + T.desc + ' incomplete, intended for ' + target.name + why + '.' + resultSuffix(g, res, o), kind: res === 'downs' ? 'turnover' : 'play' });
  }

  function injuryCheck(g, o, offPlayer, defPlayer) {
    for (const [ti, p] of [[o, offPlayer], [1 - o, defPlayer]]) {
      const t = g.teams[ti];
      if (!t.injuries || !p || t.out.has(p.id) || p.id.startsWith('T')) continue;
      const chance = 0.0045 * (1 - (t.medical - 1) * 0.08);
      if (!g.rng.chance(chance)) continue;
      const weeks = g.rng.weighted([[1, 40], [2, 25], [3, 14], [4, 10], [6, 7], [10, 4]]);
      t.out.add(p.id);
      g.injuries.push({ team: ti, id: p.id, name: p.name, pos: p.pos, weeks });
      const unit = { QB: 'qb', RB: 'rb', WR: 'wr', TE: 'wr', OL: 'ol', DL: 'dl', LB: 'lb', CB: 'db', S: 'db' }[p.pos];
      if (unit) t.r[unit] -= p.pos === 'QB' ? 4 : 1.5;
      note(g, 'Injury: ' + p.name + ' (' + p.pos + ') is helped off the field and will not return.', 'injury');
    }
  }

  function doScrimmage(g, userOff, userDef, userTeam) {
    aiTimeouts(g, userTeam);
    if (!preSnap(g)) return;
    const o = g.poss;
    const offCall = userOff || aiOffCall(g);
    const defCall = userDef || aiDefCall(g);
    g.lastCalls = { off: offCall, def: defCall, team: o };
    if (offCall === 'punt') return doPunt(g);
    if (offCall === 'fg') return doFieldGoal(g);
    if (offCall === 'kneel') return doKneel(g);
    if (g.rng.chance(0.05)) {
      doPenalty(g, offCall);
      return;
    }
    const st = g.stats[o];
    const snapDown = g.down;
    if (snapDown === 3) st.thirdAtt++;
    if (snapDown === 4) st.fourthAtt++;
    st.plays++;
    const sit = situation(g);
    if (CALL[offCall].kind === 'run') doRun(g, offCall, defCall, sit, snapDown);
    else doPass(g, offCall, defCall, sit, snapDown);
  }

  /* ------------------------------------------------------------------ */
  /* AI coaching                                                         */
  /* ------------------------------------------------------------------ */
  function aiKick(g, k) {
    const diff = g.score[k] - g.score[1 - k];
    if (g.quarter === 4 && g.clock < 160 && diff < 0 && diff >= -16) return 'onside';
    return 'normal';
  }

  function aiPAT(g, t) {
    const diff = g.score[t] - g.score[1 - t];
    const k = g.teams[t].r.k;
    if (g.ot) {
      // Second team in OT, down one after the TD: kick to tie.
      return 'kick';
    }
    const late = g.quarter === 4 || (g.quarter === 3 && g.clock < 240);
    if (late && [-2, -5, -9, -10, -13, -16, 1, 5, 12].includes(diff)) return 'two';
    if (k < 42 && g.rng.chance(0.35)) return 'two';
    return 'kick';
  }

  function goForItCall(g) {
    const O = g.teams[g.poss].r;
    if (g.togo <= 2) return g.rng.weighted({ run_in: 6, option: O.qb > 60 ? 1.5 : 0.5, pass_quick: 2, play_action: 1 });
    if (g.togo <= 6) return g.rng.weighted({ pass_quick: 3, pass_med: 3, run_out: 1.5, screen: 1 });
    return g.rng.weighted({ pass_med: 4, pass_deep: 2.5, play_action: 1 });
  }

  function aiFourth(g) {
    const o = g.poss;
    const diff = g.score[o] - g.score[1 - o];
    const k = g.teams[o].r.k;
    const ytg = 100 - g.spot;
    const fgDist = ytg + 17;
    const range = kickRange(g, k);
    const t = g.clock;
    if (g.ot) {
      const second = g.otPoss === 1;
      if (second && diff < -3) return goForItCall(g);
      if (fgDist <= range + 4 && !(g.togo <= 1 && ytg <= 3)) return 'fg';
      return goForItCall(g);
    }
    if (g.quarter === 4) {
      if (diff < 0 && t < 200) {
        if (diff >= -3 && fgDist <= range + 3 && t < 40) return 'fg';
        return goForItCall(g);
      }
      if (diff < 0 && diff >= -8 && t < 420 && g.spot >= 40 && g.togo <= 4) return goForItCall(g);
    }
    if (g.quarter === 2 && t < 30 && fgDist <= range + 3) return 'fg';
    if (g.togo <= 1 && ytg <= 3) return goForItCall(g);
    if (fgDist <= range) return 'fg';
    if (g.togo <= 1 && g.spot >= 42) return goForItCall(g);
    if (g.togo <= 2 && g.spot >= 55) return goForItCall(g);
    if (g.togo <= 4 && g.spot >= 62) return goForItCall(g);
    if (g.spot >= 68 && g.togo <= 7) return goForItCall(g);
    return 'punt';
  }

  function aiOffCall(g) {
    const o = g.poss;
    const O = g.teams[o].r;
    const rng = g.rng;
    const diff = g.score[o] - g.score[1 - o];
    const t = g.clock;
    const ytg = 100 - g.spot;
    const late = !g.ot && g.quarter === 4;

    if (late && diff > 0 && g.down < 4) {
      const oppTO = g.timeouts[1 - o];
      if (t <= (4 - g.down + 1 - oppTO) * 36) return 'kneel';
    }
    if (!g.ot && (g.quarter === 2 || g.quarter === 4) && t <= 8) {
      const fgDist = ytg + 17;
      const need = g.quarter === 2 || (diff <= 0 && diff >= -3);
      if (need && fgDist <= kickRange(g, O.k) + 4) return 'fg';
    }
    if (g.down === 4) return aiFourth(g);

    let p = U.clamp(0.38 + (O.qb + O.wr - O.rb - O.ol) * 0.006, 0.2, 0.62);
    if (g.down === 3 && g.togo >= 7) p += 0.35;
    else if (g.down === 3 && g.togo <= 2) p -= 0.3;
    if (g.down === 2 && g.togo >= 8) p += 0.12;
    if (g.down === 1) p -= 0.03;
    if (late && diff < 0 && t < 240) p += 0.35;
    if (late && diff > 0 && t < 420) p -= 0.3;
    if (g.quarter === 2 && t < 120 && ytg < 75) p += 0.2;
    if (mercy(g) && diff > 0) p -= 0.35;
    if (ytg <= 3) p -= 0.25;
    p = U.clamp(p, 0.05, 0.92);
    if (rng.chance(p)) {
      const w = { screen: 1, pass_quick: 3, pass_med: 3, pass_deep: 1.4, play_action: 1.2 };
      if (g.togo >= 12) {
        w.pass_med += 2;
        w.pass_deep += 2;
      }
      if (g.togo <= 4) w.pass_quick += 3;
      if (ytg <= 12) {
        w.pass_deep = 0;
        w.play_action += 1;
      }
      if (late && diff < 0 && t < 120) {
        w.pass_deep += 1.5;
        w.screen = 0.3;
      }
      return rng.weighted(w);
    }
    const w = { run_in: 4, run_out: 3, option: O.qb >= O.rb - 4 ? 1.5 : 0.6 };
    if (g.togo <= 2) w.run_in += 4;
    return rng.weighted(w);
  }

  function aiDefCall(g) {
    const d = 1 - g.poss;
    const diffD = g.score[d] - g.score[g.poss];
    const ytg = 100 - g.spot;
    const w = { base: 5, run_stop: 2, nickel: 2, blitz: 1.5, prevent: 0 };
    if (g.togo <= 2) {
      w.run_stop += 5;
      w.nickel = 0.5;
    }
    if (g.togo >= 8) {
      w.nickel += 3;
      w.blitz += 1.5;
      w.run_stop = 0.5;
    }
    if (g.down === 1 && g.togo === 10) w.base += 2;
    if (!g.ot && g.quarter === 4 && g.clock < 120 && diffD >= 4 && diffD <= 16) w.prevent += 6;
    if (!g.ot && g.quarter === 4 && g.clock < 300 && diffD < 0) {
      w.blitz += 2;
      w.run_stop += 2;
    }
    if (ytg <= 5) {
      w.run_stop += 3;
      w.prevent = 0;
    }
    const O = g.teams[g.poss].r;
    if (O.rb + O.ol > O.qb + O.wr + 8) w.run_stop += 1;
    return g.rng.weighted(w);
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */
  function pending(g) {
    if (g.final) return { type: 'final' };
    if (g.next === 'kickoff') return { type: 'kickoff', team: g.kickTeam };
    if (g.next === 'freekick') return { type: 'freekick', team: g.kickTeam };
    if (g.next === 'pat') return { type: 'pat', team: g.patTeam };
    return { type: 'scrimmage', team: g.poss };
  }

  // choice: { kick, pat, off, def }. Missing choices are made by the AI.
  function step(g, choice, userTeam) {
    if (g.final) return [];
    choice = choice || {};
    const before = g.log.length;
    switch (g.next) {
      case 'kickoff':
        doKickoff(g, choice.kick, false);
        break;
      case 'freekick':
        doKickoff(g, null, true);
        break;
      case 'pat':
        doPAT(g, choice.pat);
        break;
      default:
        doScrimmage(g, choice.off, choice.def, userTeam);
    }
    if (g.next !== 'pat') checkClock(g);
    logFinal(g);
    return g.log.slice(before);
  }

  function simToEnd(g) {
    let guard = 0;
    while (!g.final && guard++ < 5000) step(g);
    if (!g.final) {
      // Should never happen; resolve deterministically rather than hang.
      if (g.score[0] === g.score[1]) g.score[g.rng.chance(0.5) ? 0 : 1] += 3;
      endGame(g);
      logFinal(g);
    }
    return g;
  }

  function suggest(g, side) {
    const saved = g.rng.state;
    const call = side === 'offense' ? aiOffCall(g) : aiDefCall(g);
    g.rng.state = saved;
    return call;
  }

  function fieldGoalInfo(g) {
    const dist = 100 - g.spot + 17;
    return { dist, prob: fgProb(g, dist, g.teams[g.poss].r.k) };
  }

  function totals(g, ti) {
    const s = g.stats[ti];
    return Object.assign({}, s, { totalYds: s.rushYds + s.passYds - s.sackYds, turnovers: s.int + s.fumLost });
  }

  FNG.Engine = {
    QLEN, OFF_CALLS, DEF_CALLS, CALL, WEATHER,
    create, step, pending, simToEnd, callTimeout, suggest, situation, spotText, fieldGoalInfo, totals, periodLabel,
  };
})();
