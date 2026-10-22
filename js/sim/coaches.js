/*
 * Coaching staff: roles, generation, hiring market, yearly changes, and the effects each
 * coach has on game-day ratings, play calling and player development.
 *
 * Every coach has two ratings (1-99): Teaching (player development) and Game Day
 * (game planning). Coordinators also bring a scheme that shapes play calling.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U } = FNG;

  const ROLES = [
    { id: 'oc', title: 'Offensive Coordinator', group: 'Coordinators', units: ['qb', 'rb', 'wr', 'ol'], unitW: 0.05, desc: 'Calls the offense. Game Day boosts every offensive unit and counters the defense\u2019s calls; Teaching helps all offensive players develop.' },
    { id: 'dc', title: 'Defensive Coordinator', group: 'Coordinators', units: ['dl', 'lb', 'db'], unitW: 0.05, desc: 'Calls the defense. Game Day boosts every defensive unit and anticipates the offense; Teaching helps all defenders develop.' },
    { id: 'st', title: 'Special Teams Coordinator', group: 'Coordinators', units: ['k', 'p'], unitW: 0.1, positions: ['K', 'P'], desc: 'Kicking, punting and coverage units.' },
    { id: 'qb', title: 'Quarterbacks Coach', group: 'Position Coaches', units: ['qb'], unitW: 0.025, positions: ['QB'], desc: 'Develops quarterbacks.' },
    { id: 'rb', title: 'Running Backs Coach', group: 'Position Coaches', units: ['rb'], unitW: 0.025, positions: ['RB'], desc: 'Develops running backs.' },
    { id: 'wr', title: 'Receivers Coach', group: 'Position Coaches', units: ['wr'], unitW: 0.025, positions: ['WR', 'TE'], desc: 'Develops wide receivers and tight ends.' },
    { id: 'ol', title: 'Offensive Line Coach', group: 'Position Coaches', units: ['ol'], unitW: 0.025, positions: ['OL'], desc: 'Develops the offensive line.' },
    { id: 'dl', title: 'Defensive Line Coach', group: 'Position Coaches', units: ['dl'], unitW: 0.025, positions: ['DL'], desc: 'Develops the defensive line.' },
    { id: 'lb', title: 'Linebackers Coach', group: 'Position Coaches', units: ['lb'], unitW: 0.025, positions: ['LB'], desc: 'Develops linebackers.' },
    { id: 'db', title: 'Defensive Backs Coach', group: 'Position Coaches', units: ['db'], unitW: 0.025, positions: ['CB', 'S'], desc: 'Develops corners and safeties.' },
    { id: 'sc', title: 'Strength & Conditioning', group: 'Support Staff', units: [], unitW: 0, desc: 'Speed, strength and agility gains for the whole program, and fewer injuries.' },
    { id: 'jv', title: 'JV Head Coach', group: 'Support Staff', units: [], unitW: 0, desc: 'Develops JV players and coaches the JV team on game nights.' },
    { id: 'fr', title: 'Freshman Head Coach', group: 'Support Staff', units: [], unitW: 0, desc: 'Develops freshmen and coaches the freshman team.' },
  ];
  const ROLE = {};
  for (const r of ROLES) ROLE[r.id] = r;

  const OFF_SCHEMES = {
    'Pro Style': { pass: 0.02, option: 0, desc: 'Balanced under-center attack.' },
    Spread: { pass: 0.08, option: 0.6, desc: 'Space the field, quick throws, read option.' },
    'Air Raid': { pass: 0.18, option: -0.5, desc: 'Throw it all over the yard.' },
    'Power Run': { pass: -0.12, option: 0, desc: 'Downhill running behind big linemen.' },
    'Wing-T': { pass: -0.16, option: 1, desc: 'Misdirection and the running game.' },
    'Flexbone Option': { pass: -0.22, option: 2.5, desc: 'Triple option. The QB must be able to run.' },
  };
  const DEF_SCHEMES = {
    '4-3': { base: 2, desc: 'Sound and balanced.' },
    '3-4': { blitz: 1.2, base: 1, desc: 'Pressure from anywhere.' },
    '4-2-5': { nickel: 2, desc: 'Built to stop the spread.' },
    '46 Bear': { run_stop: 2.5, blitz: 0.8, desc: 'Load the box, dare them to throw.' },
    'Cover 2': { nickel: 1, prevent: 0.6, desc: 'Keep everything in front.' },
    'Blitz Heavy': { blitz: 3, desc: 'Live and die with pressure.' },
  };

  const VACANT = { teach: 18, tactics: 18 };

  function ovr(c) {
    return Math.round((c.teach + c.tactics) / 2);
  }

  function salaryFor(c) {
    return Math.round((400 + Math.pow(ovr(c), 2) * 0.9) / 50) * 50;
  }

  function generate(rng, role, quality) {
    const N = FNG.DATA.names;
    const age = rng.int(24, 63);
    const exp = U.clamp((age - 24) / 30, 0, 1);
    const c = {
      id: 'C' + Math.floor(rng.next() * 1e9).toString(36) + Date.now().toString(36).slice(-3),
      role,
      first: rng.pick(N.first),
      last: rng.pick(N.last),
      age,
      teach: Math.round(U.clamp(rng.normal(quality + exp * 6 - 3, 11), 12, 95)),
      tactics: Math.round(U.clamp(rng.normal(quality + exp * 8 - 4, 11), 12, 95)),
      years: 0,
    };
    if (role === 'oc') c.scheme = rng.pick(Object.keys(OFF_SCHEMES));
    if (role === 'dc') c.scheme = rng.pick(Object.keys(DEF_SCHEMES));
    c.salary = salaryFor(c);
    return c;
  }

  function newStaff(rng, prestige) {
    const q = 34 + prestige * 0.3;
    const staff = {};
    for (const r of ROLES) staff[r.id] = generate(rng, r.id, q + (r.group === 'Coordinators' ? 4 : 0));
    return staff;
  }

  // Candidates on the market for a role: refreshed each season, rerolled on request.
  function candidates(role, year, refresh) {
    const rng = new RNG('cand|' + role + '|' + year + '|' + refresh);
    const out = [];
    for (let i = 0; i < 6; i++) out.push(generate(rng, role, rng.weighted([[30, 2], [42, 3], [52, 3], [62, 2], [72, 1]])));
    return out.sort((a, b) => ovr(b) - ovr(a));
  }

  function payroll(staff) {
    let s = 0;
    for (const id in staff) if (staff[id]) s += staff[id].salary;
    return s;
  }

  /*
   * Effects of a staff on a team:
   *  units:   game-day rating bonus per unit (high-school scale)
   *  offIQ/defIQ: chance the coordinator counters the other sideline's call
   *  offStyle/defStyle: scheme play-calling tendencies
   *  dev[pos]: development multiplier per position; jv/fr multipliers; physical growth; injury multiplier
   */
  function effects(staff) {
    const get = (id) => staff[id] || VACANT;
    const units = { qb: 0, rb: 0, wr: 0, ol: 0, dl: 0, lb: 0, db: 0, k: 0, p: 0 };
    for (const r of ROLES) for (const u of r.units) units[u] += (get(r.id).tactics - 50) * r.unitW;
    const dev = {};
    for (const pos of FNG.Players.POSITIONS) {
      const posCoach = ROLES.find((r) => r.positions && r.positions.includes(pos) && r.id !== 'st') || ROLE.st;
      const coord = ['QB', 'RB', 'WR', 'TE', 'OL'].includes(pos) ? get('oc') : ['K', 'P'].includes(pos) ? get('st') : get('dc');
      dev[pos] = 0.75 + get(posCoach.id).teach / 200 + (coord.teach - 50) / 400;
    }
    const oc = get('oc');
    const dc = get('dc');
    const sc = get('sc');
    return {
      units,
      offIQ: U.clamp((oc.tactics - 25) / 160, 0, 0.45),
      defIQ: U.clamp((dc.tactics - 25) / 160, 0, 0.45),
      offStyle: OFF_SCHEMES[oc.scheme] || OFF_SCHEMES['Pro Style'],
      defStyle: DEF_SCHEMES[dc.scheme] || DEF_SCHEMES['4-3'],
      dev,
      jv: 0.75 + get('jv').teach / 200,
      fr: 0.75 + get('fr').teach / 200,
      jvGame: (get('jv').tactics - 50) * 0.06,
      frGame: (get('fr').tactics - 50) * 0.06,
      physical: (sc.teach - 50) / 30,
      injury: U.clamp(1.2 - sc.teach / 250, 0.8, 1.2),
    };
  }

  // AI programs: one staff-quality number per school drives the same effects.
  function aiEffects(school) {
    const q = school.staffQ || 50;
    const rng = new RNG('aistaff|' + school.id);
    const coach = (role) => ({ teach: q, tactics: q, scheme: role === 'oc' ? rng.pick(Object.keys(OFF_SCHEMES)) : role === 'dc' ? rng.pick(Object.keys(DEF_SCHEMES)) : null });
    const staff = {};
    for (const r of ROLES) staff[r.id] = coach(r.id);
    return effects(staff);
  }

  // Yearly staff changes: aging, improvement or decline, retirements and coaches hired away.
  function offseason(staff, rng) {
    const changes = [];
    for (const id in staff) {
      const c = staff[id];
      if (!c) continue;
      c.age++;
      c.years++;
      const drift = c.age < 40 ? rng.normal(1.6, 1.4) : c.age < 56 ? rng.normal(0.4, 1.1) : rng.normal(-1.2, 1.2);
      c.teach = Math.round(U.clamp(c.teach + drift + rng.normal(0, 0.8), 10, 97));
      c.tactics = Math.round(U.clamp(c.tactics + drift + rng.normal(0, 0.8), 10, 97));
      const name = c.first + ' ' + c.last;
      if ((c.age >= 64 && rng.chance(0.35)) || c.age >= 70) {
        staff[id] = null;
        changes.push({ role: id, name, why: 'retired' });
      } else if (ovr(c) >= 66 && rng.chance((ovr(c) - 60) * 0.02)) {
        staff[id] = null;
        changes.push({ role: id, name, why: id === 'oc' || id === 'dc' ? 'was hired as a head coach elsewhere' : 'took a coordinator job at another school' });
      } else {
        // Raises follow ability.
        c.salary = Math.max(c.salary, salaryFor(c));
      }
    }
    return changes;
  }

  FNG.Coaches = { ROLES, ROLE, OFF_SCHEMES, DEF_SCHEMES, ovr, salaryFor, generate, newStaff, candidates, payroll, effects, aiEffects, offseason };
})();
