/* Schedule and box score windows. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, Schedule } = FNG;
  const { h, badge, table, select } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  function resultTag(us, them, ot) {
    const won = us > them;
    return h('span', { class: 'tag ' + (won ? 'good' : 'bad') }, (won ? 'W ' : 'L ') + us + '-' + them + (ot ? (ot > 1 ? ' ' + ot + 'OT' : ' OT') : ''));
  }

  Win.schedule = function () {
    WM.open('schedule', {
      title: 'Schedule',
      icon: 'schedule',
      width: 860,
      height: 600,
      state: { season: 'current' },
      render(body, w) {
        const st = App.state;
        const u = Season.user(st);
        const seasons = [{ value: 'current', label: st.year + (st.phase === 'offseason' ? ' (complete)' : ' (current)') }].concat(st.history.filter((x) => x.year !== st.year).map((x) => ({ value: String(x.year), label: String(x.year) })));
        body.appendChild(h('div', { class: 'toolbar' },
          select(seasons, w.state.season, (v) => { w.state.season = v; WM.refresh(w.id); }),
          h('div', { class: 'grow' }),
          w.state.season === 'current' ? h('span', { class: 'small muted' }, 'Overall ' + u.rec.w + '-' + u.rec.l + ' · League ' + u.rec.lw + '-' + u.rec.ll + ' · PF ' + u.rec.pf + ' · PA ' + u.rec.pa) : null));

        if (w.state.season !== 'current') {
          const hist = st.history.find((x) => String(x.year) === w.state.season);
          body.appendChild(table([
            { key: 'week', label: 'Wk', render: (g) => (g.round ? 'P' + g.round : g.week) },
            { key: 'opp', label: 'Opponent', render: (g) => (g.neutral ? 'vs ' : g.home ? 'vs ' : 'at ') + g.opp },
            { key: 'res', label: 'Result', render: (g) => resultTag(g.us, g.them, g.ot) },
            { key: 'type', label: '', render: (g) => (g.round ? Season.ROUND_NAMES[g.round] : '') },
          ], hist ? hist.games : [], { empty: 'No games recorded.' }));
          if (hist) body.appendChild(h('p', { class: 'muted small' }, hist.w + '-' + hist.l + ' · ' + hist.result));
          return;
        }

        const games = Season.userSchedule(st);
        const weeks = [];
        const lastWeek = Math.max(10, ...games.map((g) => g.week));
        for (let wk = 1; wk <= lastWeek; wk++) {
          const g = games.find((x) => x.week === wk);
          if (g || wk <= 10) weeks.push({ week: wk, g });
        }
        body.appendChild(table([
          { key: 'week', label: 'Wk', render: (r) => (r.week > 10 ? h('span', { class: 'tag gold' }, 'P' + (r.week - 10)) : h('span', { class: 'bold' }, r.week)) },
          { key: 'date', label: 'Date', render: (r) => Schedule.weekDateStr(st.year, r.week), cls: 'muted' },
          {
            key: 'opp', label: 'Opponent', render: (r) => {
              if (!r.g) return h('span', { class: 'muted' }, 'Bye');
              const opp = Season.opponentOf(st, r.g, st.userId);
              const home = r.g.home === st.userId;
              return h('div', { class: 'row nowrap', style: { gap: '8px' } },
                h('span', { class: 'muted', style: { width: '18px' } }, r.g.neutral ? 'vs' : home ? 'vs' : '@'),
                badge(opp, st, 'sm'),
                h('button', { type: 'button', class: 'linklike', onclick: () => Win.school(opp.id) }, opp.name),
                opp.rec.seed && st.phase !== 'regular' ? h('span', { class: 'tiny muted' }, '#' + opp.rec.seed) : null);
            },
          },
          { key: 'orec', label: 'Opp Rec', render: (r) => (r.g ? (() => { const o = Season.opponentOf(st, r.g, st.userId); return o.rec.w + '-' + o.rec.l; })() : ''), cls: 'num' },
          { key: 'div', label: 'Div', render: (r) => (r.g ? U.roman(Season.opponentOf(st, r.g, st.userId).division) : '') },
          { key: 'type', label: 'Type', render: (r) => (!r.g ? '' : r.g.playoff ? h('span', { class: 'tag gold' }, Season.ROUND_NAMES[r.g.playoff.round]) : r.g.league ? h('span', { class: 'tag team' }, 'League') : h('span', { class: 'tag' }, 'Non-league')) },
          {
            key: 'res', label: 'Result', render: (r) => {
              if (!r.g) return '';
              if (!r.g.played) return r.week === st.week ? h('span', { class: 'tag info' }, 'This week') : h('span', { class: 'dim' }, '—');
              const home = r.g.home === st.userId;
              return resultTag(home ? r.g.hs : r.g.as, home ? r.g.as : r.g.hs, r.g.ot);
            },
          },
          { key: 'box', label: '', render: (r) => (r.g && r.g.box ? h('button', { type: 'button', class: 'btn sm ghost', onclick: () => Win.box(r.g.id) }, 'Box Score') : null) },
        ], weeks, { rowClass: (r) => (r.week === st.week && st.phase !== 'offseason' ? 'me' : '') }));
      },
    });
  };

  function line(box) {
    const ot = box.ot > 0;
    const head = ['', '1', '2', '3', '4'].concat(ot ? ['OT'] : []).concat(['T']);
    const rows = [1, 0].map((i) => [box.names[i]].concat(box.qs[i].slice(0, 4), ot ? [box.qs[i][4]] : [], [box.score[i]]));
    return h('div', { class: 'tbl-wrap' }, h('table', { class: 'data' },
      h('thead', null, h('tr', null, head.map((x, i) => h('th', { class: i ? 'c' : '' }, x)))),
      h('tbody', null, rows.map((r) => h('tr', null, r.map((x, i) => h('td', { class: i ? 'c num' + (i === r.length - 1 ? ' bold' : '') : 'bold' }, x)))))));
  }

  function teamStats(box) {
    const T = box.totals;
    const rows = [
      ['First downs', (t) => t.firstDowns], ['Total yards', (t) => t.totalYds], ['Rushing', (t) => t.rushAtt + '-' + t.rushYds], ['Passing', (t) => t.passCmp + '/' + t.passAtt + ', ' + t.passYds],
      ['Sacked', (t) => t.sacked + '-' + t.sackYds], ['Turnovers', (t) => t.turnovers], ['3rd down', (t) => t.thirdConv + '/' + t.thirdAtt], ['4th down', (t) => t.fourthConv + '/' + t.fourthAtt],
      ['Penalties', (t) => t.penalties + '-' + t.penYds], ['Punts', (t) => t.punts + (t.punts ? ' (' + (t.puntYds / t.punts).toFixed(1) + ')' : '')], ['Possession', (t) => U.clock(t.top)],
    ];
    const g = h('div', { class: 'boxgrid' }, h('div', { class: 'h' }, ''), h('div', { class: 'h n' }, box.abbr[1]), h('div', { class: 'h n' }, box.abbr[0]));
    for (const [label, f] of rows) g.append(h('div', null, label), h('div', { class: 'n' }, f(T[1])), h('div', { class: 'n' }, f(T[0])));
    return g;
  }

  function playerTables(box, ti) {
    const P = box.players.filter((p) => p.team === ti);
    const out = h('div', { class: 'col' });
    const sect = (title, rows, cols) => {
      if (!rows.length) return;
      out.appendChild(h('div', null, h('div', { class: 'tiny muted bold', style: { margin: '4px 0' } }, title), table(cols, rows)));
    };
    const nm = { key: 'name', label: 'Player', render: (p) => '#' + p.num + ' ' + p.name };
    sect('Passing', P.filter((p) => p.pAtt), [nm, { key: 'c', label: 'C/A', render: (p) => p.pCmp + '/' + p.pAtt, cls: 'num r' }, { key: 'y', label: 'Yds', render: (p) => p.pYds, cls: 'num r' }, { key: 't', label: 'TD', render: (p) => p.pTD, cls: 'num r' }, { key: 'i', label: 'Int', render: (p) => p.pInt, cls: 'num r' }]);
    sect('Rushing', P.filter((p) => p.rAtt).sort((a, b) => b.rYds - a.rYds), [nm, { key: 'a', label: 'Car', render: (p) => p.rAtt, cls: 'num r' }, { key: 'y', label: 'Yds', render: (p) => p.rYds, cls: 'num r' }, { key: 'avg', label: 'Avg', render: (p) => (p.rYds / p.rAtt).toFixed(1), cls: 'num r' }, { key: 't', label: 'TD', render: (p) => p.rTD, cls: 'num r' }, { key: 'l', label: 'Long', render: (p) => p.rLong, cls: 'num r' }]);
    sect('Receiving', P.filter((p) => p.rec).sort((a, b) => b.recYds - a.recYds), [nm, { key: 'r', label: 'Rec', render: (p) => p.rec, cls: 'num r' }, { key: 'y', label: 'Yds', render: (p) => p.recYds, cls: 'num r' }, { key: 't', label: 'TD', render: (p) => p.recTD, cls: 'num r' }, { key: 'tg', label: 'Tgt', render: (p) => p.tgt, cls: 'num r' }]);
    sect('Defense', P.filter((p) => p.tkl || p.sck || p.dInt).sort((a, b) => b.tkl - a.tkl).slice(0, 10), [nm, { key: 't', label: 'Tkl', render: (p) => p.tkl, cls: 'num r' }, { key: 's', label: 'Sck', render: (p) => p.sck, cls: 'num r' }, { key: 'i', label: 'Int', render: (p) => p.dInt, cls: 'num r' }]);
    sect('Kicking', P.filter((p) => p.fga || p.xpa || p.pnt), [nm, { key: 'f', label: 'FG', render: (p) => p.fgm + '/' + p.fga, cls: 'num r' }, { key: 'x', label: 'XP', render: (p) => p.xpm + '/' + p.xpa, cls: 'num r' }, { key: 'p', label: 'Punts', render: (p) => (p.pnt ? p.pnt + ' (' + (p.pntYds / p.pnt).toFixed(1) + ')' : '—'), cls: 'num r' }]);
    return out;
  }

  function renderBox(body, box, w) {
    body.appendChild(h('div', { class: 'row between mb' },
      h('div', null, h('h2', { class: 'title' }, box.names[1] + ' ' + box.score[1] + ', ' + box.names[0] + ' ' + box.score[0]), h('div', { class: 'small muted' }, (box.ot ? 'Final/' + (box.ot > 1 ? box.ot + 'OT' : 'OT') : 'Final') + ' · Weather: ' + box.weather))));
    body.appendChild(h('div', { class: 'grid c2' }, h('div', { class: 'col' }, line(box), h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Team Stats'), teamStats(box))),
      h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Scoring Summary'),
        box.scoring.length ? h('div', { class: 'col', style: { gap: '6px' } }, box.scoring.map((s) => h('div', { class: 'small row nowrap', style: { gap: '8px' } },
          h('span', { class: 'dim num', style: { width: '74px', flex: 'none' } }, s.period + ' ' + s.clock),
          h('span', { class: 'bold', style: { width: '44px', flex: 'none' } }, box.abbr[s.team]),
          h('span', { class: 'grow' }, s.text),
          h('span', { class: 'num muted' }, s.score[1] + '-' + s.score[0])))) : h('div', { class: 'muted small' }, 'No scoring.'))));
    const tabIdx = w.state.team == null ? 0 : w.state.team;
    body.appendChild(h('div', { class: 'tabs mt' }, [1, 0].map((i) => h('button', { type: 'button', class: tabIdx === i ? 'on' : '', onclick: () => { w.state.team = i; WM.refresh(w.id); } }, box.names[i]))));
    body.appendChild(playerTables(box, tabIdx));
  }

  Win.box = function (gameId) {
    WM.open('box:' + gameId, {
      title: 'Box Score',
      icon: 'box',
      width: 900,
      height: 640,
      layoutKey: 'box',
      render(body, w) {
        const st = App.state;
        const g = st.games.find((x) => x.id === gameId);
        if (!g || !g.box) {
          body.appendChild(h('div', { class: 'empty' }, 'Box score unavailable.'));
          return;
        }
        if (w.state.team == null) w.state.team = g.home === st.userId ? 0 : 1;
        WM.setTitle(w.id, 'Box Score · ' + g.box.abbr[1] + ' ' + g.box.score[1] + ', ' + g.box.abbr[0] + ' ' + g.box.score[0]);
        renderBox(body, g.box, w);
      },
    });
  };

  FNG.BoxView = { teamStats, playerTables, line };
})();
