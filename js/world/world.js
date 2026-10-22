/*
 * Deterministic world generation for Ohio.
 * Every school name, location, enrollment, division, region and league is derived from fixed
 * seeds, so the generated state is identical on every load and every new game.
 */
(function () {
  'use strict';
  const FNG = window.FNG;
  const { RNG, U } = FNG;

  const SEED = 'FNG-OHIO-v1';
  const REGION_NAMES = ['Northeast', 'Southeast', 'Southwest', 'Northwest'];

  function nearestRivers(D, lat, lon, n) {
    return D.rivers
      .map((r) => ({ r, d: U.distKm({ lat, lon }, r) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, n)
      .map((x) => x.r);
  }

  function valleyName(river) {
    return /Valley$/.test(river) ? river : river + ' Valley';
  }

  /* ------------------------------------------------------------------ */
  /* Name makers                                                         */
  /* ------------------------------------------------------------------ */
  function makeNamers(D) {
    const N = FNG.DATA.names;

    // Realistic place-style names: "Walnut Hills", "Oak Grove", "Fern Creek".
    const compound = (r) => {
      const kind = r.weighted({ list: 4, tree: 3, creek: 1.5 });
      if (kind === 'list') return r.pick(N.places);
      if (kind === 'tree') return r.pick(N.trees) + ' ' + r.pick(N.features);
      return r.pick(N.creeks) + ' Creek';
    };

    const local = (r, c) => {
      const kind = r.weighted({ river: 3, dirCounty: 2, ern: 0.8, hyphen: 2, compound: 2, tri: 0.5, countyErn: 0.8, riverNoun: 0.8 });
      switch (kind) {
        case 'river':
          return valleyName(r.pick(nearestRivers(D, c.lat, c.lon, 3)).name);
        case 'dirCounty':
          return r.pick(N.dirShort) + ' ' + c.county;
        case 'ern':
          return r.pick(N.dirErn);
        case 'hyphen': {
          const a = r.pick(N.townships);
          let b = r.pick(N.townships);
          if (a === b) b = r.pick(N.townships);
          return a === b ? null : a + '-' + b;
        }
        case 'compound':
          return compound(r);
        case 'tri':
          return 'Tri-' + r.pick(N.tri);
        case 'countyErn':
          return c.county + ' ' + r.pick(N.dirErn);
        default:
          return r.pick(nearestRivers(D, c.lat, c.lon, 3)).name.replace(/ (River|Creek|Valley)$/, '') + ' ' + r.pick(['Ridge', 'Heights', 'Highlands']);
      }
    };

    const bigCity = (r, c) => {
      const kind = r.weighted({ dir: 2, historic: 3, full: 2.5, compound: 3, tech: 0.5 });
      if (kind === 'dir') return c.name + ' ' + r.pick(N.dirs);
      if (kind === 'historic') return r.pick(N.historic);
      if (kind === 'full') return r.pick(N.fullNames);
      if (kind === 'compound') return r.chance(0.6) ? r.pick(N.urban) : r.chance(0.5) ? r.pick(N.creeks) + ' Creek' : compound(r);
      return r.pick(['East', 'West', 'North', 'South', 'Central']) + ' Tech';
    };

    const catholic = (r, c) => {
      const kind = r.weighted({ saint: 4, city: 1.5, bishop: 2, arch: 1, cardinal: 1, father: 0.5, lady: 1, holy: 1, dir: 0.8 });
      switch (kind) {
        case 'saint':
          return 'St. ' + r.pick(N.saints);
        case 'city':
          return c.name + ' Catholic';
        case 'bishop':
          return 'Bishop ' + r.pick(N.clergy);
        case 'arch':
          return 'Archbishop ' + r.pick(N.clergy);
        case 'cardinal':
          return 'Cardinal ' + r.pick(N.clergy);
        case 'father':
          return 'Father ' + r.pick(N.clergy);
        case 'lady':
          return 'Our Lady of ' + r.pick(N.ourLady);
        case 'holy':
          return 'Holy ' + r.pick(N.holy);
        default:
          return r.pick(['Central', 'North', 'South', 'East', 'West']) + ' Catholic';
      }
    };

    const christian = (r, c) => {
      const kind = r.weighted({ city: 2, word: 2.5, academy: 2.5, lutheran: 0.7 });
      if (kind === 'city') return c.name + ' Christian';
      if (kind === 'word') return r.pick(N.christian) + ' Christian';
      if (kind === 'academy') return r.pick(N.christian) + ' Christian Academy';
      return r.chance(0.5) ? c.name + ' Lutheran' : 'Lutheran ' + r.pick(N.dirs);
    };

    const prep = (r, c) => {
      const kind = r.weighted({ academy: 2, prep: 1, cd: 1, school: 0.5 });
      if (kind === 'cd') return c.name + ' Country Day';
      const base = r.chance(0.6) ? r.pick(N.historic) : compound(r);
      if (kind === 'academy') return base + ' Academy';
      if (kind === 'prep') return base + ' Preparatory';
      return base + ' School';
    };

    return { compound, local, bigCity, catholic, christian, prep };
  }

  /* ------------------------------------------------------------------ */
  /* Schools                                                             */
  /* ------------------------------------------------------------------ */
  function generateOhio(D, used) {
    const namers = makeNamers(D);
    const reserved = new Set(D.cities.map((c) => c.name.toLowerCase()));
    const schools = [];

    const isFree = (name) => name && !used.has(name.toLowerCase()) && !reserved.has(name.toLowerCase());
    const tryName = (r, maker, tries = 80) => {
      for (let i = 0; i < tries; i++) {
        const n = maker(r);
        if (isFree(n)) return n;
      }
      return null;
    };
    const add = (o) => {
      o.id = 'OH' + String(schools.length + 1).padStart(4, '0');
      o.state = 'OH';
      used.add(o.name.toLowerCase());
      schools.push(o);
      return o;
    };

    const publicEnroll = (r, c, nPublic, isLocal) => {
      let base;
      if (c.pop >= 100000) base = (c.pop * 0.024) / nPublic;
      else if (nPublic > 1) base = (c.pop * 0.05) / nPublic + 100;
      else base = c.pop * 0.042 + (isLocal ? 230 : 140);
      return Math.round(U.clamp(base * r.normal(1, 0.15), 95, 3000));
    };

    for (const c of D.cities) {
      const r = new RNG(SEED + '|city|' + c.name);

      // Public schools
      let nPublic = 1;
      if (c.pop >= 100000) nPublic = Math.round(Math.sqrt(c.pop / 5000));
      else if (c.pop >= 45000) nPublic = r.chance(0.55) ? 2 : 1;
      const spread = c.pop >= 100000 ? 0.09 : 0.03;

      for (let i = 0; i < nPublic; i++) {
        let name = null;
        let isLocal = false;
        if (c.pop >= 100000) {
          name = tryName(r, (rr) => namers.bigCity(rr, c));
        } else if (i === 0) {
          if (c.pop < 6000 && r.chance(0.4)) {
            name = tryName(r, (rr) => namers.local(rr, c));
            isLocal = !!name;
          }
          if (!name && !used.has(c.name.toLowerCase())) name = c.name;
        } else {
          name = tryName(r, (rr) => (rr.chance(0.5) ? c.name + ' ' + rr.pick(FNG.DATA.names.dirs) : namers.compound(rr)));
        }
        if (!name) name = tryName(r, namers.compound, 200);
        add({
          name,
          city: c.name,
          county: c.county,
          lat: c.lat + r.float(-spread, spread),
          lon: c.lon + r.float(-spread, spread),
          type: 'public',
          kind: 'public',
          enrollment: publicEnroll(r, c, nPublic, isLocal),
        });
      }

      // Private schools
      let nPrivate = 0;
      if (c.pop >= 100000) nPrivate = Math.round(Math.sqrt(c.pop / 12000));
      else if (c.pop >= 20000) nPrivate = r.chance(0.42) ? (r.chance(0.15) ? 2 : 1) : 0;
      else if (c.pop >= 8000) nPrivate = r.chance(0.18) ? 1 : 0;
      else nPrivate = r.chance(0.035) ? 1 : 0;

      for (let i = 0; i < nPrivate; i++) {
        const kind = r.weighted({ catholic: c.pop >= 20000 ? 6 : 4, christian: 3, prep: c.pop >= 40000 ? 1.2 : 0.3 });
        const name = tryName(r, (rr) => namers[kind](rr, c)) || tryName(r, (rr) => namers.christian(rr, c), 200);
        if (!name) continue;
        let enrollment;
        if (kind === 'catholic') enrollment = c.pop >= 100000 ? r.normal(950, 300) : r.normal(450, 180);
        else if (kind === 'christian') enrollment = r.normal(220, 90);
        else enrollment = r.normal(420, 150);
        const lim = kind === 'catholic' ? [180, 1800] : kind === 'christian' ? [90, 500] : [150, 900];
        add({
          name,
          city: c.name,
          county: c.county,
          lat: c.lat + r.float(-spread * 1.5, spread * 1.5),
          lon: c.lon + r.float(-spread * 1.5, spread * 1.5),
          type: 'private',
          kind,
          enrollment: Math.round(U.clamp(enrollment, lim[0], lim[1])),
        });
      }
    }

    // Consolidated rural districts in thinly-listed counties.
    const byCounty = {};
    for (const c of D.cities) (byCounty[c.county] = byCounty[c.county] || []).push(c);
    for (const county of Object.keys(byCounty).sort()) {
      const places = byCounty[county];
      const r = new RNG(SEED + '|county|' + county);
      const extra = places.length <= 2 ? 2 : places.length <= 4 ? 1 : r.chance(0.25) ? 1 : 0;
      const clat = U.avg(places.map((p) => p.lat));
      const clon = U.avg(places.map((p) => p.lon));
      for (let i = 0; i < extra; i++) {
        const lat = clat + r.float(-0.15, 0.15);
        const lon = clon + r.float(-0.18, 0.18);
        const near = places.slice().sort((a, b) => U.distKm({ lat, lon }, a) - U.distKm({ lat, lon }, b))[0];
        const name = tryName(r, (rr) => namers.local(rr, { name: near.name, county, lat, lon }));
        if (!name) continue;
        add({
          name,
          city: near.name,
          county,
          lat,
          lon,
          type: 'public',
          kind: 'public',
          enrollment: Math.round(U.clamp(r.normal(420, 120), 200, 750)),
        });
      }
    }

    assignPrestige(schools);
    return schools;
  }

  // Program tradition (prestige), seeded per school so it never changes.
  function assignPrestige(schools) {
    for (const s of schools) {
      const r = new RNG(SEED + '|prestige|' + s.id);
      let p = r.normal(45, 15);
      if (s.enrollment > 1500) p += 5;
      if (s.enrollment < 200) p -= 6;
      if (s.kind === 'catholic' && s.enrollment > 700) p += 9;
      if (s.kind === 'christian') p -= 6;
      if (r.chance(0.06)) p += 20;
      s.prestige = Math.round(U.clamp(p, 5, 95));
      s.abbr = abbreviate(s.name);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Kentucky: county high schools, independent districts, privates      */
  /* ------------------------------------------------------------------ */
  function generateKentucky(K, used) {
    const namers = makeNamers(FNG.DATA.ohio);
    const N = FNG.DATA.names;
    const schools = [];
    const isFree = (n) => n && !used.has(n.toLowerCase());
    const tryName = (r, maker, tries = 80) => {
      for (let i = 0; i < tries; i++) {
        const n = maker(r);
        if (isFree(n)) return n;
      }
      return null;
    };
    const add = (o) => {
      o.id = 'KY' + String(schools.length + 1).padStart(4, '0');
      o.state = 'KY';
      used.add(o.name.toLowerCase());
      schools.push(o);
    };
    const extra = (r, c) => {
      const kind = r.weighted({ dir: 3, central: 1.2, compound: 2, historic: 1.5 });
      if (kind === 'dir') return r.pick(N.dirShort) + ' ' + c.county;
      if (kind === 'central') return c.county + ' County ' + r.pick(['Central', 'East', 'West', 'North', 'South']);
      if (kind === 'compound') return namers.compound(r);
      return r.pick(N.historic);
    };
    const townName = (r, name) => (isFree(name) ? name : isFree(name + ' Independent') ? name + ' Independent' : tryName(r, namers.compound, 200));

    for (const c of K.counties) {
      const r = new RNG(SEED + '|ky|' + c.county);
      const metro = c.county === 'Jefferson' ? 'Louisville' : c.county === 'Fayette' ? 'Lexington' : null;
      const nPublic = c.pop >= 500000 ? 18 : c.pop >= 250000 ? 6 : c.pop >= 160000 ? 4 : c.pop >= 120000 ? 3 : c.pop >= 60000 ? 2 : 1;
      const spread = metro ? 0.12 : c.pop >= 60000 ? 0.08 : 0.03;
      const seat = { name: c.seat, county: c.county, lat: c.lat, lon: c.lon, pop: c.seatPop };
      for (let i = 0; i < nPublic; i++) {
        let name = null;
        if (metro) name = tryName(r, (rr) => namers.bigCity(rr, { name: metro }));
        else if (i === 0 && isFree(c.county + ' County')) name = c.county + ' County';
        else name = tryName(r, (rr) => extra(rr, c));
        if (!name) name = tryName(r, namers.compound, 200);
        const base = metro ? (c.pop * 0.034) / nPublic : (c.pop * 0.033) / nPublic + 60;
        add({
          name, city: c.seat, county: c.county,
          lat: c.lat + r.float(-spread, spread), lon: c.lon + r.float(-spread, spread),
          type: 'public', kind: 'public',
          enrollment: Math.round(U.clamp(base * r.normal(1, 0.15), 140, 2600)),
        });
      }
      if (K.independentSeats.includes(c.seat)) {
        add({
          name: townName(r, c.seat), city: c.seat, county: c.county,
          lat: c.lat + r.float(-0.02, 0.02), lon: c.lon + r.float(-0.02, 0.02),
          type: 'public', kind: 'public',
          enrollment: Math.round(U.clamp((c.seatPop * 0.035 + 140) * r.normal(1, 0.15), 140, 1600)),
        });
      }
      let nPrivate = metro === 'Louisville' ? 8 : metro === 'Lexington' ? 3 : c.pop >= 90000 ? (r.chance(0.7) ? 1 : 0) + (r.chance(0.25) ? 1 : 0) : c.pop >= 40000 ? (r.chance(0.3) ? 1 : 0) : r.chance(0.04) ? 1 : 0;
      for (let i = 0; i < nPrivate; i++) {
        const kind = r.weighted({ catholic: 6, christian: 3, prep: metro ? 1.2 : 0.3 });
        const where = metro ? Object.assign({}, seat, { name: metro }) : seat;
        const name = tryName(r, (rr) => namers[kind](rr, where)) || tryName(r, (rr) => namers.christian(rr, where), 200);
        if (!name) continue;
        const enr = kind === 'catholic' ? (metro ? r.normal(1000, 300) : r.normal(450, 160)) : kind === 'christian' ? r.normal(240, 90) : r.normal(420, 150);
        add({
          name, city: where.name, county: c.county,
          lat: c.lat + r.float(-spread * 1.3, spread * 1.3), lon: c.lon + r.float(-spread * 1.3, spread * 1.3),
          type: 'private', kind,
          enrollment: Math.round(U.clamp(enr, 100, 1900)),
        });
      }
    }
    for (const t of K.towns) {
      const r = new RNG(SEED + '|kytown|' + t.name);
      add({
        name: townName(r, t.name), city: t.name, county: t.county,
        lat: t.lat + r.float(-0.015, 0.015), lon: t.lon + r.float(-0.015, 0.015),
        type: 'public', kind: 'public',
        enrollment: Math.round(U.clamp((t.pop * 0.04 + 150) * r.normal(1, 0.15), 140, 1700)),
      });
    }
    assignPrestige(schools);
    return schools;
  }

  function abbreviate(name) {
    const words = name
      .replace(/^St\.\s*/, 'Saint ')
      .split(/[\s-]+/)
      .filter((w) => w && !/^(of|the)$/i.test(w));
    if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
    if (words.length === 2) return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
    return words
      .map((w) => w[0])
      .join('')
      .slice(0, 4)
      .toUpperCase();
  }

  /* ------------------------------------------------------------------ */
  /* Divisions & regions (OHSAA-style)                                   */
  /* ------------------------------------------------------------------ */
  // Competitive balance: private schools count more toward division placement.
  function adjustedEnrollment(s) {
    return s.type === 'private' ? Math.round(s.enrollment * 1.3) : s.enrollment;
  }

  function assignDivisions(schools) {
    const sorted = schools.slice().sort((a, b) => adjustedEnrollment(b) - adjustedEnrollment(a) || (a.id < b.id ? -1 : 1));
    const n = sorted.length;
    const d1 = Math.round(n * 0.11);
    const per = (n - d1) / 6;
    sorted.forEach((s, i) => {
      s.division = i < d1 ? 1 : Math.min(7, 2 + Math.floor((i - d1) / per));
    });
  }

  function assignRegions(schools, center) {
    for (let div = 1; div <= 7; div++) {
      const list = schools
        .filter((s) => s.division === div)
        .map((s) => {
          const dy = s.lat - center.lat;
          const dx = (s.lon - center.lon) * Math.cos((center.lat * Math.PI) / 180);
          const ang = (90 - (Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360; // clockwise from north
          return { s, ang };
        })
        .sort((a, b) => a.ang - b.ang || (a.s.id < b.s.id ? -1 : 1));
      const per = list.length / 4;
      list.forEach((x, i) => {
        const idx = Math.min(3, Math.floor(i / per));
        x.s.region = (div - 1) * 4 + idx + 1;
      });
    }
  }

  function regionName(region) {
    return REGION_NAMES[(region - 1) % 4];
  }

  /* ------------------------------------------------------------------ */
  /* Leagues                                                             */
  /* ------------------------------------------------------------------ */
  function compass(D, lat, lon) {
    const dy = lat - D.center.lat;
    const dx = (lon - D.center.lon) * 0.76;
    if (Math.sqrt(dx * dx + dy * dy) < 0.4) return 'Central';
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI; // 0 = east, 90 = north
    const dirs = ['East Central', 'Northeast', 'North Central', 'Northwest', 'West Central', 'Southwest', 'South Central', 'Southeast'];
    return dirs[Math.round(((ang + 360) % 360) / 45) % 8];
  }

  function leagueName(D, members, r, usedNames) {
    const N = FNG.DATA.names;
    const lat = U.avg(members.map((s) => s.lat));
    const lon = U.avg(members.map((s) => s.lon));
    const count = (key) => {
      const m = {};
      for (const s of members) m[s[key]] = (m[s[key]] || 0) + 1;
      return Object.entries(m).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
    };
    const [topCounty, cShare] = count('county');
    const cands = [];
    if (cShare / members.length >= 0.6) {
      cands.push([topCounty + ' County League', 4], [topCounty + ' County Conference', 2]);
    }
    for (const rv of nearestRivers(D, lat, lon, 4)) {
      const v = valleyName(rv.name);
      if (usedNames.has('base:' + v)) continue;
      cands.push([v + ' Conference', 3], [v + ' League', 2], [v + ' Athletic Conference', 1.5]);
    }
    const dir = compass(D, lat, lon);
    cands.push([dir + ' Ohio Conference', 1.5], [dir + ' Ohio Athletic League', 1.5], [dir + ' Ohio League', 1]);
    for (const g of N.leagueGeneric) cands.push([g, 0.15]);
    const open = cands.filter(([n]) => !usedNames.has(n));
    let name = open.length ? r.weighted(open) : null;
    if (!name) name = dir + ' Ohio Conference ' + (usedNames.size + 1);
    usedNames.add(name);
    const valley = name.match(/^(.* Valley) /);
    if (valley) usedNames.add('base:' + valley[1]);
    return name;
  }

  function buildLeagues(D, schools) {
    const r = new RNG(SEED + '|leagues');
    const leagues = [];
    const usedNames = new Set();
    const unassigned = new Set(schools.map((s) => s.id));
    const byId = {};
    for (const s of schools) byId[s.id] = s;

    const make = (members, name, kind, city) => {
      const lg = { id: 'L' + String(leagues.length + 1).padStart(3, '0'), name, kind: kind || 'area', members: members.map((s) => s.id) };
      if (city) lg.city = city;
      if (!name) lg.name = leagueName(D, members, r, usedNames);
      else usedNames.add(name);
      for (const s of members) {
        s.leagueId = lg.id;
        unassigned.delete(s.id);
      }
      leagues.push(lg);
    };

    // Big-city public leagues
    for (const c of D.cities.filter((x) => x.pop >= 100000)) {
      const pubs = schools.filter((s) => s.city === c.name && s.type === 'public' && unassigned.has(s.id));
      if (pubs.length < 4) continue;
      if (pubs.length <= 9) {
        make(pubs, c.name + ' City League', 'city', c.name);
      } else {
        pubs.sort((a, b) => b.lat - a.lat || (a.id < b.id ? -1 : 1));
        const half = Math.ceil(pubs.length / 2);
        make(pubs.slice(0, half), c.name + ' City League North', 'city', c.name);
        make(pubs.slice(half), c.name + ' City League South', 'city', c.name);
      }
    }

    // Metro Catholic leagues
    for (const c of D.cities.filter((x) => x.pop >= 250000)) {
      const pool = schools
        .filter((s) => s.kind === 'catholic' && unassigned.has(s.id) && U.distKm(s, c) < 45 && s.division <= 4)
        .sort((a, b) => U.distKm(a, c) - U.distKm(b, c));
      if (pool.length >= 4) make(pool.slice(0, 8), r.chance(0.5) ? 'Greater ' + c.name + ' Catholic League' : c.name + ' Catholic Conference', 'catholic');
    }

    // Everything else: geographic clusters of similar-sized schools, periphery first.
    while (unassigned.size) {
      const rest = [...unassigned].map((id) => byId[id]).sort((a, b) => (a.id < b.id ? -1 : 1));
      if (rest.length < 5) {
        for (const s of rest) {
          let best = null;
          let bestScore = Infinity;
          for (const lg of leagues) {
            if (lg.members.length >= 10) continue;
            const ms = lg.members.map((id) => byId[id]);
            const score = U.distKm(s, { lat: U.avg(ms.map((m) => m.lat)), lon: U.avg(ms.map((m) => m.lon)) }) + 30 * Math.abs(U.avg(ms.map((m) => m.division)) - s.division);
            if (score < bestScore) {
              bestScore = score;
              best = lg;
            }
          }
          best.members.push(s.id);
          s.leagueId = best.id;
          unassigned.delete(s.id);
        }
        break;
      }
      let seed = rest[0];
      let far = -1;
      for (const s of rest) {
        const d = U.distKm(D.center, s);
        if (d > far) {
          far = d;
          seed = s;
        }
      }
      const size = Math.min(rest.length, r.int(6, 9));
      const scored = rest
        .filter((s) => s !== seed)
        .map((s) => [s, U.distKm(seed, s) + 32 * Math.abs(s.division - seed.division) + (s.type !== seed.type ? 8 : 0)])
        .sort((a, b) => a[1] - b[1]);
      let members = [seed].concat(scored.slice(0, size - 1).map((x) => x[0]));
      if (rest.length - members.length > 0 && rest.length - members.length < 5 && rest.length <= 10) members = rest;
      make(members);
    }
    return leagues;
  }

  /* ------------------------------------------------------------------ */
  /* Kentucky classes (1A-6A) and districts                              */
  /* ------------------------------------------------------------------ */
  // division 1 = Class 6A (largest) ... division 6 = Class 1A
  function kyCutoffs(kySchools) {
    const sorted = kySchools.slice().sort((a, b) => b.enrollment - a.enrollment || (a.id < b.id ? -1 : 1));
    const per = sorted.length / 6;
    const cut = [];
    for (let c = 1; c <= 5; c++) cut.push(sorted[Math.round(c * per) - 1].enrollment);
    return cut; // minimum enrollment for classes 1..5
  }

  function kyClass(enrollment, cut) {
    for (let i = 0; i < cut.length; i++) if (enrollment >= cut[i]) return i + 1;
    return 6;
  }

  function ohioCutoffs(ohSchools) {
    const cut = [];
    for (let d = 1; d <= 6; d++) cut.push(Math.min(...ohSchools.filter((s) => s.division === d).map(adjustedEnrollment)));
    return cut;
  }

  // Ohio-equivalent size tier (1-7), used for cross-state scheduling and Ohio computer points.
  function ohioTier(s, cut) {
    const e = adjustedEnrollment(s);
    for (let i = 0; i < cut.length; i++) if (e >= cut[i]) return i + 1;
    return 7;
  }

  function buildDistricts(K, schools) {
    const r = new RNG(SEED + '|kydistricts');
    const leagues = [];
    for (let cls = 1; cls <= 6; cls++) {
      const groups = [];
      const unassigned = new Set(schools.filter((s) => s.division === cls).map((s) => s.id));
      const byId = {};
      for (const s of schools) byId[s.id] = s;
      while (unassigned.size) {
        const rest = [...unassigned].map((id) => byId[id]).sort((a, b) => (a.id < b.id ? -1 : 1));
        if (rest.length < 3 && groups.length) {
          for (const s of rest) {
            const best = groups.slice().sort((a, b) => U.distKm(s, centroid(a)) - U.distKm(s, centroid(b)))[0];
            best.push(s);
            unassigned.delete(s.id);
          }
          break;
        }
        let seed = rest[0];
        let far = -1;
        for (const s of rest) {
          const d = U.distKm(K.center, s);
          if (d > far) {
            far = d;
            seed = s;
          }
        }
        let size = r.chance(0.45) ? 5 : 4;
        if (rest.length <= 6) size = rest.length;
        else if (rest.length - size < 3) size = Math.ceil(rest.length / 2);
        const members = [seed].concat(rest.filter((s) => s !== seed).sort((a, b) => U.distKm(seed, a) - U.distKm(seed, b)).slice(0, size - 1));
        for (const s of members) unassigned.delete(s.id);
        groups.push(members);
      }
      groups.sort((a, b) => centroid(a).lon - centroid(b).lon);
      groups.forEach((members, i) => {
        const lg = { id: 'K' + String(leagues.length + 1).padStart(3, '0'), name: 'Class ' + (7 - cls) + 'A District ' + (i + 1), kind: 'district', cls, members: members.map((s) => s.id) };
        for (const s of members) s.leagueId = lg.id;
        leagues.push(lg);
      });
    }
    return leagues;
  }

  function centroid(members) {
    return { lat: U.avg(members.map((m) => m.lat)), lon: U.avg(members.map((m) => m.lon)) };
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */
  let cache = null;

  // Base world without the user's school. Pure function of the seed.
  function baseWorld() {
    if (cache) return U.deepClone(cache);
    const D = FNG.DATA.ohio;
    const K = FNG.DATA.kentucky;
    const used = new Set();
    const oh = generateOhio(D, used);
    assignDivisions(oh);
    assignRegions(oh, D.center);
    const ohLeagues = buildLeagues(D, oh);
    const ohCut = ohioCutoffs(oh);
    for (const s of oh) s.tier = s.division;
    const ky = generateKentucky(K, used);
    const kyCut = kyCutoffs(ky);
    for (const s of ky) {
      s.division = kyClass(s.enrollment, kyCut);
      s.tier = ohioTier(s, ohCut);
      s.region = null;
    }
    const kyLeagues = buildDistricts(K, ky);
    cache = { schools: oh.concat(ky), leagues: ohLeagues.concat(kyLeagues), ohCut, kyCut };
    return U.deepClone(cache);
  }

  // Projects where a user school would land (used by the setup preview and new game).
  function placeUserSchool(world, school) {
    world.schools.push(school);
    const byId = {};
    for (const s of world.schools) byId[s.id] = s;
    if (school.state === 'KY') {
      school.division = kyClass(school.enrollment, world.kyCut);
      school.tier = ohioTier(school, world.ohCut);
      school.region = null;
      let best = null;
      let bestScore = Infinity;
      for (const lg of world.leagues) {
        if (lg.kind !== 'district' || lg.cls !== school.division) continue;
        const score = U.distKm(school, centroid(lg.members.map((id) => byId[id]))) + (lg.members.length >= 6 ? 200 : lg.members.length * 6);
        if (score < bestScore) {
          bestScore = score;
          best = lg;
        }
      }
      best.members.push(school.id);
      school.leagueId = best.id;
      return world;
    }
    const D = FNG.DATA.ohio;
    const oh = world.schools.filter((s) => s.state === 'OH');
    assignDivisions(oh);
    assignRegions(oh, D.center);
    for (const s of oh) s.tier = s.division;
    let best = null;
    let bestScore = Infinity;
    for (const lg of world.leagues) {
      if (lg.members.length >= 10 || lg.kind === 'district') continue;
      if (lg.kind === 'city' && !(school.type === 'public' && lg.city === school.city)) continue;
      if (lg.kind === 'catholic' && school.type !== 'private') continue;
      const ms = lg.members.map((id) => byId[id]);
      const centroid = { lat: U.avg(ms.map((m) => m.lat)), lon: U.avg(ms.map((m) => m.lon)) };
      const score = U.distKm(school, centroid) + 30 * Math.abs(U.avg(ms.map((m) => m.division)) - school.division) + (lg.members.length >= 9 ? 15 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = lg;
      }
    }
    best.members.push(school.id);
    school.leagueId = best.id;
    return world;
  }

  function stateData(key) {
    return key === 'KY' ? FNG.DATA.kentucky : FNG.DATA.ohio;
  }

  function suggestName(stateKey, city, type, attempt) {
    const namers = makeNamers(FNG.DATA.ohio);
    const D = stateData(stateKey);
    const c = D.cities.find((x) => x.name === city) || D.cities[0];
    const r = new RNG(SEED + '|suggest|' + stateKey + '|' + city + '|' + type + '|' + attempt);
    if (type === 'private') return namers[r.weighted({ catholic: 5, christian: 3, prep: 2 })](r, c);
    const dir = r.pick(['North', 'South', 'East', 'West', 'Central']);
    if (stateKey === 'KY') return r.pick([dir + ' ' + c.county, c.county + ' County ' + dir, c.name + ' ' + dir, namers.compound(r)]);
    const opts = [c.name + ' ' + dir, namers.local(r, c), namers.compound(r)];
    return r.pick(opts.filter(Boolean));
  }

  // Display helpers shared by both states.
  function divLabel(s) {
    return s.state === 'KY' ? 'Class ' + (7 - s.division) + 'A' : 'Division ' + U.roman(s.division);
  }
  function divShort(s) {
    return s.state === 'KY' ? 7 - s.division + 'A' : 'D-' + U.roman(s.division);
  }
  function groupLabel(s) {
    return s.state === 'KY' ? '' : 'Region ' + s.region + ' (' + regionName(s.region) + ')';
  }
  function stateName(key) {
    return stateData(key).name;
  }

  FNG.World = {
    SEED,
    baseWorld,
    placeUserSchool,
    suggestName,
    abbreviate,
    regionName,
    adjustedEnrollment,
    compass,
    stateData,
    stateName,
    divLabel,
    divShort,
    groupLabel,
  };
})();
