# Friday Night Gridiron

A high school football program simulator that runs in the browser. You pick a state (Ohio, Pennsylvania, Michigan, Indiana, Kentucky, West Virginia or Tennessee), a city, a school name, and public or private, and how big a world to play in. Then you run the whole program, season after season, against every other school in your world, while 99 colleges recruit your players, who commit, sign, play college and pro football, and can come back to coach for you.

It's plain HTML, CSS and JavaScript with no build step and no dependencies. The only image assets are the college logos in `assets/colleges/`. The interface is a set of full-page screens with a section bar across the top.

## Running it

Open `index.html` in a modern browser. The page works straight from disk (`file://`) or from any static file server:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

The game saves to the browser's `localStorage`. You can also export a save from **Settings** and import it on another device. Saves from the first version of the game can't be loaded. Saves are compressed before they go into browser storage, so even large worlds fit. Saves from the second version onward load and are upgraded automatically: their schools keep the old names, they gain college recruiting and the larger recruit rankings, and states added after a save was made only appear in new programs.

## Features

- **Seven states, one world.** There are 746 Ohio schools, 658 Pennsylvania schools, 657 Michigan schools, 390 Indiana schools, 244 Kentucky schools, 119 West Virginia schools and 321 Tennessee schools, all generated from fixed seeds, so the same schools appear every time. Schools have names only, no mascots, and follow real naming patterns: the town ("Lima"), the county ("Laurel County", "North Laurel"), consolidated districts ("Little Beaver Valley", "Liberty-Benton"), people and neighborhoods for big-city schools ("John Marshall", "Walnut Hills", "Columbus East"), and Catholic, Christian and prep schools. Ohio schools are grouped into OHSAA-style divisions (I–VII), 28 regions and geographic leagues. Kentucky schools are mostly county high schools plus independent districts and privates, sorted into KHSAA classes (1A–6A) and districts. Tennessee has county schools ("Greene County", "North Greene", "Wilson Central"), city systems (Maryville, Alcoa, Kingsport, Johnson City), suburban schools around Nashville, Memphis, Knoxville, Chattanooga and Clarksville, and privates. Tennessee public schools are sorted into TSSAA Classes 1A–6A and regions, and private schools of 250+ students play in Division II (AAA, AA, A). Michigan schools are sorted into eight equal MHSAA-style divisions by enrollment and grouped into conferences, including a Detroit city league and Catholic leagues. West Virginia's county high schools are sorted into Classes AAA, AA and A and grouped into conferences. Pennsylvania (PIAA) and Indiana (IHSAA) schools are sorted into Classes 6A–1A, with 6A holding the largest 70 and 32 schools, and grouped into conferences, including Philadelphia, Pittsburgh, Allentown, Indianapolis, Fort Wayne and South Bend city leagues and Catholic leagues. School names are unique within a state. Schools near the state lines play each other.
- **World size.** A new program picks its world: your state and its neighbors (the default), just your state, or every state. Only the states in your world are generated, scheduled, simulated and recruited, so worlds stay fast as more states are added.
- **Ohio playoffs.** Computer points work like Ohio's system (Level 1 + Level 2, with out-of-state opponents counted at their Ohio-equivalent size). The top 16 in each region make a six-round bracket to a state title in each division. The other states' playoff formats aren't in the game yet, so their seasons end after Week 10 and conference, district (Kentucky) or region (Tennessee) champions are crowned.
- **One-button sims.** Every game in your state is simulated play by play, using each team's actual players and coaching staff, and produces box scores and season statistics. Games elsewhere in your world are resolved from team ratings, with box-score production for each team's starters (both fitted to the play-by-play engine), so out-of-state recruits still earn their rankings on the field while weeks stay quick.
- **The whole program.** You have 100–150 players split across varsity, JV and freshman teams, and you can move players between teams. The freshman team is freshmen only, and JV can't use seniors. Only varsity players can start in varsity games. JV and freshman games are simulated lightly each week. Players develop faster when they play, so stashing a sophomore on the varsity bench has a cost.
- **A career-long rating scale.** A rating of 99 means a Hall of Fame pro, so most high schoolers fall between 15 and 60. Each player has a career ceiling, and graduating seniors get a college outlook (FBS, FCS, Division II, D-III/NAIA), which leaves room to follow players into college and the pros later.
- **Coaching staff.** The staff has 13 jobs: offensive, defensive and special teams coordinators; seven position coaches; strength & conditioning; and JV and freshman head coaches. Each coach has a Teaching rating (player development) and a Game Day rating (game planning). Coordinators also bring a scheme (Air Raid, Flexbone Option, 3-4, Blitz Heavy and others) that shapes play calling, and good coordinators counter the other sideline's calls. You hire, replace and release coaches from a market. Coaches age, improve or decline, retire, and get hired away.
- **Opponents.** Every computer-run school has a real varsity roster built from its own classes. Each roster is rebuilt from seeds instead of being saved, so saves stay small.
- **Recruit rankings.** Every player in all five states is evaluated as a college prospect on ability, career ceiling, size and speed for the position, production this season, and level of competition. The top 4,882 in each graduating class are ranked after every week, with movement since the last update, and stars come from rank: 32 five-stars, 350 four-stars, 2,000 three-stars, 1,500 two-stars and 1,000 one-stars per class. You can filter by class year, state, stars, position, team and offers, page through the list, and open a profile for any prospect.
- **College recruiting.** 99 Big Ten, SEC, ACC, Big 12, Pac-12, American and Mountain West programs plus Notre Dame recruit the players already in the game; there is no separate pool of recruits. Each week every college grades every prospect on overall rating, position, season statistics, recent games, potential, recruit ranking, level of competition and distance from campus, and extends offers. Each college has a prestige rating: high-prestige programs recruit at a higher level, can recruit nationally and draw more interest from top players; lower-prestige programs lean on home-state and nearby players and on developing, productive or overlooked prospects. Each college has a limited number of offers per position in each class, offers can be pulled when a player's stock falls, and every player has an interest level in each school that offered him. Players commit to one of their offering schools during the season (seniors fastest and more often as the year goes on, five-stars last); a committed player only hears from schools above his commitment and can flip when a clearly better offer comes, and a college stops recruiting a position once it has enough commits there. Seniors sign with the school they committed to, or with their favorite offer, at the end of the season. Offers show on every player profile (with interest and the leading school), on each college's recruiting page (its offers by class, the prospects it is evaluating, and its signing classes), in the recruit rankings, rosters, school pages, the news feed for your own players, and the game preview, which lists every player in the game with offers and which colleges made them. Programs below the power conferences (Group of Five, FCS, Division II, Division III/NAIA) still offer and sign players.
- **Team rankings.** Every varsity team has a power rating that updates after every week from wins, losses, margin of victory (capped), strength of schedule and opponent quality, starting from a roster-based preseason rating. Each team gets a national rank (all states in the game, currently Ohio and Kentucky), a state rank and a division/class rank, with movement. You can browse preseason, every weekly ranking, the final ranking, and past seasons' final top 100. Division rankings list every school in the division. Ohio playoff seeding still uses OHSAA computer points.
- **Alumni.** Every player from your school who signs with a college is followed season by season: redshirt, reserve, rotation or starter at his college's level, a season stat line, and All-Conference and All-American honors. The best are drafted (seven rounds, or as undrafted free agents) and play pro football until they decline or age out, with Pro Bowl and All-Pro seasons. When a playing career ends, the alumnus can be hired back onto your coaching staff: his Teaching and Game Day ratings come from his football background and grow with coaching experience, he fits the position coach job for his position (coordinator jobs after three years) plus the support roles, and alumni ask for less to come home.
- **Game previews.** The week's matchup shows both teams' national, state and division ranks, record, division, top-rated recruits, and every player holding power conference offers with the logos of the colleges that offered him.
- **Seasons that keep going.** Each offseason has five steps: season recap, graduation, player development, the incoming class, and staff & budget. Prestige, facilities (weight room, practice fields, film room, stadium, youth program, training room) and staff all carry over from year to year.

## College logos

College logos live in `assets/colleges/`, named by each college's id (`ohio-state.png`, `texas-am.png`, `notre-dame.png`). Only colleges with a logo are in the game; [assets/colleges/README.md](assets/colleges/README.md) lists every college and its file.

## Code layout

```
index.html
css/style.css            Desktop, window and component styles
js/core/util.js          Seeded RNG (mulberry32), hashing, save compression, helpers
js/core/states.js        State registry: every state's generator, classes, labels, leagues, talent and neighbors
js/data/ohio.js          Ohio places (city, county, population, lat/lon) and rivers
js/data/kentucky.js      Kentucky counties, county seats and independent-district towns
js/data/tennessee.js     Tennessee counties, high school towns and metro areas
js/data/michigan.js      Michigan communities with high schools, and rivers
js/data/westvirginia.js  West Virginia counties, high school communities and rivers
js/data/pennsylvania.js  Pennsylvania communities and school districts with high schools, and rivers
js/data/indiana.js       Indiana communities and school districts with high schools, and rivers
js/data/colleges.js      Colleges in the game: conference, campus, colors, prestige, logo
js/data/names.js         Name pools for players, coaches, schools and leagues
js/world/world.js        Deterministic schools, divisions/classes, regions, leagues, conferences, districts and TSSAA regions
js/world/schedule.js     Regular-season scheduling, game dates, weather
js/sim/players.js        Ratings, generation, development, team levels, AI varsity rosters
js/sim/coaches.js        Staff roles, schemes, hiring market and coaching effects
js/sim/recruiting.js     Prospect ratings, production tracking, stars, lower-level offers and signings
js/sim/colleges.js       College recruiting: evaluations, interest, offers, commitments, position needs, signing day
js/sim/alumni.js         Former players' college and pro careers, the draft, and alumni coaching candidates
js/sim/rankings.js       Weekly team power ratings and ranking snapshots
js/sim/team.js           Depth charts, lineups, unit ratings, engine contexts
js/sim/engine.js         Play-by-play game engine and coordinator play calling
js/season.js             Weekly flow, JV/freshman games, standings, Ohio playoffs, offseason
js/ui/dom.js             DOM helpers, icons, tables, toasts
js/ui/wm.js              Screen router (sections, detail screens with Back) and dialogs
js/ui/app.js             App controller, top bar, save/load, theme, week flow
js/ui/setup.js           Title screen and new-program setup
js/ui/windows/*.js       Screens: hub, roster, depth chart, staff, schedule, standings, team rankings,
                         recruits, colleges, alumni, playoffs, schools directory, facilities, history, settings
assets/colleges/         College logos (one per college in the game)
```

## Adding a state

A state is one data file plus one script tag in `index.html`; nothing else in the code names a state. The file lists the state's geography and calls `FNG.States.register({...})` with its config (see `js/core/states.js` for every field):

- `generator`: `'places'` (a list of communities and school districts: City|County|Population|Lat|Lon, like Pennsylvania and Indiana) or `'counties'` (counties plus the communities that hold their high schools, like West Virginia).
- `classes` and `labels`: how many classes or divisions, the largest class's size (`top`), and how they're written (`'A'` for 6A–1A, `'number'`, `'roman'`, or a list like `['AAA', 'AA', 'A']`).
- `leagues`: conferences (geographic, with city and Catholic leagues for big cities) or districts.
- `assoc`, `talent` (football depth vs. Ohio), `depth` (how colleges rate its competition) and `neighbors` (states whose colleges and schools count as nearby).

Add new states after the existing script tags: states generate in registration order, and the seeds of existing states never depend on later ones. Playoffs are Ohio's format only for now (`playoffs: 'ohio'`); other states end after Week 10.
