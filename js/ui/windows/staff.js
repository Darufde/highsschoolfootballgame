/* Coaching staff management and the hiring market. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, Coaches } = FNG;
  const { h, ovrChip, table, toast } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const REFRESH_COST = 250;

  function signed(v, digits) {
    const n = Number(v.toFixed(digits || 1));
    return (n > 0 ? '+' : '') + n;
  }

  function effectsSummary(st) {
    const fx = Coaches.effects(st.staff);
    const avg = (keys) => U.avg(keys.map((k) => fx.units[k]));
    const devAvg = U.avg(Object.values(fx.dev));
    return h('div', { class: 'grid c4 mb' },
      FNG.UI.stat('Offense Game Day', signed(avg(['qb', 'rb', 'wr', 'ol'])), 'OC checks into a better play ' + Math.round(fx.offIQ * 100) + '% of snaps'),
      FNG.UI.stat('Defense Game Day', signed(avg(['dl', 'lb', 'db'])), 'DC sniffs out the call ' + Math.round(fx.defIQ * 100) + '% of snaps'),
      FNG.UI.stat('Player Development', '×' + devAvg.toFixed(2), 'JV ×' + fx.jv.toFixed(2) + ' · Freshman ×' + fx.fr.toFixed(2)),
      FNG.UI.stat('Payroll', U.money(Coaches.payroll(st.staff)), 'Funds ' + U.money(st.program.funds)));
  }

  Win.staff = function () {
    WM.open('staff', {
      title: 'Coaching Staff',
      icon: 'staff',
      render(body) {
        const st = App.state;
        body.appendChild(h('p', { class: 'muted small', style: { marginTop: 0 } }, 'You are the head coach. Every assistant has a Teaching rating (player development) and a Game Day rating (game planning). Coordinators also bring a scheme that shapes play calling. Salaries are paid at the start of each season.'));
        body.appendChild(effectsSummary(st));
        for (const group of ['Coordinators', 'Position Coaches', 'Support Staff']) {
          const roles = Coaches.ROLES.filter((r) => r.group === group);
          body.appendChild(h('h3', { class: 'sect mt' }, group));
          body.appendChild(table([
            { key: 'role', label: 'Role', render: (r) => h('div', null, h('div', { class: 'bold' }, r.title), h('div', { class: 'tiny muted', style: { whiteSpace: 'normal', maxWidth: '260px' } }, r.desc)) },
            { key: 'coach', label: 'Coach', render: (r) => { const c = st.staff[r.id]; return c ? h('div', null, c.first + ' ' + c.last, h('div', { class: 'tiny muted' }, 'Age ' + c.age + ' · ' + (c.years ? c.years + ' yr' + (c.years > 1 ? 's' : '') + ' on staff' : 'New hire'))) : h('span', { class: 'tag bad' }, 'Vacant'); } },
            { key: 'teach', label: 'Teaching', render: (r) => (st.staff[r.id] ? ovrChip(st.staff[r.id].teach) : '—'), cls: 'c' },
            { key: 'tac', label: 'Game Day', render: (r) => (st.staff[r.id] ? ovrChip(st.staff[r.id].tactics) : '—'), cls: 'c' },
            { key: 'scheme', label: 'Scheme', render: (r) => (st.staff[r.id] && st.staff[r.id].scheme ? h('span', { class: 'tag info', title: (Coaches.OFF_SCHEMES[st.staff[r.id].scheme] || Coaches.DEF_SCHEMES[st.staff[r.id].scheme]).desc }, st.staff[r.id].scheme) : '') },
            { key: 'sal', label: 'Salary', render: (r) => (st.staff[r.id] ? U.money(st.staff[r.id].salary) : '—'), cls: 'num r' },
            { key: 'act', label: '', render: (r) => h('div', { class: 'row', style: { gap: '4px', justifyContent: 'flex-end' } },
              h('button', { type: 'button', class: 'btn sm' + (st.staff[r.id] ? '' : ' primary'), onclick: () => Win.market(r.id) }, st.staff[r.id] ? 'Replace' : 'Hire'),
              st.staff[r.id] ? h('button', { type: 'button', class: 'btn sm ghost', onclick: async () => {
                const c = st.staff[r.id];
                if (!(await WM.confirm('Release Coach', 'Release ' + r.title + ' ' + c.first + ' ' + c.last + '? The position stays open until you hire someone, and an empty seat hurts the team.', 'Release', true))) return;
                Season.fire(st, r.id);
                App.changed();
              } }, 'Release') : null) },
          ], roles));
        }
      },
    });
  };

  Win.market = function (role) {
    const R = Coaches.ROLE[role];
    WM.open('market:' + role, {
      title: 'Hire · ' + R.title,
      icon: 'staff',
      render(body) {
        const st = App.state;
        const cur = st.staff[role];
        const list = Season.marketFor(st, role);
        body.appendChild(h('div', { class: 'row between mb' },
          h('div', null, h('div', { class: 'bold' }, R.title), h('div', { class: 'small muted' }, cur ? 'Current: ' + cur.first + ' ' + cur.last + ' (Teaching ' + cur.teach + ', Game Day ' + cur.tactics + ')' : 'This position is open.')),
          h('div', { class: 'row' },
            h('span', { class: 'small muted' }, st.phase === 'offseason' ? 'Offseason hires are paid with next season’s payroll.' : 'Mid-season hires cost half a season’s salary now.'),
            h('button', { type: 'button', class: 'btn sm', disabled: st.program.funds < REFRESH_COST, onclick: () => {
              st.program.funds -= REFRESH_COST;
              st.staffRefresh[role] = (st.staffRefresh[role] || 0) + 1;
              App.changed();
            } }, 'New Candidates · ' + U.money(REFRESH_COST)))));
        body.appendChild(table([
          { key: 'n', label: 'Candidate', render: (c) => h('div', null, h('div', { class: 'bold' }, c.first + ' ' + c.last), h('div', { class: 'tiny muted' }, 'Age ' + c.age)) },
          { key: 't', label: 'Teaching', render: (c) => ovrChip(c.teach), cls: 'c' },
          { key: 'g', label: 'Game Day', render: (c) => ovrChip(c.tactics), cls: 'c' },
          { key: 'o', label: 'Overall', render: (c) => ovrChip(Coaches.ovr(c)), cls: 'c' },
          { key: 's', label: 'Scheme', render: (c) => (c.scheme ? h('span', { class: 'tag info', title: (Coaches.OFF_SCHEMES[c.scheme] || Coaches.DEF_SCHEMES[c.scheme]).desc }, c.scheme) : '') },
          { key: 'sal', label: 'Salary', render: (c) => U.money(c.salary), cls: 'num r' },
          { key: 'h', label: '', render: (c) => {
            const cost = Season.hireCost(st, c);
            return h('button', { type: 'button', class: 'btn sm primary', disabled: st.program.funds < cost, onclick: async () => {
              const msg = 'Hire ' + c.first + ' ' + c.last + ' as ' + R.title + ' for ' + U.money(c.salary) + ' per season?' + (cost ? ' ' + U.money(cost) + ' is due now.' : '') + (cur ? ' ' + cur.first + ' ' + cur.last + ' will be released.' : '');
              if (!(await WM.confirm('Hire Coach', msg, 'Hire'))) return;
              if (Season.hire(st, role, c)) {
                toast(c.first + ' ' + c.last + ' is your new ' + R.title + '.', 'good');
                WM.close('market:' + role, true);
                App.changed();
              }
            } }, cost ? 'Hire · ' + U.money(cost) : 'Hire');
          } },
        ], list, { empty: 'No candidates available.' }));
        body.appendChild(h('p', { class: 'help' }, R.desc));
      },
    });
  };
})();
