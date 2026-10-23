/* Alumni: your former players in college and the pros, and hiring them back as coaches. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { Season, Alumni, Coaches, Colleges, Players } = FNG;
  const { h, collegeLogo, table, seg, ovrChip, stars } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'college', label: 'In College' },
    { value: 'pro', label: 'Pros' },
    { value: 'coach', label: 'Available to Coach' },
    { value: 'staff', label: 'On Your Staff' },
  ];

  // The season the hiring market is for (the offseason hires for next season).
  function hireYear(st) {
    return st.phase === 'offseason' ? st.year + 1 : st.year;
  }

  function collegeCell(a) {
    const c = a.cid && Colleges.get(a.cid);
    return c ? h('span', { class: 'row nowrap', style: { gap: '6px' } }, collegeLogo(c, 'sm'), h('button', { type: 'button', class: 'linklike', onclick: (e) => { e.stopPropagation(); Win.college(c.id); } }, c.name)) : h('span', null, a.college);
  }

  function matches(st, a, f) {
    if (f === 'college') return a.status === 'college';
    if (f === 'pro') return a.status === 'pro';
    if (f === 'coach') return Alumni.availableToCoach(a, hireYear(st));
    if (f === 'staff') return a.status === 'staff';
    return true;
  }

  function honorsCount(a) {
    return a.seasons.reduce((t, s) => t + s.honors.length, 0);
  }

  Win.alumni = function () {
    WM.open('alumni', {
      title: 'Alumni',
      icon: 'alumni',
      wide: true,
      state: { f: 'all', sort: { key: 'grad', dir: 'desc' } },
      render(body, w) {
        const st = App.state;
        const S = w.state;
        const all = st.alumni || [];
        body.appendChild(h('p', { class: 'muted small', style: { marginTop: 0 } },
          'Every player from ' + Season.user(st).name + ' who signs to play college football is followed here: his role, stats and honors each season, the pro draft, and his pro career. When his playing days are over he can be hired back onto your coaching staff, and alumni ask for a little less to come home.'));
        body.appendChild(h('div', { class: 'toolbar' }, seg(FILTERS.map((x) => ({ value: x.value, label: x.label + ' (' + all.filter((a) => matches(st, a, x.value)).length + ')' })), S.f, (v) => { S.f = v; WM.refresh(w.id); })));
        const rows = all.filter((a) => matches(st, a, S.f));
        body.appendChild(table([
          { key: 'n', label: 'Player', value: (a) => a.last + a.first, defaultDir: 'asc', render: (a) => h('button', { type: 'button', class: 'linklike bold', onclick: () => Win.alumnus(a.id) }, a.first + ' ' + a.last) },
          { key: 'pos', label: 'Pos', value: (a) => Players.POSITIONS.indexOf(a.pos), render: (a) => a.pos, defaultDir: 'asc' },
          { key: 'grad', label: 'Class', title: 'High school graduating season', value: (a) => a.grad, render: (a) => String(a.grad), cls: 'num' },
          { key: 'col', label: 'College', value: (a) => Alumni.collegeName(a), defaultDir: 'asc', render: collegeCell },
          { key: 'st', label: 'Now', value: (a) => a.status, render: (a) => statusTag(st, a) },
          { key: 'age', label: 'Age', value: (a) => Alumni.age(a, st.year), cls: 'num r' },
          { key: 'ovr', label: 'Ovr', value: (a) => a.ovr, render: (a) => ovrChip(a.ovr), cls: 'c' },
          { key: 'last', label: 'Last Season', value: (a) => (a.seasons.length ? a.seasons[a.seasons.length - 1].year : 0), render: (a) => { const s = a.seasons[a.seasons.length - 1]; return s ? h('span', { class: 'small' }, s.year + ' · ' + s.role + ' · ' + s.line) : h('span', { class: 'dim' }, 'Starts this fall'); }, cls: 'muted' },
          { key: 'hon', label: 'Honors', value: honorsCount, render: (a) => honorsCount(a) || h('span', { class: 'dim' }, '—'), cls: 'num r' },
        ], rows, { sortState: S.sort, onSort: () => WM.refresh(w.id), onRow: (a) => Win.alumnus(a.id), empty: all.length ? 'No alumni match this filter.' : 'No alumni yet. Seniors who sign with a college at graduation show up here.' }));
      },
    });
  };

  function statusTag(st, a) {
    const label = Alumni.statusLabel(a, hireYear(st));
    if (a.status === 'staff') return h('span', { class: 'tag team' }, label);
    if (Alumni.availableToCoach(a, hireYear(st))) return h('span', { class: 'tag good' }, label);
    if (a.status === 'pro') return h('span', { class: 'tag gold' }, label);
    if (a.status === 'college') return h('span', { class: 'tag info' }, label);
    return h('span', { class: 'tag' }, label);
  }

  Win.alumnus = function (id) {
    WM.open('alumnus:' + id, {
      title: 'Alumnus',
      icon: 'alumni',
      render(body, w) {
        const st = App.state;
        const a = Season.alumnus(st, id);
        if (!a) return;
        const name = a.first + ' ' + a.last;
        WM.setTitle(w.id, name);
        const c = a.cid && Colleges.get(a.cid);
        const year = hireYear(st);
        body.appendChild(h('div', { class: 'hero' },
          c ? collegeLogo(c, 'lg') : h('span', { class: 'sbadge lg' }, a.pos),
          h('div', { class: 'grow', style: { position: 'relative', zIndex: 1 } },
            h('div', { class: 'name' }, name),
            h('div', { class: 'meta' }, Players.POS_NAME[a.pos] + ' · ' + a.hs + ' class of ' + a.grad + ' · age ' + Alumni.age(a, st.year)),
            h('div', { class: 'meta' }, Alumni.statusLabel(a, year) + (a.draft ? ' · Drafted ' + a.draft.year + ', round ' + a.draft.round + ' (pick ' + a.draft.pick + ') by ' + a.draft.team : a.pro && a.pro.undrafted ? ' · Undrafted free agent' : ''))),
          h('div', { class: 'center', style: { position: 'relative', zIndex: 1 } }, h('div', { class: 'tiny', style: { color: 'rgba(255,255,255,.75)' } }, 'OVERALL'), h('div', { style: { transform: 'scale(1.5)', marginTop: '8px' } }, ovrChip(a.ovr)))));

        const left = h('div', { class: 'col' });
        left.appendChild(h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Career'),
          h('dl', { class: 'kv' },
            h('dt', null, 'High school'), h('dd', null, a.hs + (a.rank ? ' · #' + a.rank + ' in his class ' : ' · unranked'), a.stars ? stars(a.stars) : null),
            h('dt', null, 'College'), h('dd', null, collegeCell(a), c ? ' · ' + Colleges.confName(c.conf) : ''),
            h('dt', null, 'Ceiling'), h('dd', null, String(a.pot)),
            h('dt', null, 'Honors'), h('dd', { style: { whiteSpace: 'normal' } }, a.seasons.filter((s) => s.honors.length).map((s) => s.year + ' ' + s.honors.join(', ')).concat(a.hsHonors).join(' · ') || '—'))));

        // Coaching: hire him back for any role he fits.
        const coach = h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Coaching'));
        if (a.status === 'staff') {
          coach.appendChild(h('p', { class: 'small' }, 'On your staff as ' + Coaches.ROLE[a.staffRole].title + '.'), h('button', { type: 'button', class: 'btn sm', onclick: () => Win.staff() }, 'Coaching Staff'));
        } else if (Alumni.availableToCoach(a, year)) {
          const rt = Alumni.coachRatings(a, year);
          coach.appendChild(h('div', { class: 'row mb', style: { gap: '10px' } }, h('span', { class: 'small muted' }, 'Teaching'), ovrChip(rt.teach), h('span', { class: 'small muted' }, 'Game Day'), ovrChip(rt.tactics), h('span', { class: 'small muted' }, Alumni.experience(a, year) + ' yrs coaching')));
          coach.appendChild(h('div', { class: 'small muted mb' }, 'He can be hired as:'));
          coach.appendChild(h('div', { class: 'row', style: { gap: '6px', flexWrap: 'wrap' } }, Alumni.roles(a, year).map((role) => h('button', { type: 'button', class: 'btn sm' + (st.staff[role] ? '' : ' primary'), onclick: () => Win.market(role) }, Coaches.ROLE[role].title + (st.staff[role] ? '' : ' (open)')))));
          coach.appendChild(h('div', { class: 'help' }, 'Coordinator jobs open up after three years of coaching. His ratings grow with experience.'));
        } else {
          coach.appendChild(h('p', { class: 'small muted' }, a.status === 'college' || a.status === 'pro' ? 'Still playing. When his playing career ends he can join your staff.' : Alumni.statusLabel(a, year) + '.'));
        }
        left.appendChild(coach);

        const seasons = h('div', { class: 'card' }, h('h3', { class: 'sect' }, 'Season by Season'), table([
          { key: 'y', label: 'Season', render: (s) => h('b', null, s.year) },
          { key: 't', label: 'Team', render: (s) => (s.level === 'college' ? s.team + (s.cls ? ' (' + s.cls + ')' : '') : s.team + ' (pro)') },
          { key: 'r', label: 'Role', render: (s) => s.role },
          { key: 'l', label: 'Stats', render: (s) => h('span', { class: 'small' }, s.line), cls: 'muted' },
          { key: 'o', label: 'Ovr', render: (s) => ovrChip(s.ovr), cls: 'c' },
          { key: 'h', label: 'Honors', render: (s) => (s.honors.length ? h('span', { class: 'tag gold' }, s.honors.join(', ')) : '') },
        ], a.seasons.slice().reverse(), { empty: 'His first college season is this fall.' }));
        body.appendChild(h('div', { class: 'grid c2' }, left, seasons));
      },
    });
  };
})();
