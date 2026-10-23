/*
 * Colleges that recruit in the game: the Big Ten, SEC, ACC, Big 12, Pac-12 and American programs plus Notre
 * Dame, limited to the schools with a logo in assets/colleges/ (a college without a logo is not
 * in the game).
 *
 * Each college has a fixed id that is also the name of its logo file (assets/colleges/<id>.png),
 * a campus location for recruiting distance, colors for the badge shown if the logo can't load,
 * and a prestige rating (0-100) that sets which recruits it targets and how interested top
 * players are in it.
 */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  const CONFERENCES = [
    { id: 'B1G', name: 'Big Ten' },
    { id: 'SEC', name: 'SEC' },
    { id: 'ACC', name: 'ACC' },
    { id: 'B12', name: 'Big 12' },
    { id: 'P12', name: 'Pac-12' },
    { id: 'AAC', name: 'American' },
    { id: 'IND', name: 'Independent' },
  ];

  // id|Name|Abbr|Conference|City|State|Lat|Lon|Primary|Secondary|Prestige
  const RAW = `
ohio-state|Ohio State|OSU|B1G|Columbus|OH|40.00|-83.02|#BB0000|#666666|97
michigan|Michigan|MICH|B1G|Ann Arbor|MI|42.27|-83.74|#00274C|#FFCB05|93
oregon|Oregon|ORE|B1G|Eugene|OR|44.06|-123.07|#154733|#FEE123|90
penn-state|Penn State|PSU|B1G|State College|PA|40.80|-77.86|#041E42|#FFFFFF|89
usc|USC|USC|B1G|Los Angeles|CA|34.02|-118.29|#990000|#FFC72C|86
indiana|Indiana|IU|B1G|Bloomington|IN|39.17|-86.52|#990000|#EEEDEB|82
washington|Washington|UW|B1G|Seattle|WA|47.65|-122.30|#4B2E83|#B7A57A|79
nebraska|Nebraska|NEB|B1G|Lincoln|NE|40.82|-96.70|#E41C38|#FFFFFF|73
iowa|Iowa|IOWA|B1G|Iowa City|IA|41.66|-91.55|#000000|#FFCD00|73
wisconsin|Wisconsin|WIS|B1G|Madison|WI|43.07|-89.41|#C5050C|#FFFFFF|71
ucla|UCLA|UCLA|B1G|Los Angeles|CA|34.07|-118.44|#2D68C4|#F2A900|67
michigan-state|Michigan State|MSU|B1G|East Lansing|MI|42.73|-84.48|#18453B|#FFFFFF|65
minnesota|Minnesota|MINN|B1G|Minneapolis|MN|44.97|-93.23|#7A0019|#FFCC33|61
illinois|Illinois|ILL|B1G|Champaign|IL|40.10|-88.23|#E84A27|#13294B|62
maryland|Maryland|MD|B1G|College Park|MD|38.99|-76.94|#E03A3E|#FFD520|57
rutgers|Rutgers|RUT|B1G|Piscataway|NJ|40.51|-74.46|#CC0033|#FFFFFF|52
purdue|Purdue|PUR|B1G|West Lafayette|IN|40.42|-86.91|#CEB888|#000000|51
northwestern|Northwestern|NU|B1G|Evanston|IL|42.06|-87.68|#4E2A84|#FFFFFF|50
alabama|Alabama|ALA|SEC|Tuscaloosa|AL|33.21|-87.55|#9E1B32|#FFFFFF|96
georgia|Georgia|UGA|SEC|Athens|GA|33.95|-83.37|#BA0C2F|#000000|96
texas|Texas|TEX|SEC|Austin|TX|30.28|-97.73|#BF5700|#FFFFFF|93
oklahoma|Oklahoma|OU|SEC|Norman|OK|35.21|-97.44|#841617|#FDF9D8|86
tennessee|Tennessee|TENN|SEC|Knoxville|TN|35.95|-83.93|#FF8200|#FFFFFF|85
texas-am|Texas A&M|TAMU|SEC|College Station|TX|30.61|-96.34|#500000|#FFFFFF|85
florida|Florida|UF|SEC|Gainesville|FL|29.65|-82.35|#0021A5|#FA4616|84
ole-miss|Ole Miss|MISS|SEC|Oxford|MS|34.36|-89.54|#CE1126|#14213D|82
south-carolina|South Carolina|SC|SEC|Columbia|SC|34.00|-81.03|#73000A|#000000|74
missouri|Missouri|MIZ|SEC|Columbia|MO|38.94|-92.33|#F1B82D|#000000|72
arkansas|Arkansas|ARK|SEC|Fayetteville|AR|36.07|-94.17|#9D2235|#FFFFFF|65
kentucky|Kentucky|UK|SEC|Lexington|KY|38.02|-84.51|#0033A0|#FFFFFF|64
vanderbilt|Vanderbilt|VAN|SEC|Nashville|TN|36.14|-86.81|#000000|#CFAE70|61
mississippi-state|Mississippi State|MSST|SEC|Starkville|MS|33.46|-88.79|#660000|#FFFFFF|57
clemson|Clemson|CLEM|ACC|Clemson|SC|34.68|-82.84|#F56600|#522D80|88
miami|Miami|MIA|ACC|Coral Gables|FL|25.72|-80.28|#F47321|#005030|86
florida-state|Florida State|FSU|ACC|Tallahassee|FL|30.44|-84.30|#782F40|#CEB888|81
louisville|Louisville|LOU|ACC|Louisville|KY|38.21|-85.76|#AD0000|#000000|72
north-carolina|North Carolina|UNC|ACC|Chapel Hill|NC|35.90|-79.05|#7BAFD4|#13294B|69
smu|SMU|SMU|ACC|Dallas|TX|32.84|-96.78|#CC0035|#354CA1|68
virginia-tech|Virginia Tech|VT|ACC|Blacksburg|VA|37.23|-80.42|#630031|#CF4420|67
pittsburgh|Pittsburgh|PITT|ACC|Pittsburgh|PA|40.44|-79.96|#003594|#FFB81C|64
nc-state|NC State|NCSU|ACC|Raleigh|NC|35.79|-78.68|#CC0000|#FFFFFF|64
georgia-tech|Georgia Tech|GT|ACC|Atlanta|GA|33.78|-84.40|#B3A369|#003057|64
syracuse|Syracuse|SYR|ACC|Syracuse|NY|43.04|-76.14|#F76900|#000E54|59
virginia|Virginia|UVA|ACC|Charlottesville|VA|38.03|-78.51|#232D4B|#F84C1E|58
duke|Duke|DUKE|ACC|Durham|NC|36.00|-78.94|#003087|#FFFFFF|58
stanford|Stanford|STAN|ACC|Stanford|CA|37.43|-122.17|#8C1515|#FFFFFF|57
california|California|CAL|ACC|Berkeley|CA|37.87|-122.26|#003262|#FDB515|55
boston-college|Boston College|BC|ACC|Chestnut Hill|MA|42.34|-71.17|#98002E|#BC9B6A|54
wake-forest|Wake Forest|WAKE|ACC|Winston-Salem|NC|36.13|-80.28|#9E7E38|#000000|52
texas-tech|Texas Tech|TTU|B12|Lubbock|TX|33.58|-101.85|#CC0000|#000000|74
utah|Utah|UTAH|B12|Salt Lake City|UT|40.76|-111.85|#CC0000|#FFFFFF|72
byu|BYU|BYU|B12|Provo|UT|40.25|-111.65|#002E5D|#FFFFFF|71
arizona-state|Arizona State|ASU|B12|Tempe|AZ|33.42|-111.93|#8C1D40|#FFC627|70
tcu|TCU|TCU|B12|Fort Worth|TX|32.71|-97.36|#4D1979|#A3A9AC|69
kansas-state|Kansas State|KSU|B12|Manhattan|KS|39.19|-96.58|#512888|#FFFFFF|68
colorado|Colorado|COLO|B12|Boulder|CO|40.01|-105.27|#CFB87C|#000000|67
oklahoma-state|Oklahoma State|OKST|B12|Stillwater|OK|36.13|-97.07|#FF7300|#000000|65
baylor|Baylor|BAY|B12|Waco|TX|31.55|-97.12|#154734|#FFB81C|65
iowa-state|Iowa State|ISU|B12|Ames|IA|42.03|-93.65|#C8102E|#F1BE48|64
west-virginia|West Virginia|WVU|B12|Morgantown|WV|39.65|-79.95|#002855|#EAAA00|63
cincinnati|Cincinnati|CIN|B12|Cincinnati|OH|39.13|-84.52|#E00122|#000000|58
arizona|Arizona|ARIZ|B12|Tucson|AZ|32.23|-110.95|#CC0033|#003366|58
ucf|UCF|UCF|B12|Orlando|FL|28.60|-81.20|#000000|#BA9B37|58
houston|Houston|HOU|B12|Houston|TX|29.72|-95.34|#C8102E|#FFFFFF|56
kansas|Kansas|KU|B12|Lawrence|KS|38.95|-95.25|#0051BA|#E8000D|55
boise-state|Boise State|BSU|P12|Boise|ID|43.60|-116.20|#0033A0|#D64309|70
oregon-state|Oregon State|ORST|P12|Corvallis|OR|44.56|-123.28|#DC4405|#000000|56
washington-state|Washington State|WSU|P12|Pullman|WA|46.73|-117.16|#981E32|#5E6A71|55
fresno-state|Fresno State|FRES|P12|Fresno|CA|36.81|-119.75|#DB0032|#002E6D|52
texas-state|Texas State|TXST|P12|San Marcos|TX|29.89|-97.94|#501214|#8D734A|50
san-diego-state|San Diego State|SDSU|P12|San Diego|CA|32.78|-117.07|#A6192E|#000000|50
utah-state|Utah State|USU|P12|Logan|UT|41.75|-111.81|#0F2439|#8A8D8F|48
colorado-state|Colorado State|CSU|P12|Fort Collins|CO|40.57|-105.08|#1E4D2B|#C8C372|47
tulane|Tulane|TUL|AAC|New Orleans|LA|29.94|-90.12|#006747|#418FDE|62
memphis|Memphis|MEM|AAC|Memphis|TN|35.12|-89.94|#003087|#898D8D|60
army|Army|ARMY|AAC|West Point|NY|41.39|-73.96|#000000|#D3BC8D|55
navy|Navy|NAVY|AAC|Annapolis|MD|38.98|-76.49|#00205B|#C5B783|55
utsa|UTSA|UTSA|AAC|San Antonio|TX|29.58|-98.62|#0C2340|#F15A22|52
usf|USF|USF|AAC|Tampa|FL|28.06|-82.41|#006747|#CFC493|52
east-carolina|East Carolina|ECU|AAC|Greenville|NC|35.61|-77.37|#592A8A|#FDC82F|50
north-texas|North Texas|UNT|AAC|Denton|TX|33.21|-97.15|#00853E|#FFFFFF|50
uab|UAB|UAB|AAC|Birmingham|AL|33.50|-86.80|#1E6B52|#F4C300|45
fau|FAU|FAU|AAC|Boca Raton|FL|26.37|-80.10|#003366|#CC0000|43
tulsa|Tulsa|TLSA|AAC|Tulsa|OK|36.15|-95.94|#002D72|#C8102E|43
rice|Rice|RICE|AAC|Houston|TX|29.72|-95.40|#00205B|#C1C6C8|42
temple|Temple|TEM|AAC|Philadelphia|PA|39.98|-75.16|#9D2235|#FFFFFF|40
charlotte|Charlotte|CLT|AAC|Charlotte|NC|35.31|-80.74|#005035|#A49665|38
notre-dame|Notre Dame|ND|IND|Notre Dame|IN|41.70|-86.24|#0C2340|#C99700|92
`;

  const colleges = RAW.trim().split('\n').map((line) => {
    const [id, name, abbr, conf, city, state, lat, lon, c1, c2, prestige] = line.split('|');
    return { id, name, abbr, conf, city, state, lat: Number(lat), lon: Number(lon), colors: [c1, c2], prestige: Number(prestige), logo: 'assets/colleges/' + id + '.png' };
  });

  FNG.DATA.conferences = CONFERENCES;
  FNG.DATA.colleges = colleges;
})();
