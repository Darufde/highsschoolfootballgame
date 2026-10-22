# Friday Night Gridiron

A high school football program simulator that runs in the browser. You pick a state (Ohio or Kentucky), a city, a school name, and public or private. Then you run the whole program, season after season, against every other school in both states.

It's plain HTML, CSS and JavaScript with no build step, no dependencies and no image assets. The interface is a set of full-page screens with a section bar across the top.

## Running it

Open `index.html` in a modern browser. The page works straight from disk (`file://`) or from any static file server:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

The game saves to the browser's `localStorage`. You can also export a save from **Settings** and import it on another device. Saves from the first version of the game can't be loaded. Saves from the second version load and are upgraded automatically (their schools keep the old names).

## Features

- **Two states, one world.** There are 747 Ohio schools and 244 Kentucky schools, all generated from fixed seeds, so the same schools appear every time. Schools have names only, no mascots, and follow real naming patterns: the town ("Lima"), the county ("Laurel County", "North Laurel"), consolidated districts ("Little Beaver Valley", "Liberty-Benton"), people and neighborhoods for big-city schools ("John Marshall", "Walnut Hills", "Columbus East"), and Catholic, Christian and prep schools. Ohio schools are grouped into OHSAA-style divisions (I–VII), 28 regions and geographic leagues. Kentucky schools are mostly county high schools plus independent districts and privates, sorted into KHSAA classes (1A–6A) and districts. Schools near the state line play each other.
- **Ohio playoffs.** Computer points work like Ohio's system (Level 1 + Level 2, with out-of-state opponents counted at their Ohio-equivalent size). The top 16 in each region make a six-round bracket to a state title in each division. Kentucky's playoff format isn't in the game yet, so Kentucky seasons end after Week 10 and district champions are crowned.
- **One-button sims.** Every game is simulated play by play, using each team's actual players and coaching staff, and produces box scores and season statistics.
- **The whole program.** You have 100–150 players split across varsity, JV and freshman teams, and you can move players between teams. The freshman team is freshmen only, and JV can't use seniors. Only varsity players can start in varsity games. JV and freshman games are simulated lightly each week. Players develop faster when they play, so stashing a sophomore on the varsity bench has a cost.
- **A career-long rating scale.** A rating of 99 means a Hall of Fame pro, so most high schoolers fall between 15 and 60. Each player has a career ceiling, and graduating seniors get a college outlook (FBS, FCS, Division II, D-III/NAIA), which leaves room to follow players into college and the pros later.
- **Coaching staff.** The staff has 13 jobs: offensive, defensive and special teams coordinators; seven position coaches; strength & conditioning; and JV and freshman head coaches. Each coach has a Teaching rating (player development) and a Game Day rating (game planning). Coordinators also bring a scheme (Air Raid, Flexbone Option, 3-4, Blitz Heavy and others) that shapes play calling, and good coordinators counter the other sideline's calls. You hire, replace and release coaches from a market. Coaches age, improve or decline, retire, and get hired away.
- **Opponents.** Every computer-run school has a real varsity roster built from its own classes. Each roster is rebuilt from seeds instead of being saved, so saves stay small.
- **Recruit rankings.** Every player in both states is evaluated as a college prospect on ability, career ceiling, size and speed for the position, production this season, and level of competition. The top 250 in each graduating class are ranked after every week, with movement since the last update. Stars come from rank (5★ top 3, 4★ top 25, 3★ top 100). Ratings drive college offers from Power Conference down to Division III/NAIA, and seniors sign at graduation. You can filter by class year, state, position and team, and open a profile for any prospect.
- **Team rankings.** Every varsity team has a power rating that updates after every week from wins, losses, margin of victory (capped), strength of schedule and opponent quality, starting from a roster-based preseason rating. Each team gets a national rank (all states in the game, currently Ohio and Kentucky), a state rank and a division/class rank, with movement. You can browse preseason, every weekly ranking, the final ranking, and past seasons' final top 100. Division rankings list every school in the division. Ohio playoff seeding still uses OHSAA computer points.
- **Game previews.** The week's matchup shows both teams' national, state and division ranks, record, division, and top-rated recruits.
- **Seasons that keep going.** Each offseason has five steps: season recap, graduation, player development, the incoming class, and staff & budget. Prestige, facilities (weight room, practice fields, film room, stadium, youth program, training room) and staff all carry over from year to year.

## Code layout

```
index.html
css/style.css            Desktop, window and component styles
js/core/util.js          Seeded RNG (mulberry32), hashing, helpers
js/data/ohio.js          Ohio places (city, county, population, lat/lon) and rivers
js/data/kentucky.js      Kentucky counties, county seats and independent-district towns
js/data/names.js         Name pools for players, coaches, schools and leagues
js/world/world.js        Deterministic schools, divisions/classes, regions, leagues and districts
js/world/schedule.js     Regular-season scheduling, game dates, weather
js/sim/players.js        Ratings, generation, development, team levels, AI varsity rosters
js/sim/coaches.js        Staff roles, schemes, hiring market and coaching effects
js/sim/recruiting.js     Prospect ratings, production tracking, stars, offers and signings
js/sim/rankings.js       Weekly team power ratings and ranking snapshots
js/sim/team.js           Depth charts, lineups, unit ratings, engine contexts
js/sim/engine.js         Play-by-play game engine and coordinator play calling
js/season.js             Weekly flow, JV/freshman games, standings, Ohio playoffs, offseason
js/ui/dom.js             DOM helpers, icons, tables, toasts
js/ui/wm.js              Screen router (sections, detail screens with Back) and dialogs
js/ui/app.js             App controller, top bar, save/load, theme, week flow
js/ui/setup.js           Title screen and new-program setup
js/ui/windows/*.js       Screens: hub, roster, depth chart, staff, schedule, standings, team rankings,
                         recruits, playoffs, schools directory, facilities, history, settings
```

To add a state: put a data module next to `js/data/kentucky.js`, generate its schools in `world.js`, and add its playoff format to `season.js`.
