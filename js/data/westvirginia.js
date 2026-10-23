/* West Virginia geography: counties and the communities that hold their high schools, plus rivers used for naming. */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  // County|Population
  const COUNTIES = `
Barbour|15500
Berkeley|125000
Boone|21000
Braxton|12500
Brooke|22000
Cabell|93000
Calhoun|7000
Clay|8000
Doddridge|7800
Fayette|40000
Gilmer|7400
Grant|11000
Greenbrier|32500
Hampshire|23000
Hancock|29000
Hardy|14000
Harrison|65000
Jackson|28000
Jefferson|58000
Kanawha|180000
Lewis|16000
Lincoln|20000
Logan|32000
McDowell|19000
Marion|56000
Marshall|30000
Mason|25000
Mercer|59000
Mineral|27000
Mingo|23000
Monongalia|106000
Monroe|12500
Morgan|17000
Nicholas|24500
Ohio|42000
Pendleton|6100
Pleasants|7600
Pocahontas|7900
Preston|34000
Putnam|57000
Raleigh|74000
Randolph|28000
Ritchie|8400
Roane|14000
Summers|11800
Taylor|16700
Tucker|6800
Tyler|8300
Upshur|24000
Wayne|38000
Webster|8000
Wetzel|14500
Wirt|5200
Wood|84000
Wyoming|21000
`;

  // Communities with a public high school: Town|County|Population|Lat|Lon
  const TOWNS = `
Philippi|Barbour|2900|39.15|-80.04
Martinsburg|Berkeley|18800|39.46|-77.96
Spring Mills|Berkeley|8000|39.55|-77.90
Hedgesville|Berkeley|6000|39.55|-77.99
Inwood|Berkeley|7000|39.36|-78.04
Madison|Boone|2800|38.07|-81.82
Van|Boone|1000|37.97|-81.69
Sherman|Boone|1500|38.20|-81.62
Sutton|Braxton|1000|38.66|-80.71
Wellsburg|Brooke|2600|40.27|-80.61
Huntington|Cabell|46000|38.42|-82.44
Milton|Cabell|2500|38.43|-82.13
Barboursville|Cabell|4300|38.41|-82.29
Grantsville|Calhoun|600|38.92|-81.10
Clay|Clay|500|38.46|-81.08
West Union|Doddridge|800|39.30|-80.78
Oak Hill|Fayette|8200|37.97|-81.15
Fayetteville|Fayette|2900|38.05|-81.10
Meadow Bridge|Fayette|400|37.86|-80.85
Hico|Fayette|500|38.13|-80.95
Glenville|Gilmer|1300|38.93|-80.84
Petersburg|Grant|2400|38.99|-79.12
Mount Storm|Grant|500|39.28|-79.24
Lewisburg|Greenbrier|3900|37.80|-80.45
Rupert|Greenbrier|900|37.96|-80.69
Romney|Hampshire|1800|39.34|-78.76
Weirton|Hancock|19000|40.42|-80.59
New Cumberland|Hancock|1000|40.50|-80.61
Moorefield|Hardy|2500|39.06|-78.97
Baker|Hardy|500|39.05|-78.74
Clarksburg|Harrison|16000|39.28|-80.34
Bridgeport|Harrison|9000|39.29|-80.26
Shinnston|Harrison|2000|39.40|-80.30
Lost Creek|Harrison|500|39.16|-80.35
Ripley|Jackson|3200|38.82|-81.71
Ravenswood|Jackson|3800|38.95|-81.76
Charles Town|Jefferson|6000|39.29|-77.86
Shenandoah Junction|Jefferson|5000|39.36|-77.84
Charleston|Kanawha|48000|38.35|-81.63
South Charleston|Kanawha|13000|38.37|-81.70
St. Albans|Kanawha|10000|38.39|-81.84
Nitro|Kanawha|6400|38.41|-81.84
Dunbar|Kanawha|7400|38.36|-81.74
Elkview|Kanawha|5000|38.44|-81.48
Sissonville|Kanawha|4000|38.53|-81.63
Belle|Kanawha|1200|38.23|-81.54
Weston|Lewis|3900|39.04|-80.47
Hamlin|Lincoln|1100|38.28|-82.10
Logan|Logan|1700|37.85|-81.99
Chapmanville|Logan|1100|37.97|-82.02
Man|Logan|700|37.74|-81.88
Welch|McDowell|1800|37.43|-81.58
Bradshaw|McDowell|300|37.35|-81.80
Fairmont|Marion|18400|39.49|-80.14
Farmington|Marion|400|39.51|-80.25
Moundsville|Marshall|8300|39.92|-80.74
Cameron|Marshall|900|39.83|-80.57
Point Pleasant|Mason|4100|38.84|-82.14
Mason|Mason|1000|39.02|-82.03
Bluefield|Mercer|9600|37.27|-81.22
Princeton|Mercer|5800|37.37|-81.10
Gardner|Mercer|1000|37.47|-81.07
Keyser|Mineral|4800|39.44|-78.98
Ridgeley|Mineral|700|39.64|-78.77
Williamson|Mingo|2900|37.67|-82.28
Gilbert|Mingo|400|37.62|-81.87
Newtown|Mingo|500|37.70|-82.08
Morgantown|Monongalia|30000|39.63|-79.96
Westover|Monongalia|4500|39.64|-79.98
Blacksville|Monongalia|200|39.72|-80.21
Union|Monroe|600|37.59|-80.54
Berkeley Springs|Morgan|600|39.63|-78.23
Summersville|Nicholas|3500|38.28|-80.85
Richwood|Nicholas|1800|38.22|-80.53
Wheeling|Ohio|27000|40.06|-80.72
Franklin|Pendleton|700|38.64|-79.33
St. Marys|Pleasants|1800|39.39|-81.20
Marlinton|Pocahontas|1000|38.22|-80.09
Kingwood|Preston|2900|39.47|-79.68
Winfield|Putnam|2300|38.53|-81.89
Hurricane|Putnam|6900|38.43|-82.02
Poca|Putnam|1000|38.47|-81.81
Buffalo|Putnam|1200|38.62|-81.98
Beckley|Raleigh|17000|37.78|-81.19
Shady Spring|Raleigh|2900|37.71|-81.10
Coal City|Raleigh|1800|37.68|-81.21
Glen Daniel|Raleigh|500|37.78|-81.35
Elkins|Randolph|6900|38.93|-79.85
Mill Creek|Randolph|700|38.73|-79.97
Harrisville|Ritchie|1800|39.21|-81.05
Spencer|Roane|2100|38.80|-81.35
Hinton|Summers|2500|37.67|-80.89
Grafton|Taylor|5000|39.34|-80.02
Parsons|Tucker|1400|39.10|-79.68
Middlebourne|Tyler|800|39.49|-80.90
Buckhannon|Upshur|5600|38.99|-80.23
Wayne|Wayne|1400|38.22|-82.44
Kenova|Wayne|3000|38.40|-82.58
Fort Gay|Wayne|700|38.12|-82.59
Webster Springs|Webster|700|38.48|-80.41
New Martinsville|Wetzel|5000|39.64|-80.86
Paden City|Wetzel|2500|39.60|-80.93
Hundred|Wetzel|300|39.68|-80.46
Elizabeth|Wirt|800|39.06|-81.40
Parkersburg|Wood|29700|39.27|-81.56
Vienna|Wood|10700|39.33|-81.54
Williamstown|Wood|2900|39.40|-81.45
Pineville|Wyoming|600|37.58|-81.53
Clear Fork|Wyoming|1500|37.62|-81.71
`;

  const rivers = [
    ['Kanawha', 38.4, -81.7], ['Ohio Valley', 39.3, -81.5], ['Monongahela', 39.5, -80.1], ['Greenbrier', 37.9, -80.4],
    ['Big Sandy', 38.1, -82.6], ['Tygart Valley', 39.0, -80.0], ['Little Kanawha', 39.0, -81.2], ['Guyandotte', 37.9, -81.9],
    ['New River', 37.8, -81.0], ['Potomac', 39.4, -78.4], ['Cheat', 39.4, -79.7], ['Elk River', 38.5, -81.0],
    ['Gauley', 38.3, -80.8], ['Coal River', 38.1, -81.7], ['Tug Fork', 37.6, -82.1], ['Shenandoah', 39.3, -77.8],
    ['Bluestone', 37.4, -81.1], ['West Fork', 39.2, -80.4], ['Middle Island', 39.4, -81.0], ['South Branch', 39.0, -78.9],
  ].map(([name, lat, lon]) => ({ name, lat, lon }));

  const counties = COUNTIES.trim().split('\n').map((line) => {
    const [county, pop] = line.split('|');
    return { county, pop: Number(pop) };
  });
  const towns = TOWNS.trim().split('\n').map((line) => {
    const [name, county, pop, lat, lon] = line.split('|');
    return { name, county, pop: Number(pop), lat: Number(lat), lon: Number(lon) };
  });

  FNG.DATA.westvirginia = {
    key: 'WV',
    name: 'West Virginia',
    center: { lat: 38.7, lon: -80.6 },
    counties,
    towns,
    rivers,
    cities: towns.slice().sort((a, b) => a.name.localeCompare(b.name)),
  };

  FNG.States.register({
    key: 'WV',
    name: 'West Virginia',
    assoc: 'WVSSAC',
    data: FNG.DATA.westvirginia,
    generator: 'counties',
    seedTag: '|wv',
    classes: { count: 3, method: 'equal' },
    labels: ['AAA', 'AA', 'A'],
    leagues: { style: 'conferences', word: 'Conference', prefix: 'W', catholicMaxDiv: 2 },
    talent: -2.8,
    depth: -0.6,
    neighbors: ['OH', 'PA', 'MD', 'VA', 'KY'],
  });
})();
