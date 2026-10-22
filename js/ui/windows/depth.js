/* Depth chart editor. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { Team, Players } = FNG;
  const { h, ovrChip, toast } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const SECTION_LABEL = { offense: 'Offense', defense: 'Defense', special: 'Special Teams' };

  function setSlot(st, pos, idx, id) {
    const side = Team.SIDE_OF[pos];
    const depth = st.depth;
    const prev = depth[pos][idx];
    // If the player already starts elsewhere on this side, swap them.
    if (side !== 'special') {
      for (const [p2] of Team.SLOTS[side]) {
        const j = depth[p2].indexOf(id);
        if (j >= 0 && !(p2 === pos && j === idx)) depth[p2][j] = prev;
      }
    }
    depth[pos][idx] = id;
    for (const k in depth) depth[k] = depth[k].filter(Boolean);
    st.depth = Team.autoDepth(st.roster, depth);
  }

  Win.depth = function () {
    WM.open('depth', {
      title: 'Depth Chart',
      icon: 'depth',
      render(body) {
        const st = App.state;
        const lineup = Team.resolveLineup(st.roster, st.depth);
        st.depth = lineup.depth;
        const r = Team.unitRatings(lineup, Team.userEffects(st), st.program.facilities);
        const units = ['qb', 'rb', 'wr', 'ol', 'dl', 'lb', 'db', 'k', 'p'];
        body.appendChild(h('div', { class: 'row between mb' },
          h('div', { class: 'row' },
            h('div', { class: 'card tight center' }, h('div', { class: 'tiny muted bold' }, 'TEAM'), ovrChip(Team.teamOverall(r))),
            units.map((k) => h('div', { class: 'card tight center', title: Team.UNIT_LABEL[k] }, h('div', { class: 'tiny muted bold' }, k.toUpperCase()), ovrChip(r[k])))),
          h('button', { type: 'button', class: 'btn primary', onclick: () => {
            st.depth = Team.autoDepth(st.roster);
            App.changed();
            toast('Depth chart rebuilt with your best healthy players.', 'good');
          } }, 'Auto-Fill Best Lineup')));
        if (lineup.twoWay.size) {
          body.appendChild(h('div', { class: 'card tight mb', style: { borderColor: 'rgba(245,158,11,.4)' } }, h('span', { class: 'warn-t bold' }, lineup.twoWay.size + ' two-way starter' + (lineup.twoWay.size > 1 ? 's' : '') + '. '), h('span', { class: 'small muted' }, 'Players starting on both sides of the ball play at about 96% to account for fatigue.')));
        }
        const sorted = {};
        const healthy = Team.eligible(st.roster);
        const offIds = new Set();
        const defIds = new Set();
        for (const [pos] of Team.SLOTS.offense) for (const id of st.depth[pos]) offIds.add(id);
        for (const [pos] of Team.SLOTS.defense) for (const id of st.depth[pos]) defIds.add(id);

        const grid = h('div', { class: 'grid c2', style: { alignItems: 'start' } });
        const rightCol = h('div', { class: 'col' });
        for (const side of ['offense', 'defense', 'special']) {
          const card = h('div', { class: 'card' }, h('h3', { class: 'sect' }, SECTION_LABEL[side]));
          for (const [pos, n] of Team.SLOTS[side]) {
            sorted[pos] = sorted[pos] || healthy.slice().sort((a, b) => Players.ovrAt(b, pos) - Players.ovrAt(a, pos));
            for (let i = 0; i < n; i++) {
              const id = st.depth[pos][i];
              const cur = st.roster.find((p) => p.id === id);
              const sel = h('select', { class: 'select', style: { width: '100%' }, onchange: (e) => { setSlot(st, pos, i, e.target.value); App.changed(); } });
              for (const p of sorted[pos]) {
                sel.appendChild(h('option', { value: p.id, selected: p.id === id }, '#' + p.num + ' ' + Players.shortName(p) + ' · ' + Players.CLASS_NAME[p.year] + ' ' + p.pos + ' · ' + Players.ovrAt(p, pos)));
              }
              const twoWay = side === 'offense' ? defIds.has(id) : side === 'defense' ? offIds.has(id) : false;
              card.appendChild(h('div', { class: 'row nowrap', style: { marginBottom: '6px' } },
                h('span', { class: 'bold small', style: { width: '34px', flex: 'none' } }, pos + (n > 1 ? i + 1 : '')),
                h('div', { class: 'grow' }, sel),
                cur ? ovrChip(Players.ovrAt(cur, pos)) : null,
                twoWay ? h('span', { class: 'tag warn', title: 'Starts on both sides of the ball' }, '2W') : null));
            }
          }
          if (side === 'offense') grid.appendChild(card);
          else rightCol.appendChild(card);
        }
        grid.appendChild(rightCol);
        body.appendChild(grid);
        const injured = st.roster.filter((p) => p.injury > 0 && p.level === 'V');
        if (injured.length) {
          body.appendChild(h('div', { class: 'card mt' }, h('h3', { class: 'sect' }, 'Injured — unavailable'),
            h('div', { class: 'small' }, injured.map((p) => '#' + p.num + ' ' + Players.shortName(p) + ' (' + p.pos + ', ' + p.injury + 'w)').join(' · '))));
        }
        body.appendChild(h('p', { class: 'help' }, 'Only healthy varsity players appear here — move players up from JV or the freshman team in the Roster window. Choosing a player who already starts elsewhere on the same side swaps the two. Injured starters are replaced automatically on game day.'));
      },
    });
  };
})();
