/*
 * State registry. Every playable state's data module registers one config here, and the world,
 * season, recruiting and UI code read states only through it, so adding a state means adding one
 * data file (and its script tag) and nothing else.
 *
 * FNG.States.register({
 *   key: 'PA', name: 'Pennsylvania', assoc: 'PIAA',
 *   data: { cities | counties/towns, center, rivers },   // the state's geography
 *   generator: 'places' | 'counties' | 'kentucky' | 'tennessee',
 *   seedTag: '|pa',             // keeps this state's seeds apart from every other state's
 *   classes: { count: 6, method: 'equal' | 'ohio' | 'tennessee', top: 0 },  // top: size of the largest class
 *   labels: 'A' | 'roman' | 'number' | ['AAA', 'AA', 'A'] | { long(d), short(d) },
 *   leagues: { style: 'conferences' | 'districts', word: 'Conference', prefix, catholicMaxDiv, plan },
 *   regions: false,             // Ohio-style playoff regions inside each division
 *   playoffs: null | 'ohio',    // playoff format in the game, if any
 *   talent: 0,                  // depth of the state's football talent (team strength)
 *   depth: 0,                   // how colleges rate the state's level of competition
 *   neighbors: ['OH', 'NY'],    // states whose colleges count as "nearby" for recruiting
 * })
 *
 * States generate in registration order (school names stay unique across all of them), so keep
 * script order stable once a state ships.
 */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});

  const list = [];
  const byKey = {};

  const LABELS = {
    // Class 6A (largest) ... Class 1A
    A: (n) => ({ long: (d) => 'Class ' + (n + 1 - d) + 'A', short: (d) => n + 1 - d + 'A' }),
    roman: () => ({ long: (d) => 'Division ' + FNG.U.roman(d), short: (d) => 'D-' + FNG.U.roman(d) }),
    number: () => ({ long: (d) => 'Division ' + d, short: (d) => 'D' + d }),
  };

  function labelsFor(cfg) {
    const l = cfg.labels || 'A';
    if (Array.isArray(l)) return { long: (d) => 'Class ' + l[d - 1], short: (d) => l[d - 1] };
    if (typeof l === 'string') return LABELS[l](cfg.classes.count);
    return l;
  }

  function register(cfg) {
    const c = Object.assign({ generator: 'places', seedTag: '|' + cfg.key.toLowerCase(), regions: false, playoffs: null, talent: 0, depth: 0, neighbors: [] }, cfg);
    c.classes = Object.assign({ count: 6, method: 'equal', top: 0 }, cfg.classes);
    c.leagues = Object.assign({ style: 'conferences', word: 'Conference', prefix: 'L' + c.key, catholicMaxDiv: Math.ceil(c.classes.count / 2) }, cfg.leagues);
    c.label = labelsFor(c);
    c.data.key = c.key;
    c.data.name = c.name;
    if (byKey[c.key]) throw new Error('State ' + c.key + ' is registered twice');
    byKey[c.key] = c;
    list.push(c);
    return c;
  }

  FNG.States = {
    register,
    list,
    get: (key) => byKey[key],
    keys: () => list.map((c) => c.key),
    has: (key) => !!byKey[key],
  };
})();
