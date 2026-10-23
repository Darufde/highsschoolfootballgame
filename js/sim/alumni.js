/*
 * Alumni: your graduates who go on to play in college, followed season by season.
 *
 * Each former player develops toward his ceiling, earns a role at his college's level (redshirt,
 * reserve, rotation, starter), puts up a season stat line and can earn All-Conference or
 * All-American honors. After his eligibility (or early, if he is good enough) the best are drafted
 * and play pro football until they decline or age out. When a playing career ends the alumnus can
 * be hired back onto your coaching staff; his coaching ratings come from his football background
 * and grow with experience.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U } = FNG;

  const TIER_LEVEL = { 4: 62, 3: 58, 2: 54, 1: 50 };
  const PRO_TEAMS = [
    'Arizona', 'Atlanta', 'Baltimore', 'Buffalo', 'Carolina', 'Chicago', 'Cincinnati', 'Cleveland', 'Dallas', 'Denver', 'Detroit',
    'Green Bay', 'Houston', 'Indianapolis', 'Jacksonville', 'Kansas City', 'Las Vegas', 'Los Angeles', 'Miami', 'Minnesota',
    'New England', 'New Orleans', 'New York', 'Philadelphia', 'Pittsburgh', 'San Francisco', 'Seattle', 'Tampa Bay', 'Tennessee',
    'Washington',
  ];
  // Draft rounds by pro grade (rating, plus a little for a big-time college).
  const DRAFT_AT = [82, 79, 77, 75, 73.5, 72, 70.5];
  const UDFA_AT = 68.5;
  // Coaching roles each position leads to (support roles are open to everyone).
  const POS_ROLES = {
    QB: ['qb', 'oc'], RB: ['rb', 'oc'], WR: ['wr', 'oc'], TE: ['wr', 'ol', 'oc'], OL: ['ol', 'oc'],
    DL: ['dl', 'dc'], LB: ['lb', 'dc'], CB: ['db', 'dc'], S: ['db', 'dc'], K: ['st'], P: ['st'],
  };
  const SUPPORT_ROLES = ['sc', 'jv', 'fr'];
  const COORD_YEARS = 3; // years of coaching before an alumnus can run an offense or defense
  const MAX_COACH_AGE = 65;

  function rng(a, tag) {
    return new RNG('alum|' + a.id + '|' + tag);
  }

  function age(a, year) {
    return 18 + (year - a.grad);
  }

  // How good a player must be to start at his college.
  function level(a) {
    const c = a.cid && FNG.Colleges.get(a.cid);
    return c ? 60 + c.prestige * 0.12 : TIER_LEVEL[a.tier] || 50;
  }

  function collegeName(a) {
    const c = a.cid && FNG.Colleges.get(a.cid);
    return c ? c.name : a.college;
  }

  // A graduate who signed to play in college. g: the graduation summary; p: the player.
  function create(p, g, school, year) {
    return {
      id: 'AL' + p.id,
      first: p.first,
      last: p.last,
      pos: p.pos,
      grad: year,
      hs: school.name,
      hsHonors: p.honors.slice(),
      stars: g.stars || 0,
      rank: g.rank || 0,
      cid: g.cid || null,
      college: g.college,
      tier: g.tier,
      ovr: Players().ovr(p),
      pot: p.pot,
      status: 'college',
      yr: 0,
      rs: false,
      seasons: [],
      draft: null,
      pro: null,
      retired: null,
      coachFrom: null,
    };
  }

  function Players() {
    return FNG.Players;
  }

  /* Stat lines ---------------------------------------------------------- */
  // Per-game production of a solid starter: [label, per game, decimals].
  const LINES = {
    QB: [['pass yds', 230], ['TD', 1.8], ['INT', 0.7]],
    RB: [['rush yds', 85], ['TD', 0.8]],
    WR: [['rec', 4.5], ['yds', 60], ['TD', 0.45]],
    TE: [['rec', 2.5], ['yds', 28], ['TD', 0.25]],
    DL: [['tkl', 3], ['sacks', 0.6]],
    LB: [['tkl', 6.5], ['sacks', 0.3]],
    CB: [['tkl', 3.5], ['INT', 0.2]],
    S: [['tkl', 5], ['INT', 0.2]],
    K: [['FG', 1.4]],
    P: [['punts', 4]],
  };
  function statLine(r, pos, games, share) {
    if (pos === 'OL') return games + ' games' + (share >= 0.8 ? ', ' + games + ' starts' : '');
    const parts = LINES[pos].map(([label, per]) => {
      const v = Math.max(0, Math.round(per * games * share * r.float(0.8, 1.2)));
      return U.num(v) + ' ' + label;
    });
    return games + ' games · ' + parts.join(' · ');
  }

  /* One season ----------------------------------------------------------- */
  // Plays the season that just ended. Returns notable news lines.
  function playSeason(a, year) {
    const news = [];
    if (a.status === 'college') news.push(...collegeSeason(a, year));
    else if (a.status === 'pro') news.push(...proSeason(a, year));
    return news;
  }

  function grow(a, r, mult) {
    const room = Math.max(0, a.pot - a.ovr);
    a.ovr = Math.round(U.clamp(a.ovr + room * r.float(0.22, 0.4) * mult + r.normal(0.5, 1), 10, Math.max(a.pot + 2, a.ovr)));
  }

  function collegeSeason(a, year) {
    const r = rng(a, year);
    const news = [];
    const L = level(a);
    const name = a.first + ' ' + a.last;
    const d = a.ovr - L;
    let role;
    let games;
    let share;
    if (d >= 3) [role, games, share] = ['Star starter', 12, 1.15];
    else if (d >= -1) [role, games, share] = ['Starter', 12, 1];
    else if (d >= -5) [role, games, share] = ['Rotation', 10, 0.45];
    else if (!a.rs && a.yr === 0) [role, games, share] = ['Redshirt', 4, 0.05];
    else [role, games, share] = ['Reserve', 4, 0.12];
    const honors = [];
    if (role !== 'Redshirt') {
      if (d >= 10 && a.cid) honors.push('All-American');
      if (d >= 6) honors.push('All-Conference');
      else if (a.yr === 0 && d >= 3) honors.push('Freshman All-Conference');
    }
    const scale = U.clamp(1 + d / 20, 0.7, 1.3) * share;
    a.seasons.push({ year, level: 'college', team: collegeName(a), role, line: statLine(r, a.pos, games, scale), honors, ovr: a.ovr, cls: role === 'Redshirt' ? 'RS' : ['FR', 'SO', 'JR', 'SR'][a.yr] });
    if (role === 'Redshirt') a.rs = true;
    else a.yr++;
    if (honors.includes('All-American')) news.push('Former ' + a.hs + ' ' + a.pos + ' ' + name + ' is named an All-American at ' + collegeName(a) + '.');
    grow(a, r, a.cid ? 1.1 : 1);
    // Out of eligibility, or good enough to turn pro after his junior season.
    if (a.yr >= 4 || (a.yr === 3 && a.ovr >= 78)) news.push(...leaveCollege(a, year, r));
    return news;
  }

  function leaveCollege(a, year, r) {
    const name = a.first + ' ' + a.last;
    const grade = a.ovr + (a.cid ? 1 : a.tier >= 4 ? 0 : -2);
    const round = DRAFT_AT.findIndex((x) => grade >= x) + 1;
    if (round > 0) {
      const pick = (round - 1) * 32 + r.int(1, 32);
      a.draft = { year: year + 1, round, pick, team: r.pick(PRO_TEAMS) };
      a.pro = { team: a.draft.team, years: 0 };
      a.status = 'pro';
      return [name + ' (' + a.hs + ' class of ' + a.grad + ') is drafted in round ' + round + ' (pick ' + pick + ') by ' + a.draft.team + '.'];
    }
    if (grade >= UDFA_AT && r.chance(0.5)) {
      a.pro = { team: r.pick(PRO_TEAMS), years: 0, undrafted: true };
      a.status = 'pro';
      return [name + ' signs with ' + a.pro.team + ' as an undrafted free agent.'];
    }
    return retire(a, year, r, 'finished his college career at ' + collegeName(a));
  }

  function proSeason(a, year) {
    const r = rng(a, year);
    const news = [];
    const name = a.first + ' ' + a.last;
    const ag = age(a, year);
    const role = a.ovr >= 85 ? 'Pro starter' : a.ovr >= 78 ? 'Starter' : a.ovr >= 72 ? 'Backup' : 'Practice squad';
    const games = role === 'Practice squad' ? r.int(0, 3) : 17 - r.int(0, 3);
    const share = role === 'Pro starter' ? 1.15 : role === 'Starter' ? 1 : role === 'Backup' ? 0.3 : 0.05;
    const honors = [];
    if (a.ovr >= 92) honors.push('All-Pro');
    if (a.ovr >= 88) honors.push('Pro Bowl');
    a.seasons.push({ year, level: 'pro', team: a.pro.team, role, line: statLine(r, a.pos, games, share * 0.85 * U.clamp(1 + (a.ovr - 80) / 25, 0.6, 1.25)), honors, ovr: a.ovr });
    a.pro.years++;
    if (honors.length) news.push('Former ' + a.hs + ' star ' + name + ' makes the ' + honors[0] + ' team with ' + a.pro.team + '.');
    // Develop through the mid twenties, then decline; most pro careers last a few seasons.
    if (ag <= 25) grow(a, r, 0.6);
    else if (ag <= 28) a.ovr = Math.round(a.ovr + r.normal(-0.3, 1));
    else a.ovr = Math.round(a.ovr - r.float(1.5, 2.5 + (ag - 29) * 0.8));
    const done = ag >= 37 || (a.ovr < 72 && r.chance(0.5)) || (role === 'Practice squad' && a.pro.years >= 2) || (role === 'Backup' && r.chance(0.2)) || (ag >= 28 && r.chance(0.12 + (ag - 28) * 0.08));
    if (done) news.push(...retire(a, year, r, 'retires after ' + a.pro.years + ' pro season' + (a.pro.years > 1 ? 's' : '')));
    else if (r.chance(0.08)) a.pro.team = r.pick(PRO_TEAMS.filter((t) => t !== a.pro.team));
    return news;
  }

  // The end of a playing career; the alumnus can join a staff once he starts coaching.
  function retire(a, year, r, why) {
    a.status = 'retired';
    a.retired = year;
    a.coachFrom = year + 1 + (a.pro ? 0 : r.int(0, 2));
    return [a.first + ' ' + a.last + ' ' + why + '. He can join your coaching staff starting in ' + a.coachFrom + '.'];
  }

  /* Coaching ------------------------------------------------------------ */
  function availableToCoach(a, year) {
    return a.status === 'retired' && !a.coachDone && a.coachFrom != null && year >= a.coachFrom && age(a, year) <= MAX_COACH_AGE && !(a.away && year < a.away);
  }

  // Years of coaching experience by a given season.
  function experience(a, year) {
    return a.coachFrom == null ? 0 : Math.max(0, year - a.coachFrom);
  }

  // Roles he can be hired for this season.
  function roles(a, year) {
    const exp = experience(a, year);
    return (POS_ROLES[a.pos] || []).filter((r) => (r === 'oc' || r === 'dc' ? exp >= COORD_YEARS : true)).concat(SUPPORT_ROLES);
  }

  // His ratings as a coach: football background (level, pro years, honors, position) plus experience.
  function coachRatings(a, year) {
    const r = rng(a, 'coach');
    const aptitude = r.normal(0, 1);
    const levelBonus = a.cid ? 4 : { 4: 2, 3: 0, 2: -1, 1: -2 }[a.tier] || 0;
    const honors = a.seasons.reduce((t, s) => t + s.honors.length, 0) + a.hsHonors.length * 0.3;
    const base = 34 + aptitude * 9 + levelBonus + Math.min(6, (a.pro ? a.pro.years : 0) * 0.8) + Math.min(5, honors * 1.2);
    const exp = Math.min(14, experience(a, year));
    const fade = Math.max(0, age(a, year) - 56) * 1.2;
    const teach = base + exp * 1.3 + r.normal(0, 5) + (a.pos === 'OL' || a.pos === 'LB' ? 2 : 0) - fade;
    const tactics = base + exp * 1.4 + r.normal(0, 5) + (a.pos === 'QB' ? 4 : 0) - fade;
    return { teach: Math.round(U.clamp(teach, 15, 92)), tactics: Math.round(U.clamp(tactics, 15, 92)), rng: r };
  }

  // A hiring-market candidate for one role (alumni ask for a little less to come home).
  function candidate(a, role, year) {
    const C = FNG.Coaches;
    const rt = coachRatings(a, year);
    const c = { id: 'C' + a.id, role, first: a.first, last: a.last, age: age(a, year), teach: rt.teach, tactics: rt.tactics, years: 0, alumId: a.id };
    if (role === 'oc') c.scheme = rt.rng.pick(Object.keys(C.OFF_SCHEMES));
    if (role === 'dc') c.scheme = rt.rng.pick(Object.keys(C.DEF_SCHEMES));
    c.salary = Math.round((C.salaryFor(c) * 0.85) / 50) * 50;
    return c;
  }

  function candidatesFor(alumni, role, year) {
    return alumni.filter((a) => availableToCoach(a, year) && roles(a, year).includes(role)).map((a) => candidate(a, role, year));
  }

  // Where he is now, in a few words.
  function statusLabel(a, year) {
    if (a.status === 'college') return (a.yr === 0 && !a.rs ? 'Incoming freshman' : (a.rs ? 'Redshirt ' : '') + ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Senior'][a.yr]) + ' at ' + collegeName(a);
    if (a.status === 'pro') return 'Pro · ' + a.pro.team;
    if (a.status === 'staff') return 'On your staff';
    if (availableToCoach(a, year)) return 'Available to coach';
    if (a.coachFrom != null && age(a, year) > MAX_COACH_AGE) return 'Retired';
    if (a.away && year < a.away) return 'Coaching elsewhere';
    return 'Retired from playing' + (a.coachFrom ? ' · can coach from ' + a.coachFrom : '');
  }

  FNG.Alumni = { create, playSeason, level, collegeName, age, availableToCoach, roles, coachRatings, candidate, candidatesFor, statusLabel, experience, POS_ROLES };
})();
