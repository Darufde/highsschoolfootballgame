# Friday Night Gridiron

An Ohio high school football program simulator that runs in the browser. You pick a city, name your school, choose public or private, and coach it season after season against every other program in the state.

It's plain HTML, CSS and JavaScript with no build step, no dependencies and no image assets. Everything on screen is a window.

## Running it

Open `index.html` in a modern browser. The page works straight from disk (`file://`) or from any static file server:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

The game saves to the browser's `localStorage`. You can also export a save from **Settings** and import it on another device.

## Features

- **Build your program.** Choose your state (Ohio for now), city (from 519 Ohio communities), school name, public or private, enrollment, program tradition and school colors. A live preview shows your division, region, league and nearby rivals.
- **A generated Ohio.** 747 schools are generated from fixed seeds, so the same schools appear every time. Schools have names only (no mascots). Each one gets a city, county, enrollment, tradition and public/private type, and is sorted into OHSAA-style divisions (I–VII), 28 regions and about 100 geographic leagues.
- **Public vs. private.** Private schools get transfers and a bigger budget. Competitive balance counts their enrollment at ×1.3, which can push them up a division.
- **Live games.** You get a scoreboard, a field view, play-by-play, box scores and play calling: 11 offensive calls and 5 defensive fronts, each with its own strengths and counters. You can also hand either side of the ball to your coordinator, or sim a drive or the whole game.
- **NFHS/OHSAA rules.** Quarters are 12 minutes, kickoffs go from the 40, overtime possessions start at the 20, two-point tries are required from the third overtime on, and the clock runs continuously when a team leads by 30+ in the second half.
- **Your roster.** Players have 11 attributes, position ratings, potential, injuries, two-way fatigue, a depth chart editor, and season and career stats.
- **The season.** There's a 10-week regular season with league round robins. Computer points work like Ohio's system (Level 1 + Level 2 points), the top 16 in each region make a six-round playoff, and there's a state poll and league titles.
- **Offseason.** Seniors graduate, players develop, an incoming freshman class (plus transfers) arrives, and the program gets its budget. Facility upgrades (weight room, practice fields, film room, stadium, youth program, training room) affect development, game day and recruiting.

## Code layout

```
index.html
css/style.css            Desktop, window and component styles
js/core/util.js          Seeded RNG (mulberry32), hashing, helpers
js/data/ohio.js          Ohio places (city, county, population, lat/lon) and rivers
js/data/names.js         Name pools for players, schools and leagues
js/world/world.js        Deterministic school, division, region and league generation
js/world/schedule.js     Regular-season scheduling, game dates, weather
js/sim/players.js        Player attributes, ratings, generation, development
js/sim/team.js           Depth charts, lineups, unit ratings, AI program strength
js/sim/engine.js         Play-by-play game engine and AI play calling
js/season.js             Weekly flow, standings, computer points, playoffs, offseason
js/ui/dom.js             DOM helpers, icons, tables, toasts
js/ui/wm.js              Window manager (drag, resize, minimize, maximize, taskbar)
js/ui/app.js             App controller, save/load, theme, week flow
js/ui/setup.js           Title screen and new-program setup
js/ui/windows/*.js       Hub, roster, depth chart, schedule, standings, rankings,
                         playoffs, schools directory, program, history, settings, game
```

Other states can be added later as data modules alongside `js/data/ohio.js`.
