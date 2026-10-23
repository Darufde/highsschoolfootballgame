/* Colleges: the major college programs, their recruiting pages, and offer widgets used across the game. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, Players, Recruits, Colleges, World } = FNG;
  const { h, badge, collegeLogo, table, select, seg, tabs, stars } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const CLASS_TAG = ['SR', 'JR', 'SO', 'FR'];

  // Recruiting wire wording by event kind ("<college> <verb> <player>").
  const WIRE_VERB = { offer: ' offers ', signed: ' signs ', commit: ' lands a commitment from ', decommit: ' loses the commitment of ', pulled: ' pulls its offer to ' };

  function openPlayer(st, p) {
    if (st.roster.includes(p)) Win.player(p.id);
    else Win.prospect(p.id);
  }

  function offeredWhen(st, year, week) {
    if (week > 16) return 'Offseason ' + year;
    return (week > 10 ? 'P' + (week - 10) : 'Wk ' + week) + ' ’' + String(year).slice(2);
  }

  function interestColor(v) {
    return v >= 80 ? '#22d3ee' : v >= 65 ? '#34d399' : v >= 45 ? '#facc15' : v >= 25 ? '#fb923c' : '#f87171';
  }
  function interestBar(v) {
    return h('div', { title: 'Player interest ' + v + '/100' },
      h('div', { class: 'tiny', style: { color: interestColor(v), fontWeight: 700 } }, Colleges.interestLabel(v)),
      h('div', { class: 'ibar' }, h('i', { style: { width: v + '%', background: interestColor(v) } })));
  }

  // A row of college logos (each opens that college's recruiting page).
  function logoStrip(offers, max, size) {
    const el = h('span', { class: 'logo-strip' });
    const n = max || offers.length;
    for (const o of offers.slice(0, n)) {
      const c = o.college || o;
      el.appendChild(h('button', { type: 'button', class: o.committed ? 'committed' : null, title: c.name + (o.committed ? ' · committed' : o.interest != null ? ' · interest ' + Colleges.interestLabel(o.interest).toLowerCase() : ''), 'aria-label': c.name + (o.committed ? ' (committed)' : ''), onclick: (e) => { e.stopPropagation(); Win.college(c.id); } }, collegeLogo(c, size || 'sm')));
    }
    if (offers.length > n) el.appendChild(h('span', { class: 'more', title: offers.slice(n).map((o) => (o.college || o).name).join(', ') }, '+' + (offers.length - n)));
    return el;
  }

  // Offers cell for tables: count plus the leading logos.
  function offersCell(offers, max) {
    if (!offers.length) return h('span', { class: 'dim' }, '—');
    return h('span', { class: 'row nowrap', style: { gap: '6px' } }, h('b', { class: 'num' }, offers.length), logoStrip(offers, max || 4), offers[0].committed ? h('span', { class: 'tag good', title: 'Committed to ' + offers[0].college.name }, '✓') : null);
  }

  // "Committed to X" banner with the college's logo.
  function commitBanner(st, o) {
    return h('div', { class: 'commit-banner' }, collegeLogo(o.college, 'md'),
      h('div', null, h('div', { class: 'bold' }, 'Committed to ', h('button', { type: 'button', class: 'linklike', onclick: () => Win.college(o.college.id) }, o.college.name)),
        h('div', { class: 'tiny muted' }, 'Verbal commitment ' + offeredWhen(st, o.commitYear, o.commitWeek) + '. He signs at the end of his senior season unless a better offer flips him.')));
  }

  // Profile card: every major college offer, other offers and colleges still evaluating the player.
  function offersCard(st, p, s) {
    const offers = Season.collegeOffers(st, p, s);
    const info = Season.recruitInfo(st, p, s);
    const others = info ? info.otherOffers : [];
    const suitors = Season.collegeSuitors(st, p, s, 6);
    const card = h('div', { class: 'card' },
      h('div', { class: 'row between' }, h('h3', { class: 'sect', style: { margin: 0 } }, 'College Offers' + (offers.length ? ' · ' + offers.length : '')),
        h('button', { type: 'button', class: 'btn sm ghost', onclick: () => Win.colleges() }, 'All Colleges')));
    if (offers.length) {
      if (offers[0].committed) card.appendChild(commitBanner(st, offers[0]));
      card.appendChild(h('div', { class: 'small muted', style: { margin: '4px 0 2px' } }, 'Major college offers, by the player’s interest.'));
      offers.forEach((o, i) => card.appendChild(h('div', { class: 'offer-row' },
        collegeLogo(o.college, 'md'),
        h('div', { style: { minWidth: 0 } },
          h('div', { class: 'row nowrap', style: { gap: '6px' } }, h('button', { type: 'button', class: 'linklike bold', onclick: () => Win.college(o.college.id) }, o.college.name), o.committed ? h('span', { class: 'tag good' }, 'Committed') : i === 0 && offers.length > 1 && !offers[0].committed ? h('span', { class: 'tag gold' }, 'Leader') : null),
          h('div', { class: 'tiny muted' }, Colleges.confName(o.college.conf) + ' · ' + o.college.city + ', ' + o.college.state + ' · prestige ' + o.college.prestige + ' · offered ' + offeredWhen(st, o.year, o.week))),
        interestBar(o.interest))));
    } else {
      card.appendChild(h('p', { class: 'small muted' }, p.year === 4 && st.phase === 'offseason' ? 'No major college offers.' : 'No major college offers yet.'));
    }
    if (others.length) card.appendChild(h('div', { class: 'small', style: { marginTop: '8px', whiteSpace: 'normal' } }, h('b', null, 'Other offers: '), others.map((o) => o.name + ' (' + Recruits.TIER_NAME[o.tier] + ')').join(', ')));
    if (suitors.length) {
      card.appendChild(h('div', { class: 'tiny muted bold', style: { marginTop: '10px' } }, 'ALSO EVALUATING'));
      card.appendChild(h('div', { class: 'row', style: { gap: '6px', marginTop: '4px' } }, logoStrip(suitors), h('span', { class: 'small muted' }, suitors.map((x) => x.college.abbr).join(' · '))));
    }
    return card;
  }

  // Game preview: players on both teams holding offers, and who offered them.
  function gameOffers(st, a, b) {
    const side = (s) => {
      const list = Season.offeredPlayers(st, s);
      const col = h('div', null, h('div', { class: 'row nowrap', style: { gap: '6px', marginBottom: '4px' } }, badge(s, st, 'sm'), h('span', { class: 'bold ellipsis' }, s.name), h('span', { class: 'small muted' }, list.length + ' with offers')));
      if (!list.length) col.appendChild(h('div', { class: 'small dim' }, 'No major college offers on this roster.'));
      for (const x of list.slice(0, 8)) {
        const info = Season.recruitInfo(st, x.p, s);
        col.appendChild(h('div', { class: 'gp' },
          h('div', { class: 'small ellipsis' }, h('button', { type: 'button', class: 'linklike', onclick: () => openPlayer(st, x.p) }, Players.shortName(x.p)), ' ' + x.p.pos + ' · ' + Players.CLASS_NAME[x.p.year] + (info ? ' · #' + info.rank : '')),
          h('div', { class: 'small bold num' }, x.offers[0].committed ? h('span', { class: 'tag good', title: 'Committed to ' + x.offers[0].college.name }, '✓ ' + x.offers[0].college.abbr) : x.offers.length + ' offer' + (x.offers.length > 1 ? 's' : '')),
          logoStrip(x.offers, 10)));
      }
      if (list.length > 8) col.appendChild(h('div', { class: 'tiny muted', style: { marginTop: '4px' } }, '+' + (list.length - 8) + ' more players with offers'));
      return col;
    };
    return h('div', { class: 'card tight mt' }, h('h3', { class: 'sect', style: { marginTop: 0 } }, 'College Offers in This Game'), h('div', { class: 'game-offers' }, side(a), side(b)));
  }

  function classTagOf(st, cy) {
    return CLASS_TAG[U.clamp(cy - st.year - 1, 0, 3)];
  }

  // Current offers from a college, counted by graduating class.
  function offerCounts(st, cid) {
    const out = { total: 0 };
    for (const o of Colleges.offersBy(st.cr || Colleges.init(), cid)) {
      const meta = st.cr.meta && st.cr.meta[o.pid];
      const cy = meta ? meta[0] : null;
      out.total++;
      if (cy) out[cy] = (out[cy] || 0) + 1;
    }
    return out;
  }

  function prestigeCell(v) {
    return h('span', { class: 'row nowrap', style: { gap: '6px' } }, h('b', { class: 'num' }, v), h('div', { class: 'ibar', style: { width: '54px', marginTop: 0 } }, h('i', { style: { width: v + '%', background: 'var(--gold)' } })));
  }

  Win.colleges = function () {
    WM.open('colleges', {
      title: 'Colleges',
      icon: 'college',
      wide: true,
      state: { conf: 'all', sort: { key: 'pres', dir: 'desc' } },
      render(body, w) {
        const st = App.state;
        const S = w.state;
        const years = st.recruits ? Object.keys(st.recruits.classes).map(Number).sort((a, b) => a - b) : [];
        const lastSigned = st.cr ? Object.keys(st.cr.signed).map(Number).sort((a, b) => b - a)[0] : null;
        const signedBy = {};
        if (lastSigned) for (const x of st.cr.signed[lastSigned]) signedBy[x[0]] = (signedBy[x[0]] || 0) + 1;
        const commitsBy = {};
        for (const pid in (st.cr && st.cr.commits) || {}) commitsBy[st.cr.commits[pid][0]] = (commitsBy[st.cr.commits[pid][0]] || 0) + 1;
        const rows = Colleges.LIST.filter((c) => S.conf === 'all' || c.conf === S.conf).map((c) => ({ c, n: offerCounts(st, c.id), commits: commitsBy[c.id] || 0 }));
        body.appendChild(h('p', { class: 'muted small', style: { marginTop: 0 } },
          'Every Big Ten, SEC, ACC, Big 12 and Pac-12 program in the game, plus Notre Dame, recruits the players in the game. Offers update every week from each player’s rating, position, statistics, recent games, potential, recruit ranking, level of competition and location. Prestige sets the level a college recruits at and how far it can reach; lower-prestige programs look harder at developing, local and overlooked players.'));
        body.appendChild(h('div', { class: 'toolbar' },
          seg([{ value: 'all', label: 'All' }].concat(FNG.DATA.conferences.map((c) => ({ value: c.id, label: c.id === 'IND' ? 'Notre Dame' : c.name }))), S.conf, (v) => { S.conf = v; WM.refresh(w.id); }),
          h('div', { class: 'grow' }),
          h('span', { class: 'small muted' }, rows.length + ' programs · ' + rows.reduce((a, r) => a + r.n.total, 0) + ' current offers')));
        const cols = [
          { key: 'name', label: 'College', value: (r) => r.c.name, defaultDir: 'asc', render: (r) => h('div', { class: 'row nowrap', style: { gap: '8px' } }, collegeLogo(r.c), h('span', { class: 'bold' }, r.c.name)) },
          { key: 'conf', label: 'Conf', value: (r) => Colleges.confName(r.c.conf), defaultDir: 'asc', cls: 'muted' },
          { key: 'loc', label: 'Location', value: (r) => r.c.state + r.c.city, defaultDir: 'asc', render: (r) => r.c.city + ', ' + r.c.state, cls: 'muted' },
          { key: 'pres', label: 'Prestige', value: (r) => r.c.prestige, render: (r) => prestigeCell(r.c.prestige) },
          { key: 'tot', label: 'Offers', value: (r) => r.n.total, render: (r) => h('b', { class: 'num' }, r.n.total), cls: 'num r' },
          { key: 'cm', label: 'Commits', title: 'Players in the game committed to this college', value: (r) => r.commits, render: (r) => (r.commits ? h('b', { class: 'num good-t' }, r.commits) : h('span', { class: 'dim' }, '0')), cls: 'num r' },
        ].concat(years.map((cy) => ({ key: 'c' + cy, label: classTagOf(st, cy), title: 'Offers in the class of ' + cy, value: (r) => r.n[cy] || 0, render: (r) => r.n[cy] || h('span', { class: 'dim' }, '0'), cls: 'num r' })));
        if (lastSigned) cols.push({ key: 'sg', label: 'Signed ’' + String(lastSigned).slice(2), title: 'Players signed from the ' + lastSigned + ' senior class', value: (r) => signedBy[r.c.id] || 0, render: (r) => signedBy[r.c.id] || h('span', { class: 'dim' }, '0'), cls: 'num r' });
        body.appendChild(table(cols, rows, { sortState: S.sort, onSort: () => WM.refresh(w.id), onRow: (r) => Win.college(r.c.id) }));

        // Recruiting wire: the latest offers, pulled offers and signings.
        const wire = (st.cr ? st.cr.wire : []).map((x) => {
          const c = Colleges.get(x[2]);
          const f = Season.findPlayer(st, x[3]);
          let name = f ? Players.fullName(f.p) : null;
          let where = f ? f.s : null;
          if (!f && x[4] === 'signed' && st.cr.signed[x[0]]) {
            const sg = st.cr.signed[x[0]].find((y) => y[1] === x[3]);
            if (sg) {
              name = sg[2];
              where = Season.school(st, sg[4]);
            }
          }
          return name && c ? { x, c, f, name, where } : null;
        }).filter(Boolean).slice(0, 30);
        if (wire.length) {
          body.appendChild(h('h3', { class: 'sect mt' }, 'Recruiting Wire'));
          body.appendChild(h('div', { class: 'card tight' }, wire.map((r) => h('div', { class: 'row nowrap small', style: { gap: '8px', padding: '4px 0' } },
            h('span', { class: 'dim num', style: { width: '62px', flex: 'none' } }, offeredWhen(st, r.x[0], r.x[1])),
            collegeLogo(r.c, 'sm'),
            h('span', { class: 'ellipsis' }, h('button', { type: 'button', class: 'linklike', onclick: () => Win.college(r.c.id) }, r.c.name),
              WIRE_VERB[r.x[4]] || ' pulls its offer to ',
              r.f ? h('button', { type: 'button', class: 'linklike', onclick: () => openPlayer(st, r.f.p) }, r.name) : h('b', null, r.name),
              r.where ? h('span', { class: 'muted' }, ' (' + (r.f ? r.f.p.pos + ', ' : '') + r.where.name + ', ' + r.where.state + ')') : null)))));
        }
      },
    });
  };

  // How a college recruits, in words.
  function approach(c) {
    const reach = Colleges.reach(c);
    const scope = reach >= 1050 ? 'Recruits nationally' : reach >= 850 ? 'Recruits across the region' : 'Recruits mostly close to home';
    const level = c.prestige >= 85 ? 'chases the top-ranked prospects' : c.prestige >= 70 ? 'targets ranked, proven players' : c.prestige >= 60 ? 'mixes ranked players with developing prospects' : 'looks hard at developing, local and overlooked players';
    return scope + ' and ' + level + '. Typical recruit rating ' + Math.round(Colleges.band(c)) + '+.';
  }

  Win.college = function (id) {
    WM.open('college:' + id, {
      title: 'College',
      icon: 'college',
      wide: true,
      state: { tab: 'offers', cy: 'all', sort: { key: 'sc', dir: 'desc' }, year: null },
      render(body, w) {
        const st = App.state;
        const c = Colleges.get(id);
        if (!c) return;
        const S = w.state;
        WM.setTitle(w.id, c.name + ' Recruiting');
        const board = Season.collegeBoard(st, id);
        const presRank = Colleges.LIST.filter((x) => x.prestige > c.prestige).length + 1;
        const homeState = Season.states(st).includes(c.state) ? ' · home state in your world' : '';
        body.appendChild(h('div', { class: 'hero', style: { background: 'linear-gradient(115deg, ' + c.colors[0] + 'cc, var(--panel-2) 70%)', borderColor: 'var(--line-2)' } },
          collegeLogo(c, 'lg'),
          h('div', { class: 'grow', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'name' }, c.name),
            h('div', { class: 'meta' }, Colleges.confName(c.conf) + ' · ' + c.city + ', ' + c.state + homeState),
            h('div', { class: 'meta' }, approach(c))),
          h('div', { class: 'right', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'small', style: { color: 'rgba(255,255,255,.75)' } }, 'Prestige'),
            h('div', { style: { fontSize: '26px', fontWeight: 800 } }, c.prestige),
            h('div', { class: 'small', style: { color: 'rgba(255,255,255,.75)' } }, '#' + presRank + ' of ' + Colleges.LIST.length + ' · ' + board.length + ' offers'))));

        const signedYears = Object.keys((st.cr && st.cr.signed) || {}).map(Number).sort((a, b) => b - a);
        const commits = board.filter((r) => r.commit && r.commit.college.id === id);
        body.appendChild(tabs([{ value: 'offers', label: 'Offers (' + board.length + ')' }, { value: 'commits', label: 'Commits (' + commits.length + ')' }, { value: 'targets', label: 'Evaluating' }, { value: 'signed', label: 'Signed' }], S.tab, (v) => { S.tab = v; WM.refresh(w.id); }));
        // Where each offered player stands: committed here, committed elsewhere, or still open.
        const statusCol = { key: 'cm', label: 'Status', value: (r) => (r.commit ? (r.commit.college.id === id ? 2 : 1) : 0), render: (r) => (!r.commit ? h('span', { class: 'dim' }, 'Open') : r.commit.college.id === id ? h('span', { class: 'tag good' }, 'Committed') : h('span', { class: 'row nowrap', style: { gap: '4px' }, title: 'Committed to ' + r.commit.college.name }, collegeLogo(r.commit.college, 'sm'), h('span', { class: 'small muted' }, r.commit.college.abbr))) };

        const nameCol = { key: 'n', label: 'Prospect', value: (r) => r.p.last + r.p.first, defaultDir: 'asc', render: (r) => h('button', { type: 'button', class: 'linklike', onclick: () => openPlayer(st, r.p) }, Players.fullName(r.p)) };
        const schoolCol = { key: 'sch', label: 'School', value: (r) => r.s.name, defaultDir: 'asc', render: (r) => h('div', { class: 'row nowrap', style: { gap: '6px' } }, badge(r.s, st, 'sm'), h('button', { type: 'button', class: 'linklike', onclick: () => Win.school(r.s.id) }, r.s.name), h('span', { class: 'tiny muted' }, r.s.state)) };
        const common = [
          nameCol,
          { key: 'pos', label: 'Pos', value: (r) => Players.POSITIONS.indexOf(r.p.pos), render: (r) => r.p.pos, defaultDir: 'asc' },
          { key: 'cls', label: 'Class', value: (r) => r.m.cy, render: (r) => r.m.cy + ' (' + classTagOf(st, r.m.cy) + ')', defaultDir: 'asc' },
          schoolCol,
          { key: 'dist', label: 'Miles', title: 'Distance from campus', value: (r) => U.distKm(c, r.s), render: (r) => U.num(U.distKm(c, r.s) * 0.621), cls: 'num r muted' },
          { key: 'stars', label: 'Stars', value: (r) => r.m.stars, render: (r) => (r.m.rank ? stars(r.m.stars) : h('span', { class: 'dim' }, 'NR')) },
          { key: 'rk', label: 'Natl', value: (r) => (r.m.rank ? -r.m.rank : -9999), render: (r) => (r.m.rank ? '#' + r.m.rank : h('span', { class: 'dim' }, '—')), cls: 'num' },
          { key: 'sc', label: 'Rating', value: (r) => r.m.sc, render: (r) => h('b', { class: 'num' }, r.m.sc.toFixed(1)), cls: 'num r' },
        ];

        if (S.tab === 'offers') {
          const years = [...new Set(board.map((r) => r.m.cy))].sort((a, b) => a - b);
          if (S.cy !== 'all' && !years.includes(S.cy)) S.cy = 'all';
          const rows = board.filter((r) => S.cy === 'all' || r.m.cy === S.cy);
          body.appendChild(h('div', { class: 'toolbar' },
            seg([{ value: 'all', label: 'All classes' }].concat(years.map((y) => ({ value: y, label: 'Class of ' + y + ' (' + board.filter((r) => r.m.cy === y).length + ')' }))), S.cy, (v) => { S.cy = v; WM.refresh(w.id); }),
            h('div', { class: 'grow' }),
            h('span', { class: 'small muted' }, rows.length + ' offered players')));
          body.appendChild(table(common.concat([
            { key: 'when', label: 'Offered', value: (r) => r.year * 100 + r.week, render: (r) => offeredWhen(st, r.year, r.week), cls: 'muted' },
            statusCol,
            { key: 'int', label: 'Interest', value: (r) => r.interest, render: (r) => interestBar(r.interest) },
          ]), rows, { sortState: S.sort, onSort: () => WM.refresh(w.id), rowClass: (r) => (r.s.isUser ? 'me' : ''), empty: c.name + ' has not offered any players in the game yet.' }));
          body.appendChild(h('p', { class: 'help' }, 'Interest is how interested each player is in ' + c.name + ', from its prestige against the player’s own level, home state and distance. Offers to players whose stock falls well below the bar can be pulled.'));
        } else if (S.tab === 'commits') {
          const byClass = {};
          for (const r of commits) byClass[r.m.cy] = (byClass[r.m.cy] || 0) + 1;
          body.appendChild(h('p', { class: 'small muted', style: { marginTop: 0 } }, commits.length ? 'Players verbally committed to ' + c.name + ': ' + Object.keys(byClass).sort().map((cy) => byClass[cy] + ' in the class of ' + cy).join(', ') + '. They sign at the end of their senior season unless another school flips them.' : 'No players in the game have committed to ' + c.name + ' yet.'));
          if (commits.length) body.appendChild(table(common.concat([
            { key: 'when', label: 'Committed', value: (r) => r.commit.year * 100 + r.commit.week, render: (r) => offeredWhen(st, r.commit.year, r.commit.week), cls: 'muted' },
            { key: 'int', label: 'Interest', value: (r) => r.interest, render: (r) => interestBar(r.interest) },
          ]), commits, { sortState: S.sort, onSort: () => WM.refresh(w.id), rowClass: (r) => (r.s.isUser ? 'me' : '') }));
        } else if (S.tab === 'targets') {
          const rows = Season.collegeTargets(st, id, 30);
          body.appendChild(h('p', { class: 'small muted', style: { marginTop: 0 } }, 'Ranked prospects ' + c.name + ' is watching but has not offered, closest to an offer first. Better production, development or a rise in the rankings can earn an offer.'));
          body.appendChild(table(common.concat([
            { key: 'gap', label: 'Status', value: (r) => r.gap, render: (r) => (r.gap >= 0 ? h('span', { class: 'tag info', title: 'Good enough for an offer, but the college has filled its board at this position or the player shows little interest' }, 'Board full') : r.gap > -1.5 ? h('span', { class: 'tag good' }, 'Close') : h('span', { class: 'tag' }, 'Watching')) },
            { key: 'int', label: 'Interest', value: (r) => r.interest, render: (r) => interestBar(r.interest) },
          ]), rows, { rowClass: (r) => (r.s.isUser ? 'me' : ''), empty: 'No other ranked prospects are close to an offer.' }));
        } else {
          if (!signedYears.length) {
            body.appendChild(h('div', { class: 'empty' }, 'Signing day comes at the end of the season. Seniors with offers sign with the college they like best.'));
            return;
          }
          if (!S.year || !signedYears.includes(S.year)) S.year = signedYears[0];
          const rows = st.cr.signed[S.year].filter((x) => x[0] === id);
          body.appendChild(h('div', { class: 'toolbar' }, select(signedYears.map((y) => ({ value: y, label: 'Class of ' + (y + 1) + ' (signed ' + y + ')' })), S.year, (v) => { S.year = Number(v); WM.refresh(w.id); }), h('div', { class: 'grow' }), h('span', { class: 'small muted' }, rows.length + ' signees from the states in the game')));
          body.appendChild(table([
            { key: 'n', label: 'Player', render: (x) => { const f = Season.findPlayer(st, x[1]); return f ? h('button', { type: 'button', class: 'linklike', onclick: () => openPlayer(st, f.p) }, x[2]) : h('span', { class: 'bold' }, x[2]); } },
            { key: 'pos', label: 'Pos', render: (x) => x[3] },
            { key: 'sch', label: 'High School', render: (x) => { const s = Season.school(st, x[4]); return s ? h('div', { class: 'row nowrap', style: { gap: '6px' } }, badge(s, st, 'sm'), h('button', { type: 'button', class: 'linklike', onclick: () => Win.school(s.id) }, s.name), h('span', { class: 'tiny muted' }, s.state)) : ''; } },
            { key: 'stars', label: 'Stars', render: (x) => (x[6] ? stars(x[5]) : h('span', { class: 'dim' }, 'NR')) },
            { key: 'rk', label: 'Natl', render: (x) => (x[6] ? '#' + x[6] : '—'), cls: 'num' },
            { key: 'sc', label: 'Rating', render: (x) => x[7].toFixed(1), cls: 'num r' },
            { key: 'of', label: 'Offers', render: (x) => x[8], cls: 'num r muted' },
          ], rows.sort((a, b) => b[7] - a[7]), { empty: c.name + ' signed no players from the states in the game this year.' }));
        }
      },
    });
  };

  FNG.CollegeView = { logoStrip, offersCell, offersCard, gameOffers, interestBar, offeredWhen, commitBanner };
})();
