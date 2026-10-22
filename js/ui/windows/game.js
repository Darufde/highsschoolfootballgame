/* Live game window: scoreboard, field, play-by-play and play calling. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, Engine, Team } = FNG;
  const { h, icon, badge, seg, toast, schoolColors } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const DELAY = { slow: 1600, normal: 850, fast: 260 };

  Win.game = function (gameId) {
    const st = App.state;
    const game = st.games.find((g) => g.id === gameId);
    if (!game) return;
    if (game.played) {
      if (game.box) Win.box(gameId);
      return;
    }
    if (WM.isOpen('game')) {
      WM.focus('game');
      return;
    }
    const ui = game.home === st.userId ? 0 : 1;
    const schools = [Season.school(st, game.home), Season.school(st, game.away)];
    const G = {
      g: Season.engineGame(st, game, true),
      started: false,
      finished: false,
      paused: false,
      timer: null,
      tab: 'log',
      speed: st.settings.speed || 'normal',
      autoOff: !!st.settings.autoOffense,
      autoDef: st.settings.autoDefense !== false,
      logCount: 0,
      els: {},
    };
    const g = G.g;

    const needsUser = () => {
      if (!G.started || g.final) return false;
      const p = Engine.pending(g);
      if ((p.type === 'kickoff' || p.type === 'pat') && p.team === ui) return !G.autoOff;
      if (p.type === 'scrimmage') return p.team === ui ? !G.autoOff : !G.autoDef;
      return false;
    };
    const userTeamParam = () => (G.autoOff && G.autoDef ? -1 : ui);

    function schedule() {
      clearTimeout(G.timer);
      if (!G.started || g.final || G.paused || needsUser()) return;
      G.timer = setTimeout(() => doStep(null), DELAY[G.speed]);
    }

    function doStep(choice) {
      clearTimeout(G.timer);
      if (g.final) return;
      Engine.step(g, choice, userTeamParam());
      paint();
      schedule();
    }

    function simDrive() {
      clearTimeout(G.timer);
      const poss = g.poss;
      const score = g.score[0] + g.score[1];
      let guard = 0;
      while (!g.final && guard++ < 300) {
        Engine.step(g, null, -1);
        if (g.poss !== poss || g.score[0] + g.score[1] !== score || g.next === 'kickoff' || g.next === 'pat' || g.next === 'freekick') break;
      }
      paint();
      schedule();
    }

    function simAll() {
      clearTimeout(G.timer);
      G.started = true;
      Engine.simToEnd(g);
      paint();
    }

    function finish() {
      if (G.finished) return;
      G.finished = true;
      clearTimeout(G.timer);
      Season.finishGame(st, game, g);
      WM.close('game', true);
      App.advanceWeek();
      Win.box(game.id);
    }

    async function leave() {
      if (!(await WM.confirm('Leave Game', 'Leave the stadium? The rest of the game will be simulated.', 'Simulate & Leave'))) return;
      Engine.simToEnd(g);
      finish();
    }

    /* -------------------------------------------------------------- */
    /* Painting                                                        */
    /* -------------------------------------------------------------- */
    function abs(spot) {
      return g.poss === 0 ? spot : 100 - spot;
    }

    function paintScoreboard() {
      const E = G.els;
      for (const i of [0, 1]) {
        E.pts[i].textContent = g.score[i];
        E.tos[i].replaceChildren(...[0, 1, 2].map((k) => h('i', { class: k < g.timeouts[i] ? '' : 'used' })));
        E.poss[i].hidden = !(G.started && !g.final && g.poss === i && (g.next === 'scrimmage' || g.next === 'pat'));
      }
      if (g.final) {
        E.per.textContent = 'FINAL' + (g.ot ? (g.ot > 1 ? ' / ' + g.ot + 'OT' : ' / OT') : '');
        E.clock.textContent = '0:00';
        E.dd.textContent = '';
      } else if (!G.started) {
        E.per.textContent = 'PREGAME';
        E.clock.textContent = U.clock(Engine.QLEN);
        E.dd.textContent = 'Kickoff ' + App.dateLabel(st, game.week).replace(/, \d{4}$/, '');
      } else {
        E.per.textContent = g.ot ? 'OVERTIME ' + g.ot : U.ordinal(g.quarter).toUpperCase() + ' QTR';
        E.clock.textContent = g.ot ? '—' : U.clock(g.clock);
        E.dd.textContent = g.next === 'scrimmage' ? Engine.situation(g) : g.next === 'pat' ? 'Try for point' : g.next === 'kickoff' || g.next === 'freekick' ? 'Kickoff' : '';
      }
    }

    function paintField() {
      const E = G.els;
      const scrim = G.started && !g.final && g.next === 'scrimmage';
      const los = abs(g.spot);
      E.los.style.left = los + '%';
      E.ball.style.left = (g.next === 'kickoff' || g.next === 'freekick' ? (g.kickTeam === 0 ? 40 : 60) : los) + '%';
      E.los.hidden = !scrim;
      const fdSpot = Math.min(100, g.spot + g.togo);
      E.fd.hidden = !scrim || fdSpot >= 100;
      E.fd.style.left = abs(fdSpot) + '%';
      E.capL.textContent = !G.started ? 'Weather: ' + g.weather : g.final ? 'Final' : g.next === 'scrimmage' ? g.teams[g.poss].name + ' ball · ' + Engine.situation(g) : g.next === 'pat' ? g.teams[g.patTeam].name + ' lines up for the try' : g.teams[g.kickTeam].name + ' to kick off';
      E.capR.textContent = G.started ? 'Weather: ' + g.weather : '';
    }

    function paintLog() {
      const E = G.els;
      const fresh = g.log.slice(G.logCount);
      G.logCount = g.log.length;
      for (const e of fresh) {
        const li = h('li', { class: (e.kind || 'play') + ' fresh' },
          h('span', { class: 't' }, e.period + (e.clock ? ' ' + e.clock : '')),
          h('span', null, e.sit ? h('span', { class: 'sit' }, e.sit) : null, h('span', { class: 'x' }, e.text)));
        E.log.insertBefore(li, E.log.firstChild);
      }
    }

    function boxObj() {
      return {
        names: [g.teams[0].name, g.teams[1].name],
        abbr: [g.teams[0].abbr, g.teams[1].abbr],
        score: g.score,
        qs: g.qs,
        ot: g.ot,
        weather: g.weather,
        totals: [Engine.totals(g, 0), Engine.totals(g, 1)],
        players: Object.values(g.pstats),
        scoring: g.scoring,
      };
    }

    function paintTabs() {
      const E = G.els;
      E.tabs.replaceChildren(...[['log', 'Play-by-Play'], ['box', 'Box Score'], ['scoring', 'Scoring']].map(([v, l]) => h('button', { type: 'button', class: G.tab === v ? 'on' : '', onclick: () => { G.tab = v; paintTabs(); paintPanel(); } }, l)));
    }

    function paintPanel() {
      const E = G.els;
      E.log.hidden = G.tab !== 'log';
      E.alt.hidden = G.tab === 'log';
      if (G.tab === 'log') return;
      E.alt.replaceChildren();
      const box = boxObj();
      if (G.tab === 'box') {
        E.alt.append(FNG.BoxView.line(box), h('div', { class: 'card mt' }, FNG.BoxView.teamStats(box)), h('div', { class: 'grid c2 mt' }, FNG.BoxView.playerTables(box, 1), FNG.BoxView.playerTables(box, 0)));
      } else {
        E.alt.appendChild(box.scoring.length ? h('div', { class: 'col', style: { gap: '6px' } }, box.scoring.map((s) => h('div', { class: 'small row nowrap' },
          h('span', { class: 'dim num', style: { width: '74px' } }, s.period + ' ' + s.clock),
          h('span', { class: 'bold', style: { width: '44px' } }, box.abbr[s.team]), h('span', { class: 'grow' }, s.text), h('span', { class: 'num muted' }, s.score[1] + '-' + s.score[0])))) : h('div', { class: 'empty' }, 'No scoring yet.'));
      }
    }

    function compare() {
      const us = g.teams[ui].r;
      const them = Season.scout(st, schools[1 - ui]);
      return [['qb', 'QB'], ['rb', 'Run'], ['wr', 'Rec'], ['ol', 'OL'], ['dl', 'DL'], ['lb', 'LB'], ['db', 'DB'], ['k', 'K']].map(([k, l]) => {
        const a = Math.round(us[k]);
        const b = Math.round(them[k]);
        return h('div', { class: 'compare' }, h('span', { class: 'l num bold' }, a), h('div', { class: 'bar left' }, h('i', { style: { width: a + '%', background: a >= b ? 'var(--good)' : '#64748b' } })), h('span', { class: 'mid' }, l), h('div', { class: 'bar' }, h('i', { style: { width: b + '%', background: b >= a ? 'var(--good)' : '#64748b' } })), h('span', { class: 'num bold' }, b));
      });
    }

    function toggles() {
      return h('div', { class: 'col', style: { gap: '6px' } },
        h('div', { class: 'row between small' }, h('span', { class: 'muted' }, 'Offense'), seg([{ value: false, label: 'I call it' }, { value: true, label: 'Coordinator' }], G.autoOff, (v) => { G.autoOff = v; st.settings.autoOffense = v; paintSide(); schedule(); })),
        h('div', { class: 'row between small' }, h('span', { class: 'muted' }, 'Defense'), seg([{ value: false, label: 'I call it' }, { value: true, label: 'Coordinator' }], G.autoDef, (v) => { G.autoDef = v; st.settings.autoDefense = v; paintSide(); schedule(); })),
        h('div', { class: 'row between small' }, h('span', { class: 'muted' }, 'Speed'), seg([{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }], G.speed, (v) => { G.speed = v; st.settings.speed = v; paintSide(); schedule(); })));
    }

    function callButtons(calls, side) {
      const sug = Engine.suggest(g, side);
      const grid = h('div', { class: 'calls' });
      for (const c of calls) {
        let disabled = false;
        let sub = c.hint;
        if (c.id === 'fg') {
          const fg = Engine.fieldGoalInfo(g);
          disabled = fg.dist > 62;
          sub = fg.dist + ' yds · ' + Math.round(fg.prob * 100) + '%';
        }
        if (c.id === 'punt' && g.ot) disabled = true;
        grid.appendChild(h('button', { type: 'button', class: 'btn' + (c.id === sug ? ' suggested' : ''), disabled, title: c.hint, onclick: () => doStep(side === 'offense' ? { off: c.id } : { def: c.id }) }, c.label, h('small', { class: c.id === 'fg' ? '' : 'hint' }, sub)));
      }
      return h('div', null, grid, h('div', { class: 'help' }, 'Highlighted: your coordinator’s suggestion.'));
    }

    function paintSide() {
      const E = G.els;
      E.side.replaceChildren();
      const u = schools[ui];
      const opp = schools[1 - ui];
      if (!G.started) {
        E.side.append(
          h('div', { class: 'side-title' }, 'Pregame'),
          h('div', { class: 'small muted mb' }, (game.playoff ? Season.ROUND_NAMES[game.playoff.round] + ' · ' : game.league ? 'League game · ' : 'Non-league · ') + (game.neutral ? 'Neutral site' : ui === 0 ? 'Home' : 'Away') + ' · ' + g.weather),
          h('div', { class: 'row between small muted' }, h('span', null, u.abbr + ' ' + u.rec.w + '-' + u.rec.l), h('span', null, opp.rec.w + '-' + opp.rec.l + ' ' + opp.abbr)),
          ...compare(),
          h('div', { class: 'mt' }, toggles()),
          h('div', { class: 'col mt' },
            h('button', { type: 'button', class: 'btn primary lg block', onclick: () => { G.started = true; paint(); schedule(); } }, icon('play', 16), 'Kick Off'),
            h('button', { type: 'button', class: 'btn block', onclick: simAll }, 'Simulate Entire Game')));
        return;
      }
      if (g.final) {
        const won = g.score[ui] > g.score[1 - ui];
        E.side.append(
          h('div', { class: 'side-title' }, 'Final'),
          h('div', { class: 'card ' + (won ? 'accent' : ''), style: { textAlign: 'center' } },
            h('div', { style: { fontSize: '26px', fontWeight: 900 } }, won ? 'VICTORY' : 'DEFEAT'),
            h('div', { class: 'num', style: { fontSize: '20px', marginTop: '4px' } }, g.score[ui] + ' - ' + g.score[1 - ui]),
            h('div', { class: 'small muted' }, (won ? 'over ' : 'to ') + opp.name + (g.ot ? ' in overtime' : ''))),
          g.injuries.filter((x) => x.team === ui).length ? h('div', { class: 'card tight mt' }, h('div', { class: 'tiny muted bold' }, 'INJURIES'), g.injuries.filter((x) => x.team === ui).map((x) => h('div', { class: 'small warn-t' }, x.name + ' (' + x.pos + ') — ' + x.weeks + ' wk'))) : null,
          h('button', { type: 'button', class: 'btn primary lg block mt', onclick: finish }, 'Finish & Continue'),
          h('div', { class: 'help center' }, 'Results from around Ohio will be posted.'));
        return;
      }
      const p = Engine.pending(g);
      const box = h('div');
      if (needsUser()) {
        if (p.type === 'kickoff') {
          box.append(h('div', { class: 'side-title' }, 'Kickoff'), h('div', { class: 'calls' },
            h('button', { type: 'button', class: 'btn primary', onclick: () => doStep({ kick: 'normal' }) }, 'Kick Deep', h('small', null, 'Standard kickoff')),
            h('button', { type: 'button', class: 'btn', onclick: () => doStep({ kick: 'onside' }) }, 'Onside Kick', h('small', null, '~16% recovery'))));
        } else if (p.type === 'pat') {
          const k = g.teams[ui].r.k;
          const pct = Math.round(U.clamp(0.8 + (k - 55) * 0.005, 0.55, 0.985) * 100);
          box.append(h('div', { class: 'side-title' }, 'Try for Point'), h('div', { class: 'calls' },
            h('button', { type: 'button', class: 'btn primary', disabled: g.ot >= 3, onclick: () => doStep({ pat: 'kick' }) }, 'Kick PAT', h('small', null, '~' + pct + '% · 1 point')),
            h('button', { type: 'button', class: 'btn', onclick: () => doStep({ pat: 'two' }) }, 'Go for Two', h('small', null, '~45% · 2 points'))));
        } else if (p.team === ui) {
          box.append(h('div', { class: 'side-title' }, h('span', null, 'Your Offense'), h('span', { class: 'tag team' }, Engine.situation(g))), callButtons(Engine.OFF_CALLS, 'offense'));
        } else {
          box.append(h('div', { class: 'side-title' }, h('span', null, 'Your Defense'), h('span', { class: 'tag' }, Engine.situation(g))), callButtons(Engine.DEF_CALLS, 'defense'));
        }
        if (g.clockRunning && g.timeouts[ui] > 0 && !g.ot) {
          box.appendChild(h('button', { type: 'button', class: 'btn sm block mt', onclick: () => { Engine.callTimeout(g, ui); paint(); } }, 'Call Timeout (' + g.timeouts[ui] + ' left)'));
        }
      } else {
        box.append(h('div', { class: 'side-title' }, 'On the Field'),
          h('div', { class: 'card tight small' }, G.paused ? 'Paused.' : p.type === 'scrimmage' ? (p.team === ui ? 'Offensive coordinator is calling plays…' : opp.name + ' has the ball…') : 'Special teams…'),
          h('button', { type: 'button', class: 'btn sm block mt', onclick: () => { G.paused = !G.paused; paintSide(); schedule(); } }, G.paused ? 'Resume' : 'Pause'));
      }
      if (g.lastCalls && g.log.length) {
        const lc = g.lastCalls;
        const off = Engine.CALL[lc.off];
        const def = Engine.DEF_CALLS.find((d) => d.id === lc.def);
        if (off && def && off.kind !== 'special') box.appendChild(h('div', { class: 'help' }, 'Last snap: ' + g.teams[lc.team].abbr + ' ' + off.label + ' vs ' + def.label));
      }
      E.side.append(box,
        h('div', { class: 'side-title mt', style: { marginTop: '16px' } }, 'Game Control'),
        toggles(),
        h('div', { class: 'row mt', style: { gap: '6px' } },
          h('button', { type: 'button', class: 'btn sm grow', onclick: simDrive }, 'Sim Drive'),
          h('button', { type: 'button', class: 'btn sm grow', onclick: simAll }, 'Sim to End')),
        h('div', { class: 'side-title mt', style: { marginTop: '16px' } }, 'Team Stats'),
        FNG.BoxView.teamStats(boxObj()));
    }

    function paint() {
      paintScoreboard();
      paintField();
      paintLog();
      paintSide();
      if (G.tab !== 'log') paintPanel();
      WM.setTitle('game', (g.final ? 'Final: ' : '') + g.teams[1].abbr + ' ' + g.score[1] + ' @ ' + g.teams[0].abbr + ' ' + g.score[0]);
    }

    function teamBlock(i) {
      const s = schools[i];
      const E = G.els;
      E.pts[i] = h('div', { class: 'pts' }, '0');
      E.tos[i] = h('div', { class: 'tos' });
      E.poss[i] = h('span', { class: 'poss', hidden: true });
      return h('div', { class: 'sb-team ' + (i === 0 ? 'home' : 'away') },
        badge(s, st), h('div', { style: { minWidth: 0, flex: 1 } }, h('div', { class: 'nm' }, s.name), h('div', { class: 'rec' }, s.rec.w + '-' + s.rec.l + (s.rec.seed ? ' · #' + s.rec.seed : '') + (i === ui ? ' · YOU' : '')), E.tos[i]),
        E.pts[i], E.poss[i]);
    }

    WM.open('game', {
      title: 'Game Day',
      icon: 'football',
      width: 1120,
      height: 780,
      flush: true,
      manual: true,
      onClose: () => {
        if (!G.started || G.finished) {
          clearTimeout(G.timer);
          return true;
        }
        if (g.final) {
          finish();
          return false;
        }
        leave();
        return false;
      },
      render(body) {
        const E = G.els;
        E.pts = [];
        E.tos = [];
        E.poss = [];
        const [hc, hc2] = schoolColors(schools[0], st);
        const [ac, ac2] = schoolColors(schools[1], st);
        E.per = h('div', { class: 'per' });
        E.clock = h('div', { class: 'clock' });
        E.dd = h('div', { class: 'dd' });
        E.los = h('div', { class: 'los' });
        E.fd = h('div', { class: 'fd' });
        E.ball = h('div', { class: 'ball' });
        const nums = h('div', { class: 'nums' });
        for (const n of [10, 20, 30, 40, 50, 40, 30, 20, 10]) nums.appendChild(h('span', null, n));
        E.capL = h('span');
        E.capR = h('span');
        E.log = h('ul', { class: 'plog' });
        E.alt = h('div', { hidden: true });
        E.tabs = h('div', { class: 'tabs', style: { margin: '0 0 6px' } });
        E.side = h('div', { class: 'game-side' });
        body.appendChild(h('div', { class: 'game' },
          h('div', { class: 'scoreboard' }, teamBlock(1), h('div', { class: 'sb-mid' }, E.per, E.clock, E.dd), teamBlock(0)),
          h('div', { class: 'fieldwrap' },
            h('div', { class: 'fieldbar' },
              h('div', { class: 'ez', style: { background: hc, color: hc2 } }, schools[0].abbr),
              h('div', { class: 'turf' }, nums, E.los, E.fd, E.ball),
              h('div', { class: 'ez r', style: { background: ac, color: ac2 } }, schools[1].abbr)),
            h('div', { class: 'field-caption' }, E.capL, E.capR)),
          h('div', { class: 'game-main' }, h('div', { class: 'game-log' }, E.tabs, E.log, E.alt), E.side)));
        paintTabs();
        paint();
      },
    });
  };
})();
