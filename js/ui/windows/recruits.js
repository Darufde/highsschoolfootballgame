/* Recruit rankings and prospect profiles. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, Players, Recruits, World } = FNG;
  const { h, badge, table, select, seg, stars, ovrChip, attrBar } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const PAGE = 100;

  // ▲3 / ▼2 / — / NEW relative to the previous rankings.
  function moveTag(move) {
    if (move == null) return h('span', { class: 'move new' }, 'NEW');
    if (move > 0) return h('span', { class: 'move up' }, '▲' + move);
    if (move < 0) return h('span', { class: 'move down' }, '▼' + -move);
    return h('span', { class: 'move same' }, '—');
  }

  function classLabel(st, cy) {
    const grade = 4 - (cy - st.year - 1);
    return 'Class of ' + cy + ' (' + (['', 'Freshmen', 'Sophomores', 'Juniors', 'Seniors'][grade] || '') + ')';
  }

  // Major college offers (count and logos); lower-level offers show as a count when there are none.
  function offersCell(info) {
    if (info.offers.length) return FNG.CollegeView.offersCell(info.offers, 4);
    if (info.otherOffers.length) return h('span', { class: 'small muted', title: info.otherOffers.map((o) => o.name).join(', ') }, info.otherOffers.length + ' other');
    return h('span', { class: 'dim' }, '—');
  }

  function openPlayer(st, p) {
    if (st.roster.includes(p)) Win.player(p.id);
    else Win.prospect(p.id);
  }

  Win.recruits = function (opts) {
    WM.open('recruits', {
      title: 'Recruit Rankings',
      icon: 'star',
      wide: true,
      state: { cy: null, st: 'all', pos: 'ALL', team: 'all', off: 'all', stars: 0, page: 0 },
      render(body, w) {
        const st = App.state;
        const S = w.state;
        const R = st.recruits;
        if (opts && opts.team) {
          S.team = opts.team;
          opts = null;
        }
        if (!R) {
          body.appendChild(h('div', { class: 'empty' }, 'Rankings are published at the start of each season.'));
          return;
        }
        const years = Object.keys(R.classes).map(Number).sort((a, b) => a - b);
        if (!S.cy || !R.classes[S.cy]) S.cy = years[0];
        const all = R.classes[S.cy].map((e, i) => {
          const f = Season.findPlayer(st, e[0]);
          return f ? { p: f.p, s: f.s, rank: i + 1, score: e[1], prev: e[2] || 0 } : null;
        }).filter(Boolean);
        const posRank = {};
        const stateRank = {};
        const pc = {};
        const sc = {};
        for (const r of all) {
          pc[r.p.pos] = (pc[r.p.pos] || 0) + 1;
          sc[r.s.state] = (sc[r.s.state] || 0) + 1;
          posRank[r.p.id] = pc[r.p.pos];
          stateRank[r.p.id] = sc[r.s.state];
        }
        const teams = [...new Set(all.map((r) => r.s))].sort((a, b) => a.name.localeCompare(b.name));
        const offered = (r) => !!(st.cr && st.cr.offers[r.p.id]);
        let rows = all.filter((r) => (S.st === 'all' || r.s.state === S.st) && (S.pos === 'ALL' || r.p.pos === S.pos) && (S.team === 'all' || r.s.id === S.team) && (S.off === 'all' || (S.off === 'offered') === offered(r)) && (!S.stars || Recruits.stars(r.rank) === S.stars));
        const pages = Math.max(1, Math.ceil(rows.length / PAGE));
        if (S.page >= pages) S.page = pages - 1;
        const set = (k) => (v) => { S[k] = v; S.page = 0; WM.refresh(w.id); };

        body.appendChild(h('p', { class: 'muted small', style: { marginTop: 0 } },
          'Rankings as of ' + R.label + ' ' + R.year + '. Prospects are rated on ability, career ceiling, size and speed for the position, production this season and level of competition. The top ' + U.num(Recruits.RANKED_PER_CLASS) + ' in each class are ranked, and stars come from national rank: ' + [5, 4, 3, 2, 1].map((n) => U.num(Recruits.STAR_COUNTS[n]) + ' ' + n + '★').join(', ') + '. Offers are from the major college programs (logos open each college\u2019s recruiting page).'));
        body.appendChild(h('div', { class: 'toolbar' }, seg(years.map((y) => ({ value: y, label: classLabel(st, y) })), S.cy, (v) => { S.cy = v; S.team = 'all'; S.page = 0; WM.refresh(w.id); })));
        body.appendChild(h('div', { class: 'toolbar' },
          select([{ value: 'all', label: 'All states' }].concat(Season.states(st).map((k) => ({ value: k, label: World.stateName(k) }))), S.st, set('st')),
          select([{ value: 0, label: 'All stars' }].concat([5, 4, 3, 2, 1].map((n) => ({ value: n, label: n + '★ (' + U.num(Recruits.STAR_COUNTS[n]) + ')' }))), S.stars, (v) => set('stars')(Number(v))),
          select([{ value: 'all', label: 'Any offers' }, { value: 'offered', label: 'Has major offers' }, { value: 'none', label: 'No major offers' }], S.off, set('off')),
          select([{ value: 'ALL', label: 'All positions' }].concat(Players.POSITIONS.map((p) => ({ value: p, label: Players.POS_NAME[p] }))), S.pos, set('pos')),
          select([{ value: 'all', label: 'All teams' }, { value: st.userId, label: '★ ' + Season.user(st).name }].concat(teams.filter((t) => !t.isUser).map((t) => ({ value: t.id, label: t.name + ' (' + t.state + ')' }))), S.team, set('team')),
          h('div', { class: 'grow' }),
          h('span', { class: 'small muted' }, U.num(rows.length) + ' ranked prospects')));

        const cols = [
          { key: 'rk', label: 'Natl', render: (r) => h('b', { class: 'num' }, r.rank), cls: 'num' },
          { key: 'mv', label: '+/-', render: (r) => moveTag(r.prev ? r.prev - r.rank : null) },
          S.st !== 'all' ? { key: 'srk', label: S.st, render: (r) => stateRank[r.p.id], cls: 'num' } : null,
          { key: 'prk', label: 'Pos Rk', render: (r) => r.p.pos + ' #' + posRank[r.p.id], cls: 'muted' },
          { key: 'n', label: 'Prospect', render: (r) => h('button', { type: 'button', class: 'linklike', onclick: () => openPlayer(st, r.p) }, Players.fullName(r.p)) },
          { key: 'pos', label: 'Pos', render: (r) => r.p.pos },
          { key: 'hw', label: 'Ht/Wt', render: (r) => Players.heightStr(r.p.ht) + ' ' + r.p.wt, cls: 'muted' },
          { key: 'sch', label: 'School', render: (r) => h('div', { class: 'row nowrap', style: { gap: '6px' } }, badge(r.s, st, 'sm'), h('button', { type: 'button', class: 'linklike', onclick: () => Win.school(r.s.id) }, r.s.name), h('span', { class: 'tiny muted' }, r.s.state)) },
          { key: 'stars', label: 'Stars', render: (r) => stars(Recruits.stars(r.rank)) },
          { key: 'sc', label: 'Rating', render: (r) => h('b', { class: 'num' }, r.score.toFixed(1)), cls: 'r' },
          { key: 'stat', label: 'This Season', render: (r) => Recruits.statLine(r.p, st.perf[r.p.id]) || h('span', { class: 'dim' }, '—'), cls: 'muted' },
          { key: 'off', label: 'Offers', render: (r) => offersCell(Season.recruitInfo(st, r.p, r.s)) },
        ].filter(Boolean);
        body.appendChild(table(cols, rows.slice(S.page * PAGE, (S.page + 1) * PAGE), { rowClass: (r) => (r.s.isUser ? 'me' : ''), empty: 'No ranked prospects match these filters.' }));
        if (pages > 1) {
          const go = (n) => { S.page = U.clamp(n, 0, pages - 1); WM.refresh(w.id); };
          const opts = [];
          for (let i = 0; i < pages; i++) opts.push({ value: i, label: U.num(i * PAGE + 1) + '–' + U.num(Math.min(rows.length, (i + 1) * PAGE)) });
          body.appendChild(h('div', { class: 'row mt', style: { justifyContent: 'center', gap: '8px' } },
            h('button', { type: 'button', class: 'btn sm', disabled: S.page === 0, onclick: () => go(S.page - 1) }, '‹ Prev'),
            select(opts, S.page, (v) => go(Number(v))),
            h('span', { class: 'small muted' }, 'of ' + U.num(rows.length)),
            h('button', { type: 'button', class: 'btn sm', disabled: S.page >= pages - 1, onclick: () => go(S.page + 1) }, 'Next ›')));
        }
      },
    });
  };

  // Profile of any prospect in either state (the user's own players open the full player card).
  Win.prospect = function (id) {
    WM.open('prospect:' + id, {
      title: 'Prospect',
      icon: 'star',
      render(body, w) {
        const st = App.state;
        const f = Season.findPlayer(st, id);
        if (!f) {
          body.appendChild(h('div', { class: 'empty' }, 'This player is no longer in the program.'));
          return;
        }
        const { p, s } = f;
        const info = Season.recruitInfo(st, p, s);
        const commit = Season.collegeCommit(st, p);
        WM.setTitle(w.id, Players.fullName(p));
        const cy = Recruits.classYear(p, st.year);
        body.appendChild(h('div', { class: 'hero' },
          badge(s, st, 'lg'),
          h('div', { class: 'grow', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'name' }, '#' + p.num + ' ' + Players.fullName(p)),
            h('div', { class: 'meta' }, Players.POS_NAME[p.pos] + ' · Class of ' + cy + ' · ' + Players.heightStr(p.ht) + ', ' + p.wt + ' lbs'),
            h('div', { class: 'meta' }, h('button', { type: 'button', class: 'linklike', style: { color: '#fff' }, onclick: () => Win.school(s.id) }, s.name), ' · ' + s.city + ', ' + World.stateName(s.state) + ' · ' + World.divLabel(s)),
            commit ? h('div', { class: 'meta row', style: { gap: '6px' } }, FNG.UI.collegeLogo(commit.college, 'sm'), h('span', { class: 'bold' }, 'Committed to ' + commit.college.name)) : null),
          h('div', { class: 'right', style: { position: 'relative', zIndex: 1 } },
            info ? h('div', null, stars(info.stars), h('div', { style: { fontSize: '22px', fontWeight: 800 } }, '#' + info.rank), h('div', { class: 'small', style: { color: 'rgba(255,255,255,.75)' } }, 'Class of ' + info.classYear + ' · ', moveTag(info.move))) : h('div', { class: 'small' }, 'Unranked'))));
        const film = st.program.facilities.film >= 3 || s.isUser;
        const left = h('div', { class: 'col' },
          h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Recruiting'),
            info ? h('dl', { class: 'kv' },
              h('dt', null, 'Rating'), h('dd', null, info.score.toFixed(1)),
              h('dt', null, 'National rank'), h('dd', null, '#' + info.rank + ' in the class of ' + info.classYear),
              h('dt', null, 'Movement'), h('dd', null, info.prev ? 'Was #' + info.prev + ' ' : 'Newly ranked ', moveTag(info.move)),
              h('dt', null, 'This season'), h('dd', null, Recruits.statLine(p, st.perf[p.id]) || '—'),
              h('dt', null, 'Offers'), h('dd', null, info.offers.length ? FNG.CollegeView.logoStrip(info.offers, 12) : 'No major college offers yet')) : h('p', { class: 'muted small' }, 'Not currently ranked in the class of ' + cy + '.')),
          FNG.CollegeView.offersCard(st, p, s),
          h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Scouting'), h('dl', { class: 'kv' },
            h('dt', null, 'Overall'), h('dd', null, film ? ovrChip(Players.ovr(p)) : '?'),
            h('dt', null, 'Ceiling'), h('dd', null, stars(Players.potentialStars(p))),
            h('dt', null, 'Measurables'), h('dd', null, Players.heightStr(p.ht) + ', ' + p.wt + ' lbs, speed ' + p.a.spd))));
        const right = h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Attributes'),
          film ? Players.ATTRS.map((k) => attrBar(Players.ATTR_LABEL[k], p.a[k])) : h('p', { class: 'muted small' }, 'Upgrade the Film Room to level 3 to scout individual attributes.'));
        body.appendChild(h('div', { class: 'grid c2' }, left, right));
      },
    });
  };

  FNG.RecruitView = { moveTag, offersCell };
})();
