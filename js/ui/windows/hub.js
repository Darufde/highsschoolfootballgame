/* Program Hub: the dashboard window. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, Team, Players, World, Coaches } = FNG;
  const { h, icon, badge, ovrChip, stat, select } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  function compareRows(us, them) {
    const rows = [['qb', 'QB'], ['rb', 'Run'], ['wr', 'Rec'], ['ol', 'OL'], ['dl', 'DL'], ['lb', 'LB'], ['db', 'DB'], ['k', 'K']];
    const width = (v) => U.clamp((v / 75) * 100, 2, 100) + '%';
    return rows.map(([k, label]) => {
      const a = Math.round(us[k]);
      const b = Math.round(them[k]);
      const col = (x, y) => (x >= y ? 'var(--good)' : '#64748b');
      return h('div', { class: 'compare' },
        h('span', { class: 'l num bold' }, a),
        h('div', { class: 'bar left' }, h('i', { style: { width: width(a), background: col(a, b) } })),
        h('span', { class: 'mid' }, label),
        h('div', { class: 'bar' }, h('i', { style: { width: width(b), background: col(b, a) } })),
        h('span', { class: 'num bold' }, b));
    });
  }

  function rankLine(st, s) {
    const n = Season.teamStanding(st, s, 'national');
    const t = Season.teamStanding(st, s, 'state');
    const d = Season.teamStanding(st, s, 'division');
    return '#' + n.rank + ' National · #' + t.rank + ' ' + World.stateName(s.state) + ' · #' + d.rank + ' ' + World.divShort(s);
  }

  // One side of the game preview: record, division, rankings and the team's best recruits.
  function teamPreview(st, s, right) {
    const recruits = Season.topRecruits(st, s, 3);
    const open = (p) => (s.isUser ? Win.player(p.id) : Win.prospect(p.id));
    return h('div', { class: 'card tight', style: right ? { textAlign: 'right' } : null },
      h('div', { class: 'row nowrap', style: { gap: '8px', flexDirection: right ? 'row-reverse' : 'row' } }, badge(s, st),
        h('div', { class: 'grow', style: { minWidth: 0 } },
          s.isUser ? h('div', { class: 'bold ellipsis' }, s.name) : h('button', { type: 'button', class: 'linklike ellipsis', style: { maxWidth: '100%' }, onclick: () => Win.school(s.id) }, s.name),
          h('div', { class: 'small muted' }, s.rec.w + '-' + s.rec.l + ' · ' + World.divLabel(s) + (s.rec.seed ? ' · #' + s.rec.seed + ' seed' : '')))),
      h('div', { class: 'small', style: { margin: '6px 0' } }, rankLine(st, s)),
      h('div', { class: 'tiny muted bold' }, 'TOP RECRUITS'),
      recruits.length ? recruits.map((x) => h('div', { class: 'small', style: { marginTop: '3px' } },
        FNG.UI.stars(x.info.stars), ' ', h('button', { type: 'button', class: 'linklike', onclick: () => open(x.p) }, FNG.Players.shortName(x.p)), ' ' + x.p.pos + ' · #' + x.info.rank + ' \u2019' + String(x.info.classYear).slice(2) + (x.info.offers.length ? ' · ' + x.info.offers.length + ' offers' : '')))
        : h('div', { class: 'small dim' }, 'No ranked recruits'));
  }

  function thisWeekCard(st) {
    const u = Season.user(st);
    const card = h('div', { class: 'card accent' });
    if (st.phase === 'offseason') {
      const O = st.offseason;
      card.append(h('h3', { class: 'sect' }, 'Offseason'),
        h('div', { class: 'bold', style: { fontSize: '16px' } }, Season.OFFSEASON_STEPS[O.step]),
        h('p', { class: 'muted small' }, 'Step ' + (O.step + 1) + ' of ' + Season.OFFSEASON_STEPS.length + '. Work through graduation, development, your incoming class and your coaching staff before the ' + (st.year + 1) + ' season.'),
        h('button', { type: 'button', class: 'btn primary', onclick: () => Win.offseason() }, icon('forward', 15), 'Continue Offseason'));
      return card;
    }
    const g = Season.userGame(st);
    const label = st.phase === 'playoffs' ? Season.ROUND_NAMES[st.week - 10] : 'Week ' + st.week + ' of 10';
    card.appendChild(h('div', { class: 'row between' }, h('h3', { class: 'sect', style: { margin: 0 } }, label), h('span', { class: 'small muted' }, App.dateLabel(st))));
    if (!g) {
      if (st.phase === 'playoffs' && !Season.userAlive(st)) {
        const why = !World.hasPlayoffs(u.state) ? 'Your regular season is complete. ' + World.stateName(u.state) + '’s ' + World.assoc(u.state) + ' playoffs are not in the game yet.' : u.rec.seed ? 'Your season is over (' + u.rec.result + ').' : 'You did not qualify for the playoffs this year.';
        card.append(h('p', null, why),
          h('p', { class: 'muted small' }, 'Follow the Ohio brackets or jump ahead to the offseason.'),
          h('div', { class: 'row' },
            h('button', { type: 'button', class: 'btn', onclick: () => App.advanceWeek() }, 'Sim Week'),
            h('button', { type: 'button', class: 'btn primary', onclick: () => App.simUntil('Simulating playoffs', () => false) }, icon('forward', 15), 'Sim to Offseason')));
      } else {
        card.append(h('p', { style: { fontSize: '15px', fontWeight: 700 } }, 'Bye week'), h('p', { class: 'muted small' }, 'No game this week. Rest up and get healthy.'),
          h('button', { type: 'button', class: 'btn primary', onclick: () => App.advanceWeek() }, icon('forward', 15), 'Advance Week'));
      }
      return card;
    }
    const home = g.home === st.userId;
    const opp = Season.opponentOf(st, g, st.userId);
    const lg = g.league ? h('span', { class: 'tag team' }, World.leagueWord(u.state)) : g.playoff ? h('span', { class: 'tag gold' }, 'Playoffs') : h('span', { class: 'tag' }, 'Non-league');
    card.appendChild(h('div', { class: 'preview mt mb' }, teamPreview(st, u, false), h('div', { class: 'vs' }, g.neutral || home ? 'VS' : 'AT'), teamPreview(st, opp, true)));
    card.appendChild(FNG.CollegeView.gameOffers(st, u, opp));
    card.appendChild(h('div', { class: 'row small muted mb' }, lg, h('span', null, g.neutral ? 'Neutral site' : home ? 'Home' : 'Away'), h('span', null, '· Forecast: ' + Season.gameWeather(g))));
    const us = Team.userRatings(st);
    const them = Season.scout(st, opp);
    card.appendChild(h('div', { class: 'row between small muted' }, h('span', null, 'Us · ' + Team.teamOverall(us)), h('span', null, 'Scouting report'), h('span', null, Team.teamOverall(them) + ' · Them')));
    card.append(...compareRows(us, them));
    card.appendChild(h('div', { class: 'row mt' },
      h('button', { type: 'button', class: 'btn primary lg', onclick: () => App.simGame(g.id) }, icon('play', 16), 'Sim Game'),
      h('span', { class: 'small muted' }, g.playoff ? 'Varsity playoff game.' : 'Varsity, JV and freshman games are all played this week.')));
    return card;
  }

  function leaders(st) {
    const y = st.year;
    const s = (p) => p.stats[y] || {};
    const top = (key, fmt) => {
      const p = st.roster.slice().sort((a, b) => (s(b)[key] || 0) - (s(a)[key] || 0))[0];
      if (!p || !s(p)[key]) return h('div', { class: 'muted small' }, '—');
      return h('div', null, h('button', { type: 'button', class: 'linklike', onclick: () => Win.player(p.id) }, Players.shortName(p)), h('div', { class: 'small muted' }, fmt(s(p))));
    };
    return h('div', { class: 'grid c4' },
      h('div', null, h('div', { class: 'tiny muted bold' }, 'PASSING'), top('pYds', (x) => x.pYds + ' yds · ' + (x.pTD || 0) + ' TD')),
      h('div', null, h('div', { class: 'tiny muted bold' }, 'RUSHING'), top('rYds', (x) => x.rYds + ' yds · ' + (x.rTD || 0) + ' TD')),
      h('div', null, h('div', { class: 'tiny muted bold' }, 'RECEIVING'), top('recYds', (x) => x.recYds + ' yds · ' + (x.rec || 0) + ' rec')),
      h('div', null, h('div', { class: 'tiny muted bold' }, 'TACKLES'), top('tkl', (x) => x.tkl + ' tkl · ' + (x.sck || 0) + ' sck')));
  }

  function staffCard(st) {
    const row = (id) => {
      const c = st.staff[id];
      return h('div', { class: 'row between small', style: { padding: '3px 0' } },
        h('span', { class: 'muted' }, Coaches.ROLE[id].title),
        c ? h('span', { class: 'row', style: { gap: '6px' } }, h('span', null, c.first[0] + '. ' + c.last + (c.scheme ? ' · ' + c.scheme : '')), ovrChip(Coaches.ovr(c))) : h('span', { class: 'tag bad' }, 'Vacant'));
    };
    const vacant = Coaches.ROLES.filter((r) => !st.staff[r.id]).length;
    return h('div', { class: 'card' },
      h('div', { class: 'row between' }, h('h3', { class: 'sect', style: { margin: 0 } }, 'Coaching Staff'), h('button', { type: 'button', class: 'btn sm ghost', onclick: () => Win.staff() }, 'Manage')),
      h('div', { style: { marginTop: '8px' } }, row('oc'), row('dc'), row('st')),
      h('div', { class: 'help' }, vacant ? vacant + ' open position' + (vacant > 1 ? 's' : '') + ' on staff.' : 'Payroll ' + U.money(Coaches.payroll(st.staff)) + ' per season.'));
  }

  Win.hub = function () {
    WM.open('hub', {
      title: 'Program Hub',
      icon: 'hub',
      render(body) {
        const st = App.state;
        const u = Season.user(st);
        const lg = Season.league(st, u.leagueId);
        const ratings = Team.userRatings(st);
        const nat = Season.teamStanding(st, u, 'national');
        const sta = Season.teamStanding(st, u, 'state');
        const dvr = Season.teamStanding(st, u, 'division');
        const oh = !!u.region;
        const levels = { V: 0, JV: 0, FR: 0 };
        for (const p of st.roster) levels[p.level]++;

        body.appendChild(h('div', { class: 'hero' },
          badge(u, st, 'lg'),
          h('div', { class: 'grow', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'name' }, u.name),
            h('div', { class: 'meta' }, u.city + ', ' + u.county + ' County, ' + World.stateName(u.state) + ' · ' + (u.type === 'public' ? 'Public' : 'Private') + ' · ' + U.num(u.enrollment) + ' students'),
            h('div', { class: 'meta' }, World.divLabel(u) + (oh ? ' · ' + World.groupLabel(u) : '') + ' · ', h('button', { type: 'button', class: 'linklike', style: { color: '#fff' }, onclick: () => Win.standings(lg.id) }, lg.name))),
          h('div', { class: 'right', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'small', style: { color: 'rgba(255,255,255,.75)' } }, 'Head Coach'),
            h('div', { class: 'bold' }, st.coach.name),
            h('div', { class: 'small', style: { color: 'rgba(255,255,255,.75)' } }, 'Career ' + st.coach.wins + '-' + st.coach.losses + (st.coach.titles ? ' · ' + st.coach.titles + ' state title' + (st.coach.titles > 1 ? 's' : '') : '')))));

        const played = u.rec.w + u.rec.l > 0;
        const lgStand = Season.leagueStandings(st, lg.id);
        body.appendChild(h('div', { class: 'grid c4 mb' },
          stat('Varsity Record', u.rec.w + '-' + u.rec.l, World.leagueWord(u.state) + ' ' + u.rec.lw + '-' + u.rec.ll + (u.rec.streak ? ' · ' + u.rec.streak : '')),
          oh ? stat('Region ' + u.region, played ? '#' + u.cpRank : '—', played ? u.cp.toFixed(4) + ' computer pts' : 'Ratings begin after Week 1')
            : stat(lg.name.replace(/^(Class|Division) \S+ /, ''), u.rec.lw + u.rec.ll ? U.ordinal(lgStand.indexOf(u) + 1) : '—', u.rec.lw + u.rec.ll ? 'of ' + lgStand.length + ' in the ' + World.leagueWord(u.state).toLowerCase() : World.leagueWord(u.state) + ' games come late in the season'),
          h('div', { class: 'card tight stat', style: { cursor: 'pointer' }, onclick: () => Win.rankings() }, h('div', { class: 'k' }, 'Team Rankings · ' + st.rankings.snaps[st.rankings.snaps.length - 1].label),
            h('div', { class: 'v' }, '#' + sta.rank + ' ', h('span', { class: 'small muted', style: { fontWeight: 500 } }, World.stateName(u.state)), ' ', FNG.RecruitView.moveTag(sta.prev ? sta.move : 0)),
            h('div', { class: 's' }, '#' + nat.rank + ' national · #' + dvr.rank + ' in ' + World.divShort(u))),
          h('div', { class: 'card tight stat' }, h('div', { class: 'k' }, 'Varsity Overall'), h('div', { class: 'v row', style: { gap: '8px' } }, ovrChip(Team.teamOverall(ratings)), h('span', { class: 'small ' + (st.program.funds < 0 ? 'bad-t' : 'muted'), style: { fontWeight: 500 } }, U.money(st.program.funds) + ' funds')), h('div', { class: 's' }, 'Prestige ' + u.prestige + '/100'))));

        const focus = select(Object.entries(Season.FOCUS).map(([value, label]) => ({ value, label })), st.program.focus, (v) => {
          st.program.focus = v;
          App.changed();
        });
        const program = h('div', { class: 'card' },
          h('div', { class: 'row between' }, h('h3', { class: 'sect', style: { margin: 0 } }, 'Program · ' + st.roster.length + ' players'), h('button', { type: 'button', class: 'btn sm ghost', onclick: () => Win.roster() }, 'Roster')),
          h('div', { class: 'grid c3', style: { marginTop: '10px' } },
            h('div', null, h('div', { class: 'tiny muted bold' }, 'VARSITY'), h('div', { class: 'bold' }, u.rec.w + '-' + u.rec.l), h('div', { class: 'small muted' }, levels.V + ' players')),
            h('div', null, h('div', { class: 'tiny muted bold' }, 'JUNIOR VARSITY'), h('div', { class: 'bold' }, st.lower.JV.w + '-' + st.lower.JV.l), h('div', { class: 'small muted' }, levels.JV + ' players')),
            h('div', null, h('div', { class: 'tiny muted bold' }, 'FRESHMAN'), h('div', { class: 'bold' }, st.lower.FR.w + '-' + st.lower.FR.l), h('div', { class: 'small muted' }, levels.FR + ' players'))),
          h('h3', { class: 'sect mt' }, 'Practice Focus'), focus,
          h('div', { class: 'help' }, {
            balanced: 'Even development across the program.',
            offense: 'Extra reps for throwing, catching and blocking.',
            defense: 'Extra reps for tackling and coverage.',
            conditioning: 'Speed, strength and agility work.',
            film: 'Study this week’s opponent: +1 to every varsity unit on game day.',
          }[st.program.focus]));
        const left = h('div', { class: 'col' }, thisWeekCard(st), program);

        const news = h('ul', { class: 'news' }, st.news.slice(0, 14).map((n) => h('li', { class: 'n-' + n.kind }, h('span', { class: 'when' }, n.week > 16 ? 'Off ' + n.year : (n.week > 10 ? 'P' + (n.week - 10) : 'Wk ' + n.week) + ' ’' + String(n.year).slice(2)), h('span', { class: 'txt' }, n.text))));
        const right = h('div', { class: 'col' },
          h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Team Leaders · ' + st.year), leaders(st)),
          staffCard(st),
          h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Around the Program'), news));
        body.appendChild(h('div', { class: 'grid c2' }, left, right));
      },
    });
  };
})();
