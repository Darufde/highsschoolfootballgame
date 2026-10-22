/* Core utilities: seeded RNG, hashing, math and formatting helpers. */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});

  // 32-bit string hash (FNV-1a with an avalanche finish). Stable across browsers.
  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  }

  // Mulberry32 PRNG. Seeded identically => identical sequence, every time.
  class RNG {
    constructor(seed) {
      if (typeof seed === 'string') seed = hashString(seed);
      if (seed === undefined) seed = (Math.random() * 4294967296) >>> 0;
      this.state = seed >>> 0;
    }
    next() {
      this.state = (this.state + 0x6d2b79f5) >>> 0;
      let t = this.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    float(min, max) {
      return min + this.next() * (max - min);
    }
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    }
    chance(p) {
      return this.next() < p;
    }
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    }
    normal(mean, sd) {
      let u = 0;
      let v = 0;
      while (u === 0) u = this.next();
      while (v === 0) v = this.next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    expo(mean) {
      return -mean * Math.log(1 - this.next());
    }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
      }
      return arr;
    }
    // weights: object {key: weight} or array of [item, weight]
    weighted(weights) {
      const entries = Array.isArray(weights) ? weights : Object.entries(weights);
      let total = 0;
      for (const e of entries) total += Math.max(0, e[1]);
      if (total <= 0) return entries[0][0];
      let r = this.next() * total;
      for (const e of entries) {
        r -= Math.max(0, e[1]);
        if (r < 0) return e[0];
      }
      return entries[entries.length - 1][0];
    }
  }

  const U = {
    clamp(v, a, b) {
      return v < a ? a : v > b ? b : v;
    },
    round1(v) {
      return Math.round(v * 10) / 10;
    },
    avg(arr) {
      if (!arr.length) return 0;
      let s = 0;
      for (const v of arr) s += v;
      return s / arr.length;
    },
    distKm(a, b) {
      const toRad = Math.PI / 180;
      const dLat = (b.lat - a.lat) * toRad;
      const dLon = (b.lon - a.lon) * toRad * Math.cos(((a.lat + b.lat) / 2) * toRad);
      return 6371 * Math.sqrt(dLat * dLat + dLon * dLon);
    },
    money(n) {
      const sign = n < 0 ? '-' : '';
      return sign + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
    },
    num(n) {
      return Math.round(n).toLocaleString('en-US');
    },
    ordinal(n) {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },
    roman(n) {
      return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n] || String(n);
    },
    esc(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    clock(sec) {
      sec = Math.max(0, Math.ceil(sec));
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return m + ':' + (s < 10 ? '0' : '') + s;
    },
    record(w, l) {
      return w + '-' + l;
    },
    pct(w, l) {
      const g = w + l;
      return g ? w / g : 0;
    },
    deepClone(o) {
      return JSON.parse(JSON.stringify(o));
    },
    initials(name) {
      return name
        .replace(/^St\.\s*/, 'S ')
        .split(/[\s-]+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 3)
        .toUpperCase();
    },
  };

  FNG.hashString = hashString;
  FNG.RNG = RNG;
  FNG.U = U;
})();
