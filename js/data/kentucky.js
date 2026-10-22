/* Kentucky geography: counties (with seats) and towns that run independent school districts. */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  // County|Seat|County population|Seat population|Lat|Lon
  const COUNTIES = `
Adair|Columbia|19000|4800|37.10|-85.31
Allen|Scottsville|21000|4500|36.75|-86.19
Anderson|Lawrenceburg|23500|11700|38.04|-84.90
Ballard|Wickliffe|7800|700|36.97|-89.09
Barren|Glasgow|45000|15000|37.00|-85.91
Bath|Owingsville|12700|1600|38.14|-83.76
Bell|Pineville|25000|1700|36.76|-83.69
Boone|Burlington|140000|18000|39.03|-84.72
Bourbon|Paris|20000|10000|38.21|-84.25
Boyd|Catlettsburg|48000|1800|38.40|-82.60
Boyle|Danville|30500|17000|37.65|-84.77
Bracken|Brooksville|8400|600|38.68|-84.07
Breathitt|Jackson|13000|2200|37.55|-83.38
Breckinridge|Hardinsburg|20500|2400|37.78|-86.46
Bullitt|Shepherdsville|82000|14000|37.99|-85.72
Butler|Morgantown|12500|2600|37.23|-86.68
Caldwell|Princeton|12700|6200|37.11|-87.88
Calloway|Murray|39000|17500|36.61|-88.31
Campbell|Alexandria|93000|10000|38.96|-84.39
Carlisle|Bardwell|4800|700|36.87|-89.01
Carroll|Carrollton|10600|3900|38.68|-85.18
Carter|Grayson|27000|3900|38.33|-82.95
Casey|Liberty|16000|2100|37.32|-84.94
Christian|Hopkinsville|72000|31000|36.87|-87.49
Clark|Winchester|36000|19000|37.99|-84.18
Clay|Manchester|20000|1300|37.15|-83.76
Clinton|Albany|9100|2000|36.69|-85.13
Crittenden|Marion|9000|2900|37.33|-88.08
Cumberland|Burkesville|6700|1500|36.79|-85.37
Daviess|Owensboro|102000|60000|37.77|-87.11
Edmonson|Brownsville|12100|800|37.19|-86.27
Elliott|Sandy Hook|7300|700|38.09|-83.13
Estill|Irvine|14000|2500|37.70|-83.97
Fayette|Lexington|320000|320000|38.04|-84.50
Fleming|Flemingsburg|15000|2900|38.42|-83.73
Floyd|Prestonsburg|35000|3500|37.67|-82.77
Franklin|Frankfort|51000|28000|38.20|-84.87
Fulton|Hickman|6200|2300|36.57|-89.19
Gallatin|Warsaw|8800|1600|38.78|-84.90
Garrard|Lancaster|17700|3900|37.62|-84.58
Grant|Williamstown|25000|3900|38.64|-84.56
Graves|Mayfield|37000|10000|36.74|-88.64
Grayson|Leitchfield|26000|6800|37.48|-86.29
Green|Greensburg|11000|2100|37.26|-85.50
Greenup|Greenup|35000|1200|38.57|-82.83
Hancock|Hawesville|9000|1000|37.90|-86.75
Hardin|Elizabethtown|111000|31000|37.69|-85.86
Harlan|Harlan|26000|1600|36.84|-83.32
Harrison|Cynthiana|18900|6400|38.39|-84.29
Hart|Munfordville|19000|1600|37.27|-85.89
Henderson|Henderson|44000|28000|37.84|-87.59
Henry|New Castle|15700|900|38.43|-85.17
Hickman|Clinton|4500|1300|36.67|-88.99
Hopkins|Madisonville|45000|19000|37.33|-87.50
Jackson|McKee|13000|800|37.43|-83.99
Jefferson|Louisville|780000|620000|38.25|-85.76
Jessamine|Nicholasville|54000|31000|37.88|-84.57
Johnson|Paintsville|22000|4200|37.81|-82.81
Kenton|Independence|170000|28000|38.94|-84.54
Knott|Hindman|14000|700|37.34|-82.98
Knox|Barbourville|30000|3200|36.87|-83.89
Larue|Hodgenville|14800|3200|37.57|-85.74
Laurel|London|62000|8000|37.13|-84.08
Lawrence|Louisa|16000|2500|38.11|-82.60
Lee|Beattyville|7000|1300|37.57|-83.71
Leslie|Hyden|10000|300|37.16|-83.37
Letcher|Whitesburg|21500|2100|37.12|-82.83
Lewis|Vanceburg|13000|1500|38.60|-83.32
Lincoln|Stanford|24500|3800|37.53|-84.66
Livingston|Smithland|9000|300|37.14|-88.40
Logan|Russellville|27500|7200|36.85|-86.89
Lyon|Eddyville|8600|2500|37.09|-88.08
McCracken|Paducah|67000|27000|37.08|-88.60
McCreary|Whitley City|17000|1100|36.72|-84.47
McLean|Calhoun|9200|800|37.54|-87.26
Madison|Richmond|93000|35000|37.75|-84.29
Magoffin|Salyersville|12000|1900|37.75|-83.07
Marion|Lebanon|19500|5800|37.57|-85.25
Marshall|Benton|31500|4700|36.86|-88.35
Martin|Inez|11000|700|37.87|-82.54
Mason|Maysville|17000|8900|38.64|-83.74
Meade|Brandenburg|30000|2900|37.99|-86.17
Menifee|Frenchburg|6300|500|37.95|-83.63
Mercer|Harrodsburg|22600|9000|37.76|-84.84
Metcalfe|Edmonton|10000|1600|36.98|-85.61
Monroe|Tompkinsville|11000|2300|36.70|-85.69
Montgomery|Mount Sterling|28000|7500|38.06|-83.94
Morgan|West Liberty|13000|3400|37.92|-83.26
Muhlenberg|Greenville|30000|4400|37.20|-87.18
Nelson|Bardstown|46000|13500|37.81|-85.47
Nicholas|Carlisle|7200|2000|38.31|-84.03
Ohio|Hartford|24000|2700|37.45|-86.91
Oldham|La Grange|67000|10000|38.41|-85.38
Owen|Owenton|11000|1600|38.54|-84.84
Owsley|Booneville|4400|100|37.48|-83.67
Pendleton|Falmouth|14600|2100|38.68|-84.33
Perry|Hazard|28000|5300|37.25|-83.19
Pike|Pikeville|58000|7400|37.48|-82.52
Powell|Stanton|12500|2700|37.85|-83.86
Pulaski|Somerset|65000|12000|37.09|-84.60
Robertson|Mount Olivet|2200|300|38.53|-84.04
Rockcastle|Mount Vernon|16000|2500|37.35|-84.34
Rowan|Morehead|24500|7000|38.18|-83.43
Russell|Jamestown|18000|1800|36.98|-85.06
Scott|Georgetown|58000|37000|38.21|-84.56
Shelby|Shelbyville|48000|17000|38.21|-85.22
Simpson|Franklin|19500|10000|36.72|-86.58
Spencer|Taylorsville|19500|1300|38.03|-85.34
Taylor|Campbellsville|26000|11500|37.34|-85.34
Todd|Elkton|12300|2100|36.81|-87.15
Trigg|Cadiz|14600|2600|36.87|-87.84
Trimble|Bedford|8600|600|38.59|-85.32
Union|Morganfield|14500|3300|37.68|-87.92
Warren|Bowling Green|135000|72000|36.99|-86.44
Washington|Springfield|12000|3000|37.69|-85.22
Wayne|Monticello|20000|6100|36.83|-84.85
Webster|Dixon|12900|600|37.52|-87.69
Whitley|Williamsburg|36000|5200|36.74|-84.16
Wolfe|Campton|6600|400|37.73|-83.55
Woodford|Versailles|26000|10000|38.05|-84.73
`;

  // Towns with their own (independent) high school: Town|County|Population|Lat|Lon
  const TOWNS = `
Ashland|Boyd|21000|38.48|-82.64
Russell|Greenup|3300|38.52|-82.70
Raceland|Greenup|2400|38.54|-82.73
Middlesboro|Bell|9500|36.61|-83.72
Corbin|Whitley|7300|36.95|-84.10
Covington|Kenton|40000|39.08|-84.51
Newport|Campbell|15000|39.09|-84.50
Fort Thomas|Campbell|17000|39.08|-84.45
Bellevue|Campbell|5800|39.10|-84.48
Ludlow|Kenton|4400|39.09|-84.55
Fort Mitchell|Kenton|8700|39.05|-84.55
Erlanger|Kenton|19000|39.02|-84.60
Florence|Boone|32000|38.99|-84.63
Union|Boone|7000|38.95|-84.68
Walton|Boone|5000|38.88|-84.61
Radcliff|Hardin|23000|37.84|-85.95
Fort Knox|Hardin|10000|37.89|-85.96
Berea|Madison|15000|37.57|-84.30
Mount Washington|Bullitt|18000|38.05|-85.75
Crestwood|Oldham|6000|38.32|-85.47
Beaver Dam|Ohio|3600|37.40|-86.88
Central City|Muhlenberg|5800|37.29|-87.12
Dawson Springs|Hopkins|2500|37.17|-87.69
Providence|Webster|3000|37.40|-87.76
Fulton|Fulton|2300|36.50|-88.87
Betsy Layne|Floyd|700|37.55|-82.63
Belfry|Pike|2000|37.62|-82.27
Jenkins|Letcher|2100|37.17|-82.63
Burgin|Mercer|1000|37.75|-84.77
Eminence|Henry|2500|38.37|-85.18
Augusta|Bracken|1200|38.77|-84.00
Horse Cave|Hart|2300|37.18|-85.91
Sturgis|Union|1900|37.55|-87.98
`;

  // County seats whose city also runs its own independent high school.
  const INDEPENDENT_SEATS = [
    'Danville', 'Frankfort', 'Glasgow', 'Hazard', 'Pikeville', 'Paintsville', 'Russellville', 'Mayfield', 'Murray',
    'Paducah', 'Owensboro', 'Bowling Green', 'Elizabethtown', 'Harlan', 'Williamsburg', 'Campbellsville', 'Bardstown',
    'Somerset', 'Pineville', 'Barbourville', 'Paris', 'Hopkinsville', 'Henderson',
  ];

  const counties = COUNTIES.trim().split('\n').map((line) => {
    const [county, seat, pop, seatPop, lat, lon] = line.split('|');
    return { county, seat, pop: Number(pop), seatPop: Number(seatPop), lat: Number(lat), lon: Number(lon) };
  });
  const towns = TOWNS.trim().split('\n').map((line) => {
    const [name, county, pop, lat, lon] = line.split('|');
    return { name, county, pop: Number(pop), lat: Number(lat), lon: Number(lon) };
  });

  // Selectable communities: every county seat plus the independent towns.
  const cities = counties
    .map((c) => ({ name: c.seat, county: c.county, pop: c.seatPop, lat: c.lat, lon: c.lon }))
    .concat(towns.map((t) => ({ name: t.name, county: t.county, pop: t.pop, lat: t.lat, lon: t.lon })))
    .sort((a, b) => a.name.localeCompare(b.name));

  FNG.DATA.kentucky = {
    key: 'KY',
    name: 'Kentucky',
    center: { lat: 37.75, lon: -85.6 },
    counties,
    towns,
    independentSeats: INDEPENDENT_SEATS,
    cities,
  };
})();
