/* Indiana geography: communities with high schools (City|County|Population|Lat|Lon) and rivers used for naming. */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  const RAW = `
Decatur|Adams|9500|40.83|-84.93
Berne|Adams|4000|40.66|-84.95
Monroe|Adams|1000|40.75|-84.94
Fort Wayne|Allen|265000|41.08|-85.14
New Haven|Allen|16000|41.07|-85.01
Leo|Allen|12000|41.22|-85.02
Carroll|Allen|30000|41.17|-85.15
Woodlan|Allen|6000|41.21|-84.87
Heritage|Allen|8000|40.95|-84.95
Homestead|Allen|35000|41.03|-85.21
Columbus|Bartholomew|50000|39.20|-85.92
Hope|Bartholomew|2100|39.30|-85.77
Oxford|Benton|1100|40.52|-87.25
Hartford City|Blackford|6000|40.45|-85.37
Lebanon|Boone|16000|40.05|-86.47
Zionsville|Boone|30000|39.95|-86.26
Thorntown|Boone|1500|40.13|-86.61
Nashville|Brown|1100|39.21|-86.25
Delphi|Carroll|2900|40.59|-86.68
Flora|Carroll|2000|40.55|-86.52
Logansport|Cass|18000|40.75|-86.36
Lewis Cass|Cass|3000|40.76|-86.17
Jeffersonville|Clark|49000|38.28|-85.74
Clarksville|Clark|22000|38.30|-85.76
Charlestown|Clark|8000|38.45|-85.67
Brazil|Clay|8000|39.52|-87.13
Clay City|Clay|1000|39.28|-87.11
Frankfort|Clinton|16000|40.28|-86.51
Clinton Prairie|Clinton|3000|40.30|-86.62
Rossville|Clinton|1700|40.42|-86.60
English|Crawford|600|38.33|-86.46
Washington|Daviess|12000|38.66|-87.17
North Daviess|Daviess|2000|38.80|-87.07
Lawrenceburg|Dearborn|5000|39.09|-84.85
East Central|Dearborn|10000|39.17|-84.90
South Dearborn|Dearborn|8000|39.03|-84.92
Greensburg|Decatur|12000|39.34|-85.48
North Decatur|Decatur|3000|39.42|-85.53
Auburn|DeKalb|13000|41.37|-85.06
Garrett|DeKalb|6400|41.35|-85.14
Eastside|DeKalb|3000|41.42|-84.90
Muncie|Delaware|65000|40.19|-85.39
Yorktown|Delaware|11000|40.17|-85.49
Delta|Delaware|8000|40.24|-85.36
Wapahani|Delaware|3000|40.12|-85.30
Wes-Del|Delaware|2000|40.25|-85.53
Jasper|Dubois|16000|38.39|-86.93
Southridge|Dubois|5000|38.26|-86.93
Forest Park|Dubois|3000|38.33|-86.79
Northeast Dubois|Dubois|2000|38.48|-86.80
Elkhart|Elkhart|53000|41.68|-85.98
Goshen|Elkhart|34000|41.58|-85.83
Concord|Elkhart|20000|41.63|-85.93
Northridge|Elkhart|15000|41.69|-85.79
NorthWood|Elkhart|12000|41.50|-85.98
Jimtown|Elkhart|8000|41.68|-86.09
Fairfield|Elkhart|5000|41.51|-85.73
Connersville|Fayette|13000|39.64|-85.14
New Albany|Floyd|37000|38.29|-85.82
Floyd Central|Floyd|20000|38.34|-85.94
Covington|Fountain|2500|40.14|-87.39
Fountain Central|Fountain|3000|40.22|-87.24
Brookville|Franklin|2600|39.42|-85.01
Rochester|Fulton|6200|41.06|-86.22
Princeton|Gibson|8500|38.36|-87.57
Gibson Southern|Gibson|6000|38.21|-87.63
Marion|Grant|28000|40.56|-85.66
Eastbrook|Grant|4000|40.48|-85.53
Mississinewa|Grant|5000|40.47|-85.60
Madison-Grant|Grant|3000|40.39|-85.73
Linton|Greene|5300|39.03|-87.17
Bloomfield|Greene|2400|39.03|-86.94
Eastern Greene|Greene|2000|39.04|-86.81
Shakamak|Greene|1500|39.16|-87.13
Fishers|Hamilton|100000|39.96|-85.97
Carmel|Hamilton|100000|39.98|-86.12
Noblesville|Hamilton|70000|40.05|-86.01
Westfield|Hamilton|50000|40.04|-86.13
Hamilton Heights|Hamilton|8000|40.17|-86.03
Greenfield|Hancock|23000|39.79|-85.77
Mount Vernon|Hancock|12000|39.81|-85.87
New Palestine|Hancock|12000|39.72|-85.89
Eastern Hancock|Hancock|4000|39.80|-85.65
Corydon|Harrison|3200|38.21|-86.12
Lanesville|Harrison|1000|38.24|-85.99
Avon|Hendricks|21000|39.76|-86.40
Brownsburg|Hendricks|28000|39.84|-86.40
Plainfield|Hendricks|35000|39.70|-86.40
Danville|Hendricks|10000|39.76|-86.53
Tri-West|Hendricks|5000|39.90|-86.60
Cascade|Hendricks|4000|39.62|-86.53
New Castle|Henry|17000|39.93|-85.37
Shenandoah|Henry|3000|39.88|-85.48
Tri|Henry|2000|39.93|-85.24
Blue River Valley|Henry|2000|39.98|-85.52
Kokomo|Howard|59000|40.49|-86.13
Western|Howard|8000|40.42|-86.26
Northwestern|Howard|6000|40.56|-86.19
Eastern Howard|Howard|4000|40.51|-85.95
Taylor|Howard|4000|40.43|-86.08
Huntington|Huntington|17000|40.88|-85.50
Seymour|Jackson|20000|38.96|-85.89
Brownstown|Jackson|3000|38.88|-86.04
Crothersville|Jackson|1500|38.80|-85.84
Rensselaer|Jasper|5800|40.94|-87.15
Kankakee Valley|Jasper|5000|41.08|-87.20
Portland|Jay|6200|40.43|-84.98
Madison|Jefferson|12000|38.74|-85.38
Southwestern|Jefferson|3000|38.63|-85.55
North Vernon|Jennings|7000|39.01|-85.62
Franklin|Johnson|26000|39.48|-86.05
Greenwood|Johnson|60000|39.61|-86.11
Center Grove|Johnson|30000|39.56|-86.15
Whiteland|Johnson|20000|39.55|-86.08
Indian Creek|Johnson|5000|39.43|-86.18
Edinburgh|Johnson|4500|39.35|-85.97
Vincennes|Knox|17000|38.68|-87.53
South Knox|Knox|3000|38.60|-87.42
North Knox|Knox|3000|38.80|-87.40
Warsaw|Kosciusko|15000|41.24|-85.85
Wawasee|Kosciusko|10000|41.40|-85.73
Tippecanoe Valley|Kosciusko|6000|41.11|-86.04
Whitko|Kosciusko|5000|41.08|-85.55
LaGrange|LaGrange|2600|41.64|-85.42
Westview|LaGrange|5000|41.68|-85.53
Prairie Heights|LaGrange|4000|41.65|-85.18
Gary|Lake|69000|41.59|-87.35
Hammond|Lake|77000|41.62|-87.50
East Chicago|Lake|26000|41.64|-87.45
Merrillville|Lake|35000|41.48|-87.33
Crown Point|Lake|33000|41.42|-87.37
Munster|Lake|23000|41.56|-87.51
Highland|Lake|23000|41.55|-87.45
Lake Central|Lake|45000|41.47|-87.47
Hobart|Lake|29000|41.53|-87.26
Portage|Porter|37000|41.58|-87.18
Griffith|Lake|16000|41.53|-87.42
Lowell|Lake|10000|41.29|-87.42
Hanover Central|Lake|10000|41.38|-87.45
River Forest|Lake|8000|41.56|-87.30
Lake Station|Lake|13000|41.58|-87.24
Whiting|Lake|4800|41.68|-87.49
Michigan City|LaPorte|32000|41.71|-86.90
La Porte|LaPorte|22000|41.61|-86.72
South Central|LaPorte|4000|41.45|-86.75
New Prairie|LaPorte|10000|41.69|-86.48
Bedford|Lawrence|13500|38.86|-86.49
Mitchell|Lawrence|4300|38.73|-86.47
Anderson|Madison|55000|40.11|-85.68
Pendleton|Madison|20000|39.99|-85.75
Alexandria|Madison|5000|40.26|-85.68
Elwood|Madison|8500|40.28|-85.84
Frankton|Madison|4000|40.22|-85.77
Lapel|Madison|2300|40.07|-85.85
Indianapolis|Marion|880000|39.77|-86.16
Lawrence|Marion|50000|39.84|-86.03
Warren Township|Marion|50000|39.77|-86.00
Ben Davis|Marion|40000|39.77|-86.29
Pike|Marion|40000|39.87|-86.27
North Central|Marion|40000|39.91|-86.13
Franklin Central|Marion|30000|39.68|-86.05
Perry Meridian|Marion|30000|39.66|-86.15
Southport|Marion|30000|39.66|-86.12
Decatur Central|Marion|30000|39.67|-86.27
Beech Grove|Marion|14000|39.72|-86.09
Speedway|Marion|12000|39.80|-86.27
Plymouth|Marshall|10000|41.34|-86.31
Culver|Marshall|1300|41.22|-86.42
Bremen|Marshall|4600|41.45|-86.15
Argos|Marshall|1700|41.24|-86.25
Triton|Marshall|2000|41.37|-86.12
Shoals|Martin|800|38.67|-86.79
Loogootee|Martin|2700|38.68|-86.91
Peru|Miami|11000|40.75|-86.07
Maconaquah|Miami|5000|40.66|-86.11
North Miami|Miami|3000|40.89|-86.06
Bloomington|Monroe|80000|39.17|-86.53
Edgewood|Monroe|8000|39.27|-86.62
Crawfordsville|Montgomery|16000|40.04|-86.87
Southmont|Montgomery|5000|39.94|-86.87
North Montgomery|Montgomery|5000|40.11|-86.86
Martinsville|Morgan|12000|39.43|-86.43
Mooresville|Morgan|10000|39.61|-86.37
Monrovia|Morgan|2000|39.58|-86.48
Eminence|Morgan|1000|39.52|-86.64
North Newton|Newton|3000|41.04|-87.36
South Newton|Newton|2500|40.82|-87.39
Kendallville|Noble|10000|41.44|-85.26
West Noble|Noble|5000|41.44|-85.56
Central Noble|Noble|4000|41.37|-85.49
Rising Sun|Ohio|2300|38.95|-84.85
Paoli|Orange|3600|38.56|-86.47
Springs Valley|Orange|2500|38.55|-86.62
Spencer|Owen|2300|39.29|-86.76
Rockville|Parke|2600|39.76|-87.23
Turkey Run|Parke|1500|39.87|-87.21
Tell City|Perry|7300|37.95|-86.77
Cannelton|Perry|1500|37.91|-86.74
Petersburg|Pike|2400|38.49|-87.28
Valparaiso|Porter|34000|41.47|-87.06
Chesterton|Porter|14000|41.61|-87.06
Boone Grove|Porter|5000|41.36|-87.13
Kouts|Porter|2000|41.32|-87.03
Wheeler|Porter|6000|41.53|-87.18
Morgan Township|Porter|3000|41.47|-86.97
Mt. Vernon|Posey|6500|37.93|-87.90
North Posey|Posey|4000|38.08|-87.78
Winamac|Pulaski|2400|41.05|-86.60
West Central|Pulaski|2000|40.96|-86.80
Greencastle|Putnam|10000|39.64|-86.86
Cloverdale|Putnam|2500|39.51|-86.79
South Putnam|Putnam|2500|39.55|-86.89
North Putnam|Putnam|3000|39.78|-86.83
Winchester|Randolph|4800|40.17|-84.98
Union City|Randolph|3500|40.20|-84.81
Monroe Central|Randolph|2000|40.10|-85.16
Batesville|Ripley|6600|39.30|-85.22
South Ripley|Ripley|3000|39.03|-85.27
Jac-Cen-Del|Ripley|2000|39.10|-85.30
Rushville|Rush|6000|39.61|-85.45
Scottsburg|Scott|7000|38.69|-85.77
Austin|Scott|4300|38.76|-85.81
Shelbyville|Shelby|20000|39.52|-85.78
Triton Central|Shelby|5000|39.62|-85.90
Waldron|Shelby|1500|39.45|-85.66
Morristown|Shelby|1200|39.67|-85.70
Southwestern Shelby|Shelby|2000|39.43|-85.90
Rockport|Spencer|2200|37.88|-87.05
Heritage Hills|Spencer|6000|38.07|-87.00
Knox|Starke|3600|41.30|-86.62
North Judson|Starke|1800|41.22|-86.78
Oregon-Davis|Starke|1500|41.37|-86.48
Angola|Steuben|9000|41.63|-85.00
Fremont|Steuben|2100|41.73|-84.93
Prairie Heights|Steuben|3000|41.68|-85.11
South Bend|St. Joseph|103000|41.68|-86.25
Mishawaka|St. Joseph|51000|41.66|-86.16
Penn|St. Joseph|35000|41.69|-86.12
John Glenn|St. Joseph|5000|41.52|-86.43
LaVille|St. Joseph|3000|41.48|-86.27
New Carlisle|St. Joseph|2000|41.70|-86.51
Sullivan|Sullivan|4200|39.10|-87.41
North Central Sullivan|Sullivan|2000|39.21|-87.31
Vevay|Switzerland|1700|38.75|-85.07
Lafayette|Tippecanoe|71000|40.42|-86.88
West Lafayette|Tippecanoe|45000|40.43|-86.91
Harrison|Tippecanoe|20000|40.48|-86.83
McCutcheon|Tippecanoe|20000|40.36|-86.86
Tippecanoe|Tippecanoe|8000|40.33|-86.79
Seeger|Warren|3000|40.28|-87.32
Tipton|Tipton|5300|40.28|-86.04
Tri-Central|Tipton|2000|40.38|-86.22
Liberty|Union|2000|39.64|-84.93
Evansville|Vanderburgh|117000|37.97|-87.56
Mater Dei|Vanderburgh|4000|37.98|-87.60
Newburgh|Warrick|25000|37.95|-87.40
Boonville|Warrick|6000|38.05|-87.27
Tecumseh|Warrick|3000|38.13|-87.30
Terre Haute|Vigo|60000|39.47|-87.41
Clinton|Vermillion|4800|39.66|-87.40
South Vermillion|Vermillion|4000|39.70|-87.40
North Vermillion|Vermillion|2500|39.96|-87.43
Wabash|Wabash|10000|40.80|-85.82
Manchester|Wabash|6000|41.00|-85.77
Northfield|Wabash|3000|40.86|-85.73
Southwood|Wabash|2500|40.73|-85.90
Salem|Washington|6300|38.61|-86.10
Eastern Pekin|Washington|2000|38.50|-86.00
Richmond|Wayne|35000|39.83|-84.89
Centerville|Wayne|2600|39.82|-84.99
Hagerstown|Wayne|1800|39.91|-85.16
Northeastern|Wayne|3000|39.93|-84.88
Lincoln|Wayne|2000|39.80|-85.18
Bluffton|Wells|10000|40.74|-85.17
Norwell|Wells|5000|40.79|-85.27
Southern Wells|Wells|2000|40.60|-85.24
Monticello|White|5400|40.75|-86.76
Frontier|White|2000|40.68|-87.00
Tri-County|White|2000|40.79|-87.00
Columbia City|Whitley|9000|41.16|-85.49
Churubusco|Whitley|2000|41.23|-85.32
Attica|Fountain|3200|40.29|-87.25
Sheridan|Hamilton|3000|40.14|-86.22
Western Boone|Boone|4000|40.08|-86.66
`;

  const seen = new Set();
  const cities = RAW.trim()
    .split('\n')
    .map((line) => {
      const [name, county, pop, lat, lon] = line.split('|');
      return { name, county, pop: Number(pop), lat: Number(lat), lon: Number(lon) };
    })
    .filter((c) => (seen.has(c.name) ? false : seen.add(c.name)));

  const rivers = [
    ['Wabash', 40.4, -86.6], ['White River', 39.7, -86.2], ['East Fork', 38.8, -86.4], ['Ohio Valley', 38.0, -86.6],
    ['Maumee', 41.1, -85.0], ['St. Joseph', 41.7, -86.0], ['Kankakee', 41.3, -86.9], ['Tippecanoe', 41.1, -86.3],
    ['Eel River', 40.9, -85.9], ['Mississinewa', 40.5, -85.5], ['Whitewater', 39.6, -85.0], ['Blue River', 38.3, -86.2],
    ['Sugar Creek', 39.9, -87.0], ['Big Walnut', 39.7, -86.8], ['Patoka', 38.4, -87.0], ['Muscatatuck', 38.9, -85.7],
    ['Salamonie', 40.6, -85.3], ['Iroquois', 40.9, -87.3], ['Flatrock', 39.5, -85.6], ['Laughery', 39.1, -85.1],
  ].map(([name, lat, lon]) => ({ name, lat, lon }));

  FNG.DATA.indiana = {
    key: 'IN',
    name: 'Indiana',
    center: { lat: 39.9, lon: -86.3 },
    cities,
    rivers,
    ruralExtras: false,
  };

  // IHSAA football: Class 6A is the largest 32 schools; the rest split evenly into 5A-1A.
  FNG.States.register({
    key: 'IN',
    name: 'Indiana',
    assoc: 'IHSAA',
    data: FNG.DATA.indiana,
    generator: 'places',
    classes: { count: 6, method: 'equal', top: 32 },
    labels: 'A',
    leagues: { style: 'conferences', word: 'Conference', catholicMaxDiv: 3 },
    talent: -0.8,
    depth: 0,
    neighbors: ['OH', 'MI', 'IL', 'KY'],
  });
})();
