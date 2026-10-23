/* Title screen and the "New Program" setup window. */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { U, Season, World } = FNG;
  const { h, icon, badge, seg, select, toast } = FNG.UI;
  const WM = FNG.WM;
  const App = FNG.App;
  const Win = FNG.Win;

  const PRIMARY = ['#b91c1c', '#c2410c', '#d97706', '#ca8a04', '#15803d', '#0f766e', '#0369a1', '#1d4ed8', '#1e3a8a', '#4338ca', '#6d28d9', '#7e22ce', '#9d174d', '#7f1d1d', '#111827', '#475569'];
  const SECONDARY = ['#ffffff', '#e5e7eb', '#fbbf24', '#d4af37', '#000000', '#9ca3af', '#f97316', '#60a5fa'];

  Win.title = function () {
    WM.open('title', {
      title: 'Friday Night Gridiron',
      icon: 'football',
      narrow: true,
      render(body) {
        const sum = App.saveSummary();
        const box = h('div', { class: 'title-screen' },
          h('div', { class: 'ball-mark' }),
          h('div', { class: 'logo' }, 'FRIDAY NIGHT', h('br'), 'GRIDIRON'),
          h('div', { class: 'sub' }, 'Ohio, Kentucky & Tennessee High School Football'));
        if (!sum && App.hasOldSave()) {
          box.appendChild(h('div', { class: 'card tight mb', style: { textAlign: 'left' } }, h('div', { class: 'small' }, 'Your saved program is from an earlier version of the game and can\u2019t be loaded. Start a new program to play this version.')));
        }
        if (sum) {
          const s = { name: sum.name, isUser: true };
          box.appendChild(h('div', { class: 'card tight', style: { textAlign: 'left', marginBottom: '14px' } },
            h('div', { class: 'row nowrap' }, badge(s, { colors: sum.colors }),
              h('div', { class: 'grow' },
                h('div', { class: 'bold ellipsis' }, sum.name),
                h('div', { class: 'small muted' }, 'Coach ' + sum.coach.name + ' · ' + sum.year + ' · ' + (sum.phase === 'offseason' ? 'Offseason' : sum.phase === 'playoffs' ? 'Playoffs' : 'Week ' + sum.week) + ' · ' + sum.rec.w + '-' + sum.rec.l)))));
          box.appendChild(h('button', { type: 'button', class: 'btn primary lg block', onclick: () => App.loadSaved() }, icon('play', 16), 'Continue'));
        }
        box.appendChild(h('div', { class: 'col mt' },
          h('button', { type: 'button', class: 'btn lg block' + (sum ? '' : ' primary'), onclick: () => Win.setup() }, 'New Program'),
          h('div', { class: 'row', style: { justifyContent: 'center' } },
            h('button', { type: 'button', class: 'btn ghost sm', onclick: () => App.importSave() }, 'Import Save'),
            sum ? h('button', { type: 'button', class: 'btn ghost sm', onclick: async () => {
              if (await WM.confirm('Delete Save', 'Permanently delete the saved ' + sum.name + ' program?', 'Delete', true)) {
                App.deleteSave();
                WM.refresh('title');
              }
            } }, 'Delete Save') : null)));
        body.appendChild(box);
      },
    });
  };

  Win.setup = function () {
    const cityList = () => World.stateData(form.state).cities;
    const form = {
      coach: '',
      state: 'OH',
      city: '',
      name: '',
      type: 'public',
      size: 'auto',
      status: 'average',
      colors: [PRIMARY[7], SECONDARY[0]],
      suggest: 0,
    };
    const existing = new Set(World.baseWorld().schools.map((s) => s.name.toLowerCase()));
    let previewTimer = null;

    WM.open('setup', {
      title: 'New Program',
      icon: 'football',
      root: !App.hasSave(),
      manual: true,
      render(body) {
        const errors = {};
        const left = h('div');
        const right = h('div', { class: 'preview-card' });
        body.appendChild(h('div', { class: 'row between mb' },
          h('div', null, h('h2', { class: 'title' }, 'Build Your Program'), h('div', { class: 'muted small' }, 'Choose where your school is, what it is called, and how it is run.'))));
        body.appendChild(h('div', { class: 'setup' }, left, right));

        const field = (label, control, help, key) => {
          const err = h('div', { class: 'help bad-t', hidden: true });
          errors[key] = err;
          return h('div', { class: 'field' }, h('label', { class: 'label' }, label), control, help ? h('div', { class: 'help' }, help) : null, err);
        };

        // Coach
        const coachInput = h('input', { class: 'input', style: { width: '100%' }, maxlength: 30, placeholder: 'Your name', value: form.coach, oninput: (e) => { form.coach = e.target.value; refreshPreview(); } });
        left.appendChild(field('Head Coach', coachInput, null, 'coach'));

        // State + City
        const stateSel = select(FNG.DATA.states.map((s) => ({ value: s.abbr, label: s.name + (s.playable ? '' : ' — coming soon'), disabled: !s.playable })), form.state, (v) => {
          form.state = v;
          form.city = '';
          cityInput.value = '';
          cityInput.placeholder = 'Search ' + World.stateName(v) + ' cities and towns…';
          cityNote.textContent = cityList().length + ' ' + World.stateName(v) + ' communities available.';
          refreshPreview();
        });
        stateSel.style.width = '100%';
        const cityInput = h('input', { class: 'input', style: { width: '100%' }, placeholder: 'Search Ohio cities and towns…', autocomplete: 'off', 'aria-autocomplete': 'list' });
        const list = h('div', { class: 'combo-list', hidden: true, role: 'listbox' });
        const cityNote = h('div', { class: 'help' }, cityList().length + ' Ohio communities available.');
        let hl = -1;
        let matches = [];
        const showList = () => {
          const q = cityInput.value.trim().toLowerCase();
          matches = cityList()
            .filter((c) => !q || c.name.toLowerCase().includes(q) || c.county.toLowerCase().startsWith(q))
            .sort((a, b) => (a.name.toLowerCase().startsWith(q) ? 0 : 1) - (b.name.toLowerCase().startsWith(q) ? 0 : 1) || b.pop - a.pop)
            .slice(0, 60);
          list.replaceChildren(...matches.map((c, i) => h('button', { type: 'button', class: i === hl ? 'hl' : '', onmousedown: (e) => { e.preventDefault(); chooseCity(c); } },
            h('span', null, c.name), h('span', { class: 'muted' }, c.county + ' County'))));
          if (!matches.length) list.replaceChildren(h('div', { class: 'empty small' }, 'No ' + World.stateName(form.state) + ' community matches.'));
          list.hidden = false;
        };
        const chooseCity = (c) => {
          form.city = c.name;
          cityInput.value = c.name;
          list.hidden = true;
          cityNote.textContent = c.name + ' — ' + c.county + ' County · population ~' + U.num(c.pop);
          if (!form.name) suggest();
          refreshPreview();
        };
        cityInput.addEventListener('focus', showList);
        cityInput.addEventListener('input', () => {
          hl = -1;
          form.city = '';
          showList();
          refreshPreview();
        });
        cityInput.addEventListener('blur', () => setTimeout(() => (list.hidden = true), 120));
        cityInput.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            hl = U.clamp(hl + (e.key === 'ArrowDown' ? 1 : -1), 0, matches.length - 1);
            showList();
            const el = list.children[hl];
            if (el) el.scrollIntoView({ block: 'nearest' });
          } else if (e.key === 'Enter' && matches.length) {
            e.preventDefault();
            chooseCity(matches[Math.max(0, hl)]);
          }
        });
        left.appendChild(h('div', { class: 'grid c2' },
          field('State', stateSel, 'Ohio, Kentucky and Tennessee are playable. More states are on the way.', 'state'),
          field('City', h('div', { class: 'combo' }, cityInput, list), null, 'city')));
        left.lastChild.lastChild.appendChild(cityNote);

        // Name
        const nameInput = h('input', { class: 'input grow', maxlength: 40, placeholder: 'e.g. ' + 'Riverside Central', value: form.name, oninput: (e) => { form.name = e.target.value; refreshPreview(); } });
        const suggest = () => {
          if (!form.city) {
            toast('Pick a city first so the name fits the area.', 'warn');
            return;
          }
          for (let i = 0; i < 30; i++) {
            form.suggest++;
            const n = World.suggestName(form.state, form.city, form.type, form.suggest);
            if (n && !existing.has(n.toLowerCase())) {
              form.name = n;
              nameInput.value = n;
              break;
            }
          }
          refreshPreview();
        };
        left.appendChild(field('School Name', h('div', { class: 'row nowrap' }, nameInput, h('button', { type: 'button', class: 'btn', onclick: suggest, title: 'Suggest a name' }, 'Suggest')), 'Names only — schools in this game have no mascots.', 'name'));

        // Type
        const typeHelp = h('div', { class: 'help' });
        const typeBox = h('div');
        const drawType = () => {
          typeBox.replaceChildren(seg([{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }], form.type, (v) => {
            form.type = v;
            drawType();
            refreshPreview();
          }, 'full'));
          typeHelp.textContent = form.type === 'public'
            ? 'Players come from your district. Smaller budget and rare transfers, but your classification is set by true enrollment.'
            : 'Draws students from a wide area: yearly transfers and a bigger budget.' + (form.state === 'OH' ? ' Ohio\u2019s competitive balance counts your enrollment ×1.3, which can push you up a division.' : '');
        };
        drawType();
        left.appendChild(h('div', { class: 'field' }, h('label', { class: 'label' }, 'School Type'), typeBox, typeHelp));

        // Size + status
        const sizeSel = select([
          { value: 'auto', label: 'Auto (fits the city)' }, { value: 'small', label: 'Small (~240 students)' }, { value: 'medium', label: 'Medium (~600)' },
          { value: 'large', label: 'Large (~1,200)' }, { value: 'xl', label: 'Very Large (~2,100)' },
        ], form.size, (v) => { form.size = v; refreshPreview(); });
        sizeSel.style.width = '100%';
        const statusBox = h('div');
        const drawStatus = () => statusBox.replaceChildren(seg([{ value: 'rebuild', label: 'Rebuilding' }, { value: 'average', label: 'Average' }, { value: 'established', label: 'Established' }], form.status, (v) => {
          form.status = v;
          drawStatus();
          refreshPreview();
        }, 'full'));
        drawStatus();
        left.appendChild(field('Enrollment', sizeSel, 'Sets your division (Ohio) or class (Kentucky, Tennessee). Tennessee private schools of 250+ students play in Division II. Your program will have roughly 100-150 players.', 'size'));
        left.appendChild(field('Program Tradition', statusBox, 'Sets starting talent, prestige and expectations.', 'status'));

        // Colors
        const colorsBox = h('div');
        const drawColors = () => {
          const row = (arr, idx) => h('div', { class: 'swatches' }, arr.map((c) => h('button', {
            type: 'button', class: 'swatch' + (form.colors[idx] === c ? ' on' : ''), style: { background: c }, title: c, 'aria-label': 'Color ' + c,
            onclick: () => { form.colors[idx] = c; drawColors(); refreshPreview(); },
          })));
          colorsBox.replaceChildren(h('div', { class: 'small muted', style: { margin: '0 0 6px' } }, 'Primary'), row(PRIMARY, 0), h('div', { class: 'small muted', style: { margin: '10px 0 6px' } }, 'Secondary'), row(SECONDARY, 1));
        };
        drawColors();
        left.appendChild(h('div', { class: 'field' }, h('label', { class: 'label' }, 'School Colors'), colorsBox));

        // Preview
        const validate = () => {
          const out = {};
          if (!form.coach.trim()) out.coach = 'Enter your name.';
          if (!form.city) out.city = 'Choose a city from the list.';
          const n = form.name.trim();
          if (!n) out.name = 'Name your school.';
          else if (n.length < 3) out.name = 'That name is too short.';
          else if (existing.has(n.toLowerCase())) out.name = 'A school named "' + n + '" already exists.';
          return out;
        };

        const drawPreview = () => {
          App.applyTheme(form.colors);
          const errs = validate();
          for (const k in errors) {
            errors[k].hidden = true;
          }
          right.replaceChildren();
          const fake = { name: form.name.trim() || 'Your School', isUser: true };
          const card = h('div', { class: 'card accent' });
          card.appendChild(h('div', { class: 'row nowrap mb' }, badge(fake, { colors: form.colors }, 'lg'),
            h('div', { class: 'grow' },
              h('div', { style: { fontSize: '20px', fontWeight: 800, lineHeight: 1.15 } }, fake.name),
              h('div', { class: 'muted small' }, (form.city || 'City') + ', ' + World.stateName(form.state) + ' · ' + (form.type === 'public' ? 'Public' : 'Private')),
              form.coach.trim() ? h('div', { class: 'small' }, 'Head Coach ' + form.coach.trim()) : null)));
          if (form.city) {
            const pv = Season.preview(form);
            const s = pv.school;
            const oh = s.state === 'OH';
            card.appendChild(h('dl', { class: 'kv' },
              h('dt', null, 'County'), h('dd', null, s.county),
              h('dt', null, 'Enrollment'), h('dd', null, U.num(s.enrollment) + ' students' + (oh && s.type === 'private' ? ' (counts as ' + U.num(World.adjustedEnrollment(s)) + ')' : '')),
              h('dt', null, 'Program'), h('dd', null, '~' + FNG.Players.programTarget(s.enrollment) + ' players (varsity, JV, freshman)'),
              h('dt', null, oh ? 'Division' : 'Class'), h('dd', null, World.divLabel(s) + (oh ? '' : ' (' + pv.groupSize + ' schools)')),
              oh ? h('dt', null, 'Region') : null, oh ? h('dd', null, 'Region ' + s.region + ' · ' + World.regionName(s.region) + ' (' + pv.groupSize + ' schools)') : null,
              h('dt', null, World.leagueWord(s.state)), h('dd', null, pv.league),
              h('dt', null, 'Playoffs'), h('dd', null, oh ? 'OHSAA format: top 16 per region' : (s.state === 'KY' ? 'KHSAA' : 'TSSAA') + ' format not in the game yet')));
            card.appendChild(h('h3', { class: 'sect mt' }, World.leagueWord(s.state) + ' Opponents'));
            card.appendChild(h('div', { class: 'small', style: { lineHeight: 1.7 } }, pv.leagueMates.map((x) => x.name + ' (' + x.city + ')').join(' · ')));
            if (pv.sameCity.length) {
              card.appendChild(h('h3', { class: 'sect mt' }, 'Also in ' + form.city));
              card.appendChild(h('div', { class: 'small', style: { lineHeight: 1.7 } }, pv.sameCity.map((x) => x.name + (x.type === 'private' ? ' (private)' : '')).join(' · ')));
            }
            card.appendChild(h('h3', { class: 'sect mt' }, 'Nearby'));
            card.appendChild(h('div', { class: 'small', style: { lineHeight: 1.7 } }, pv.nearby.map((x) => x.name + ' (' + x.city + ')').join(' · ')));
          } else {
            card.appendChild(h('p', { class: 'muted small' }, 'Choose a city to see your classification, league and rivals. Every school is generated the same way each time you play.'));
          }
          right.appendChild(card);
          const start = h('button', { type: 'button', class: 'btn primary lg block mt', onclick: () => begin() }, icon('play', 16), 'Start Program');
          right.appendChild(start);
          const all = World.baseWorld().schools;
          right.appendChild(h('div', { class: 'help center' }, World.STATES.map((k) => U.num(all.filter((x) => x.state === k).length) + ' ' + World.stateName(k)).join(' · ') + ' schools'));
          start.disabled = Object.keys(errs).length > 0;
        };

        const refreshPreview = () => {
          clearTimeout(previewTimer);
          previewTimer = setTimeout(drawPreview, 90);
        };

        const begin = async () => {
          const errs = validate();
          if (Object.keys(errs).length) {
            for (const k in errs) if (errors[k]) {
              errors[k].textContent = errs[k];
              errors[k].hidden = false;
            }
            return;
          }
          if (App.hasSave() && !(await WM.confirm('Replace Save', 'Starting a new program replaces your current saved game. Continue?', 'Start New', true))) return;
          FNG.UI.busy(true, 'Building ' + World.stateName(form.state) + ' and its rivals\u2026', 50);
          setTimeout(() => {
            const st = Season.newGame({ coach: form.coach, state: form.state, city: form.city, name: form.name, type: form.type, size: form.size, status: form.status, colors: form.colors.slice() });
            FNG.UI.busy(false);
            WM.close('setup', true);
            WM.close('title', true);
            App.start(st);
            App.save(true);
            toast('Welcome to ' + Season.user(st).name + ', Coach ' + st.coach.name + '!', 'good', 5000);
          }, 30);
        };

        drawPreview();
        setTimeout(() => coachInput.focus(), 50);
      },
    });
  };
})();
