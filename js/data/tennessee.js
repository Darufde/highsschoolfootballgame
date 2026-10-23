/* Tennessee geography: counties (with their main town), towns with their own high schools, and metro areas. */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  // County|Main town|County population|Town population|Lat|Lon
  const COUNTIES = `
Anderson|Clinton|77000|10000|36.10|-84.13
Bedford|Shelbyville|50000|23000|35.48|-86.46
Benton|Camden|16000|3600|36.06|-88.10
Bledsoe|Pikeville|15000|1600|35.61|-85.19
Blount|Maryville|135000|31000|35.76|-83.97
Bradley|Cleveland|108000|47000|35.16|-84.88
Campbell|Jacksboro|39000|2000|36.33|-84.18
Cannon|Woodbury|14500|2800|35.83|-86.07
Carroll|Huntingdon|28000|3900|36.00|-88.43
Carter|Elizabethton|56000|14500|36.35|-82.21
Cheatham|Ashland City|41000|5000|36.27|-87.06
Chester|Henderson|17000|6300|35.44|-88.64
Claiborne|Tazewell|32000|2200|36.45|-83.57
Clay|Celina|7600|1500|36.55|-85.50
Cocke|Newport|36000|6900|35.97|-83.19
Coffee|Manchester|57000|12000|35.48|-86.09
Crockett|Alamo|14000|2300|35.78|-89.12
Cumberland|Crossville|61000|12000|35.95|-85.03
Davidson|Nashville|715000|690000|36.16|-86.78
Decatur|Decaturville|11400|800|35.58|-88.12
DeKalb|Smithville|20000|5000|35.96|-85.81
Dickson|Dickson|54000|16000|36.08|-87.39
Dyer|Dyersburg|37000|16000|36.03|-89.39
Fayette|Somerville|42000|3400|35.24|-89.35
Fentress|Jamestown|18500|2000|36.43|-84.93
Franklin|Winchester|43000|9400|35.19|-86.11
Gibson|Trenton|50000|4200|35.98|-88.94
Giles|Pulaski|30000|8400|35.20|-87.03
Grainger|Rutledge|23500|1300|36.28|-83.51
Greene|Greeneville|70000|15500|36.16|-82.83
Grundy|Coalmont|13500|900|35.34|-85.70
Hamblen|Morristown|64000|30000|36.21|-83.29
Hamilton|Chattanooga|366000|181000|35.05|-85.31
Hancock|Sneedville|6700|1400|36.53|-83.22
Hardeman|Bolivar|25500|5000|35.26|-88.99
Hardin|Savannah|27000|7000|35.22|-88.25
Hawkins|Rogersville|57000|4400|36.41|-83.01
Haywood|Brownsville|18000|9700|35.59|-89.26
Henderson|Lexington|27800|7900|35.65|-88.39
Henry|Paris|32000|10000|36.30|-88.33
Hickman|Centerville|25000|3600|35.78|-87.47
Houston|Erin|8300|1300|36.32|-87.70
Humphreys|Waverly|19000|4300|36.08|-87.79
Jackson|Gainesboro|12000|1000|36.36|-85.66
Jefferson|Dandridge|55000|3300|36.02|-83.42
Johnson|Mountain City|18000|2400|36.47|-81.80
Knox|Knoxville|478000|190000|35.96|-83.92
Lake|Tiptonville|7000|4000|36.38|-89.48
Lauderdale|Ripley|25000|7800|35.74|-89.53
Lawrence|Lawrenceburg|44000|11600|35.24|-87.33
Lewis|Hohenwald|12500|3700|35.55|-87.55
Lincoln|Fayetteville|35000|7000|35.15|-86.57
Loudon|Loudon|54000|6000|35.73|-84.33
McMinn|Athens|54000|14000|35.44|-84.59
McNairy|Selmer|25800|4500|35.17|-88.59
Macon|Lafayette|25000|5300|36.52|-86.03
Madison|Jackson|98000|68000|35.61|-88.81
Marion|Jasper|28800|3500|35.07|-85.63
Marshall|Lewisburg|34000|12000|35.45|-86.79
Maury|Columbia|100000|41000|35.62|-87.04
Meigs|Decatur|12800|1600|35.51|-84.79
Monroe|Madisonville|46000|5000|35.52|-84.36
Montgomery|Clarksville|221000|166000|36.53|-87.36
Moore|Lynchburg|6500|6500|35.28|-86.37
Morgan|Wartburg|21000|900|36.10|-84.59
Obion|Union City|30800|11000|36.42|-89.06
Overton|Livingston|22500|4000|36.38|-85.32
Perry|Linden|8400|900|35.62|-87.84
Pickett|Byrdstown|5000|900|36.57|-85.13
Polk|Benton|17500|1400|35.17|-84.65
Putnam|Cookeville|80000|35000|36.16|-85.50
Rhea|Dayton|32800|7300|35.49|-85.01
Roane|Kingston|54000|6000|35.88|-84.51
Robertson|Springfield|72000|18800|36.51|-86.89
Rutherford|Murfreesboro|341000|153000|35.85|-86.39
Scott|Huntsville|22000|1200|36.41|-84.49
Sequatchie|Dunlap|15800|5400|35.37|-85.39
Sevier|Sevierville|98000|17900|35.87|-83.56
Shelby|Memphis|929000|633000|35.15|-90.05
Smith|Carthage|20000|2300|36.25|-85.95
Stewart|Dover|13600|1500|36.49|-87.84
Sullivan|Blountville|158000|3000|36.53|-82.33
Sumner|Gallatin|196000|44000|36.39|-86.45
Tipton|Covington|61000|8700|35.56|-89.65
Trousdale|Hartsville|11600|11600|36.39|-86.17
Unicoi|Erwin|17900|6000|36.14|-82.42
Union|Maynardville|19800|2500|36.25|-83.80
Van Buren|Spencer|6200|1700|35.75|-85.47
Warren|McMinnville|41000|13800|35.68|-85.77
Washington|Jonesborough|133000|5800|36.29|-82.47
Wayne|Waynesboro|16200|2400|35.32|-87.76
Weakley|Dresden|32900|3000|36.29|-88.71
White|Sparta|27000|5000|35.93|-85.46
Williamson|Franklin|247000|83000|35.93|-86.87
Wilson|Lebanon|147000|38000|36.21|-86.29
`;

  // Other towns with their own high school: Town|County|Population|Lat|Lon
  const TOWNS = `
Oak Ridge|Anderson|31000|36.01|-84.27
Oliver Springs|Anderson|3300|36.04|-84.34
Alcoa|Blount|11000|35.79|-83.98
Lenoir City|Loudon|10000|35.80|-84.26
Kingsport|Sullivan|55000|36.55|-82.56
Bristol|Sullivan|27000|36.60|-82.19
Johnson City|Washington|71000|36.31|-82.35
Tullahoma|Coffee|20000|35.36|-86.21
Mount Juliet|Wilson|39000|36.20|-86.52
Watertown|Wilson|1500|36.10|-86.13
Hendersonville|Sumner|61000|36.30|-86.62
Portland|Sumner|13000|36.58|-86.52
White House|Sumner|13000|36.47|-86.65
Westmoreland|Sumner|2500|36.56|-86.25
Brentwood|Williamson|45000|36.03|-86.78
Nolensville|Williamson|14000|35.95|-86.67
Fairview|Williamson|9500|35.98|-87.12
Spring Hill|Maury|50000|35.75|-86.93
Mount Pleasant|Maury|5000|35.53|-87.21
Smyrna|Rutherford|53000|35.98|-86.52
La Vergne|Rutherford|38000|36.02|-86.58
Eagleville|Rutherford|800|35.74|-86.65
Germantown|Shelby|41000|35.09|-89.81
Collierville|Shelby|51000|35.04|-89.66
Bartlett|Shelby|57000|35.20|-89.87
Arlington|Shelby|14500|35.30|-89.66
Millington|Shelby|10500|35.34|-89.90
Lakeland|Shelby|13000|35.23|-89.74
Humboldt|Gibson|8000|35.82|-88.92
Milan|Gibson|8000|35.92|-88.76
Bradford|Gibson|1000|36.07|-88.81
Martin|Weakley|10800|36.34|-88.85
Greenfield|Weakley|2100|36.16|-88.80
South Pittsburg|Marion|3000|35.01|-85.70
Whitwell|Marion|1600|35.20|-85.52
Oneida|Scott|3700|36.50|-84.51
Rockwood|Roane|5500|35.87|-84.68
Harriman|Roane|6300|35.93|-84.55
Sweetwater|Monroe|6300|35.60|-84.46
Cornersville|Marshall|1300|35.36|-86.84
McKenzie|Carroll|5500|36.13|-88.52
Greenbrier|Robertson|6900|36.43|-86.80
Munford|Tipton|6400|35.45|-89.82
Brighton|Tipton|2700|35.48|-89.72
Halls|Lauderdale|2100|35.88|-89.40
Monterey|Putnam|2900|36.15|-85.27
Baxter|Putnam|1600|36.15|-85.64
Seymour|Sevier|14000|35.88|-83.77
Gatlinburg|Sevier|3900|35.71|-83.51
Pigeon Forge|Sevier|6300|35.79|-83.55
Jefferson City|Jefferson|8000|36.12|-83.49
Loretto|Lawrence|1800|35.08|-87.44
Huntland|Franklin|900|35.05|-86.27
Adamsville|McNairy|2200|35.24|-88.39
Etowah|McMinn|3500|35.32|-84.52
Soddy-Daisy|Hamilton|13000|35.24|-85.19
Signal Mountain|Hamilton|8800|35.12|-85.35
`;

  // Main towns that also run a city high school next to the county school.
  const INDEPENDENT_SEATS = [
    'Cleveland', 'Elizabethton', 'Greeneville', 'Maryville', 'Shelbyville', 'Lebanon', 'Gallatin', 'Springfield', 'Columbia', 'Cookeville',
    'Dyersburg', 'Union City', 'Covington', 'Lexington', 'Huntingdon', 'Fayetteville', 'Clinton', 'Manchester', 'Murfreesboro', 'Franklin',
  ];

  // Metro counties: their public schools take neighborhood-style names. County -> [metro, public schools, private schools]
  const METROS = {
    Shelby: ['Memphis', 22, 10],
    Davidson: ['Nashville', 15, 10],
    Knox: ['Knoxville', 12, 5],
    Hamilton: ['Chattanooga', 12, 7],
    Montgomery: ['Clarksville', 7, 1],
  };

  const counties = COUNTIES.trim().split('\n').map((line) => {
    const [county, seat, pop, seatPop, lat, lon] = line.split('|');
    return { county, seat, pop: Number(pop), seatPop: Number(seatPop), lat: Number(lat), lon: Number(lon) };
  });
  const towns = TOWNS.trim().split('\n').map((line) => {
    const [name, county, pop, lat, lon] = line.split('|');
    return { name, county, pop: Number(pop), lat: Number(lat), lon: Number(lon) };
  });

  const cities = counties
    .map((c) => ({ name: c.seat, county: c.county, pop: c.seatPop, lat: c.lat, lon: c.lon }))
    .concat(towns.map((t) => ({ name: t.name, county: t.county, pop: t.pop, lat: t.lat, lon: t.lon })))
    .sort((a, b) => a.name.localeCompare(b.name));

  FNG.DATA.tennessee = {
    key: 'TN',
    name: 'Tennessee',
    center: { lat: 35.86, lon: -86.35 },
    counties,
    towns,
    independentSeats: INDEPENDENT_SEATS,
    metros: METROS,
    cities,
  };
})();
