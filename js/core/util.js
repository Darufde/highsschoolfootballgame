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

  /*
   * LZW-style text compression into UTF-16 strings (15 bits per character, offset past control
   * characters and clear of surrogates), so large saves fit in localStorage. Literal characters
   * are sent the first time they appear (code 0: 8-bit, 1: 16-bit), 2 marks the end, and the code
   * width grows as the dictionary does.
   */
  const LZ_BITS = 15;
  const REV8 = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let r = 0;
    for (let b = 0; b < 8; b++) if (i & (1 << b)) r |= 1 << (7 - b);
    REV8[i] = r;
  }
  function lzCompress(input) {
    // Dictionary as a trie: phrase code and next character -> code of the longer phrase. ASCII
    // steps use one numeric-keyed map (fast); anything else falls back to string keys.
    const ascii = new Map();
    const other = new Map();
    const fresh = new Map(); // single-character code -> character, until its literal is sent
    const single = new Map(); // character -> its code
    const out = [];
    let size = 3;
    let bits = 2;
    let enlarge = 2;
    // Values go out least significant bit first, so each one is bit-reversed into the buffer.
    let acc = 0;
    let accBits = 0;
    const put = (value, n) => {
      if (n > 16) {
        put(value & 0xffff, 16);
        put(value >>> 16, n - 16);
        return;
      }
      acc = (acc << n) | (((REV8[value & 255] << 8) | REV8[(value >>> 8) & 255]) >>> (16 - n));
      accBits += n;
      while (accBits >= LZ_BITS) {
        accBits -= LZ_BITS;
        out.push(String.fromCharCode(((acc >>> accBits) & 0x7fff) + 32));
      }
      acc &= (1 << accBits) - 1;
    };
    const grow = () => {
      if (--enlarge === 0) {
        enlarge = 1 << bits;
        bits++;
      }
    };
    const emit = (code) => {
      const ch = fresh.get(code);
      if (ch !== undefined) {
        if (ch < 256) {
          put(0, bits);
          put(ch, 8);
        } else {
          put(1, bits);
          put(ch, 16);
        }
        grow();
        fresh.delete(code);
      } else put(code, bits);
      grow();
    };
    let cur = -1;
    for (let i = 0; i < input.length; i++) {
      const cc = input.charCodeAt(i);
      let one = single.get(cc);
      if (one === undefined) {
        one = size++;
        single.set(cc, one);
        fresh.set(one, cc);
      }
      if (cur < 0) {
        cur = one;
        continue;
      }
      const key = cc < 128 ? cur * 128 + cc : cur + ':' + cc;
      const map = cc < 128 ? ascii : other;
      const next = map.get(key);
      if (next !== undefined) {
        cur = next;
        continue;
      }
      emit(cur);
      map.set(key, size++);
      cur = one;
    }
    if (cur >= 0) emit(cur);
    put(2, bits);
    if (accBits) put(0, LZ_BITS - accBits);
    return out.join('');
  }

  function lzDecompress(data) {
    if (!data) return '';
    let index = 0;
    let val = data.charCodeAt(0) - 32;
    let mask = 1 << (LZ_BITS - 1);
    index = 1;
    const get = (n) => {
      let res = 0;
      for (let p = 0; p < n; p++) {
        if (val & mask) res |= 1 << p;
        mask >>= 1;
        if (mask === 0) {
          mask = 1 << (LZ_BITS - 1);
          val = data.charCodeAt(index++) - 32;
        }
      }
      return res;
    };
    const dict = [0, 1, 2];
    let bits = 2;
    let enlarge = 2;
    const grow = () => {
      if (--enlarge === 0) {
        enlarge = 1 << bits;
        bits++;
      }
    };
    const literal = (code) => String.fromCharCode(get(code === 0 ? 8 : 16));
    let first = get(bits);
    if (first === 2) return '';
    let w = literal(first);
    dict.push(w);
    grow();
    grow();
    const out = [w];
    for (;;) {
      if (index > data.length + 1) return null;
      let code = get(bits);
      if (code === 2) return out.join('');
      let entry;
      if (code === 0 || code === 1) {
        entry = literal(code);
        dict.push(entry);
        code = dict.length - 1;
        grow();
      } else if (code < dict.length) entry = dict[code];
      else if (code === dict.length) entry = w + w.charAt(0);
      else return null;
      out.push(entry);
      dict.push(w + entry.charAt(0));
      grow();
      w = entry;
    }
  }

  FNG.lzCompress = lzCompress;
  FNG.lzDecompress = lzDecompress;
  FNG.hashString = hashString;
  FNG.RNG = RNG;
  FNG.U = U;
})();
