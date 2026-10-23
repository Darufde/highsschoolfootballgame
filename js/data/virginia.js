/* Virginia geography: high school communities (City|County|Population|Lat|Lon) and rivers used for naming.
   Counties and independent cities both appear in the county column. Large county systems are listed
   by their high schools' communities (Fairfax, Loudoun, Prince William, Henrico, Chesterfield...). */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  const RAW = `
Centreville|Fairfax|40000|38.84|-77.43
Chantilly|Fairfax|40000|38.89|-77.43
Oakton|Fairfax|38000|38.88|-77.30
Madison|Fairfax|36000|38.90|-77.27
Langley|Fairfax|34000|38.95|-77.18
McLean|Fairfax|36000|38.93|-77.18
Herndon|Fairfax|40000|38.97|-77.39
South Lakes|Fairfax|36000|38.95|-77.33
Westfield|Fairfax|40000|38.87|-77.43
Lake Braddock|Fairfax|40000|38.80|-77.27
Robinson|Fairfax|40000|38.82|-77.29
West Springfield|Fairfax|36000|38.78|-77.25
Woodson|Fairfax|34000|38.84|-77.29
Annandale|Fairfax|38000|38.83|-77.20
Justice|Fairfax|34000|38.86|-77.17
Marshall|Fairfax|34000|38.90|-77.20
Hayfield|Fairfax|36000|38.75|-77.13
Mount Vernon|Fairfax|36000|38.72|-77.08
West Potomac|Fairfax|38000|38.76|-77.07
Edison|Fairfax|34000|38.79|-77.12
South County|Fairfax|38000|38.69|-77.21
Lewis|Fairfax|32000|38.78|-77.18
Falls Church|Fairfax|32000|38.86|-77.21
Fairfax|Fairfax|24000|38.85|-77.31
Arlington|Arlington|240000|38.88|-77.11
Alexandria|Alexandria|160000|38.80|-77.05
Loudoun County|Loudoun|28000|39.13|-77.57
Loudoun Valley|Loudoun|20000|39.15|-77.70
Broad Run|Loudoun|34000|39.05|-77.48
Stone Bridge|Loudoun|34000|39.03|-77.50
Potomac Falls|Loudoun|34000|39.06|-77.40
Dominion|Loudoun|34000|39.02|-77.36
Park View|Loudoun|28000|39.03|-77.40
Freedom|Loudoun|34000|38.95|-77.55
Briar Woods|Loudoun|34000|39.00|-77.50
Heritage|Loudoun|32000|39.07|-77.53
Tuscarora|Loudoun|30000|39.10|-77.58
Riverside|Loudoun|30000|39.06|-77.47
John Champe|Loudoun|32000|38.95|-77.58
Rock Ridge|Loudoun|32000|38.99|-77.51
Independence|Loudoun|30000|39.00|-77.55
Woodgrove|Loudoun|26000|39.15|-77.65
Battlefield|Prince William|36000|38.81|-77.67
Patriot|Prince William|36000|38.79|-77.59
Osbourn Park|Prince William|34000|38.76|-77.47
Forest Park|Prince William|34000|38.64|-77.36
Woodbridge|Prince William|36000|38.65|-77.29
Gar-Field|Prince William|34000|38.63|-77.31
Potomac|Prince William|30000|38.58|-77.33
Hylton|Prince William|36000|38.60|-77.38
Freedom Woodbridge|Prince William|32000|38.63|-77.33
Colgan|Prince William|36000|38.67|-77.44
Brentsville|Prince William|18000|38.73|-77.56
Unity Reed|Prince William|30000|38.77|-77.48
Manassas|Manassas|42000|38.75|-77.47
Manassas Park|Manassas Park|17000|38.78|-77.44
Stafford|Stafford|36000|38.42|-77.41
North Stafford|Stafford|36000|38.48|-77.42
Brooke Point|Stafford|34000|38.45|-77.39
Colonial Forge|Stafford|36000|38.40|-77.45
Mountain View|Stafford|34000|38.50|-77.45
Fredericksburg|Fredericksburg|29000|38.30|-77.46
Massaponax|Spotsylvania|32000|38.24|-77.52
Chancellor|Spotsylvania|28000|38.29|-77.56
Courtland|Spotsylvania|26000|38.24|-77.58
Spotsylvania|Spotsylvania|24000|38.20|-77.59
Riverbend|Spotsylvania|30000|38.28|-77.61
King George|King George|26000|38.27|-77.18
Caroline|Caroline|31000|38.05|-77.38
Culpeper|Culpeper|24000|38.47|-78.00
Eastern View|Culpeper|22000|38.43|-77.98
Fauquier|Fauquier|24000|38.71|-77.80
Liberty|Fauquier|22000|38.63|-77.75
Kettle Run|Fauquier|22000|38.74|-77.70
Warrenton|Fauquier|10000|38.71|-77.80
Winchester|Winchester|28000|39.19|-78.16
James Wood|Frederick|28000|39.20|-78.21
Millbrook|Frederick|26000|39.24|-78.17
Sherando|Frederick|28000|39.10|-78.20
Clarke County|Clarke|15000|39.15|-77.98
Warren County|Warren|20000|38.92|-78.19
Skyline|Warren|18000|38.95|-78.17
Strasburg|Shenandoah|7000|38.99|-78.36
Central Woodstock|Shenandoah|10000|38.88|-78.50
Stonewall Jackson|Shenandoah|8000|38.73|-78.64
Page County|Page|12000|38.66|-78.46
Luray|Page|6000|38.67|-78.46
Harrisonburg|Harrisonburg|54000|38.45|-78.87
Broadway|Rockingham|16000|38.61|-78.80
Turner Ashby|Rockingham|20000|38.42|-78.95
Spotswood|Rockingham|20000|38.37|-78.82
East Rockingham|Rockingham|14000|38.43|-78.62
Staunton|Staunton|25000|38.15|-79.07
Waynesboro|Waynesboro|22000|38.07|-78.89
Fort Defiance|Augusta|16000|38.23|-78.94
Buffalo Gap|Augusta|10000|38.18|-79.23
Riverheads|Augusta|9000|38.06|-79.13
Stuarts Draft|Augusta|14000|38.03|-79.03
Wilson Memorial|Augusta|14000|38.11|-78.98
Charlottesville|Charlottesville|46000|38.03|-78.48
Albemarle|Albemarle|36000|38.05|-78.52
Western Albemarle|Albemarle|26000|38.07|-78.69
Monticello|Albemarle|30000|38.00|-78.48
Fluvanna County|Fluvanna|27000|37.84|-78.27
Louisa County|Louisa|37000|38.02|-77.99
Orange County|Orange|36000|38.25|-78.11
Madison County|Madison|13000|38.38|-78.26
Greene County|Greene|20000|38.30|-78.47
Nelson County|Nelson|14000|37.79|-78.88
Goochland|Goochland|24000|37.68|-77.89
Powhatan|Powhatan|30000|37.54|-77.92
Cumberland|Cumberland|10000|37.50|-78.25
Buckingham County|Buckingham|17000|37.55|-78.55
Amherst County|Amherst|31000|37.58|-79.05
Lynchburg|Lynchburg|79000|37.41|-79.14
Brookville|Campbell|20000|37.37|-79.24
Rustburg|Campbell|16000|37.27|-79.10
William Campbell|Campbell|12000|37.08|-79.07
Altavista|Campbell|6000|37.11|-79.29
Jefferson Forest|Bedford|26000|37.37|-79.35
Liberty Bedford|Bedford|24000|37.33|-79.52
Staunton River|Bedford|22000|37.22|-79.69
Appomattox County|Appomattox|16000|37.36|-78.83
Prince Edward County|Prince Edward|21000|37.30|-78.39
Nottoway|Nottoway|15000|37.11|-78.07
Amelia County|Amelia|13000|37.34|-77.98
Charlotte County|Charlotte|12000|37.03|-78.66
Randolph-Henry|Charlotte|8000|37.01|-78.64
Halifax County|Halifax|34000|36.77|-78.93
Mecklenburg County|Mecklenburg|30000|36.68|-78.38
Park View Mecklenburg|Mecklenburg|10000|36.64|-78.40
Brunswick|Brunswick|16000|36.76|-77.85
Greensville County|Greensville|11000|36.69|-77.54
Lunenburg|Lunenburg|12000|36.96|-78.27
Danville|Danville|42000|36.59|-79.40
George Washington Danville|Danville|20000|36.57|-79.42
Tunstall|Pittsylvania|20000|36.65|-79.38
Chatham|Pittsylvania|15000|36.83|-79.40
Dan River|Pittsylvania|14000|36.66|-79.22
Gretna|Pittsylvania|12000|36.95|-79.36
Martinsville|Martinsville|13000|36.69|-79.87
Bassett|Henry|20000|36.77|-79.99
Magna Vista|Henry|22000|36.66|-79.83
Patrick County|Patrick|17000|36.64|-80.27
Floyd County|Floyd|16000|36.91|-80.32
Franklin County|Franklin|56000|37.00|-79.89
Roanoke|Roanoke|100000|37.27|-79.94
Patrick Henry Roanoke|Roanoke|30000|37.26|-79.98
William Fleming|Roanoke|28000|37.31|-79.96
Salem|Salem|25000|37.29|-80.05
Cave Spring|Roanoke County|26000|37.21|-80.03
Hidden Valley|Roanoke County|24000|37.22|-80.07
Northside|Roanoke County|24000|37.33|-79.95
William Byrd|Roanoke County|24000|37.31|-79.83
Glenvar|Roanoke County|14000|37.27|-80.16
Lord Botetourt|Botetourt|20000|37.42|-79.81
James River|Botetourt|12000|37.58|-79.79
Craig County|Craig|5000|37.48|-80.21
Alleghany|Alleghany|15000|37.79|-79.89
Covington|Covington|6000|37.79|-79.99
Bath County|Bath|4000|38.00|-79.83
Highland|Highland|2500|38.42|-79.58
Rockbridge County|Rockbridge|22000|37.78|-79.42
Parry McCluer|Buena Vista|6600|37.73|-79.35
Blacksburg|Montgomery|45000|37.23|-80.41
Christiansburg|Montgomery|24000|37.13|-80.41
Auburn|Montgomery|10000|37.07|-80.36
Eastern Montgomery|Montgomery|10000|37.17|-80.23
Radford|Radford|18000|37.13|-80.58
Pulaski County|Pulaski|34000|37.05|-80.72
Giles|Giles|12000|37.33|-80.71
Narrows|Giles|5000|37.33|-80.81
Carroll County|Carroll|29000|36.73|-80.73
Galax|Galax|7000|36.66|-80.92
Grayson County|Grayson|15000|36.66|-81.13
Wythe|Wythe|20000|36.95|-81.08
Rural Retreat|Wythe|9000|36.90|-81.28
Fort Chiswell|Wythe|9000|36.94|-80.94
Marion|Smyth|12000|36.83|-81.52
Chilhowie|Smyth|8000|36.80|-81.68
Northwood|Smyth|8000|36.89|-81.71
Abingdon|Washington|24000|36.71|-81.98
Patrick Henry Glade Spring|Washington|12000|36.79|-81.77
John Battle|Washington|14000|36.65|-82.12
Holston|Washington|10000|36.74|-81.87
Bristol|Bristol|17000|36.60|-82.19
Gate City|Scott|14000|36.64|-82.58
Twin Springs|Scott|8000|36.75|-82.46
Rye Cove|Scott|6000|36.69|-82.71
Lee|Lee|23000|36.69|-83.13
Thomas Walker|Lee|6000|36.63|-83.38
Union|Wise|18000|36.87|-82.75
Central Wise|Wise|16000|36.98|-82.58
Eastside|Wise|10000|36.95|-82.47
J.I. Burton|Norton|4000|36.93|-82.63
Ridgeview|Dickenson|14000|37.15|-82.39
Grundy|Buchanan|10000|37.28|-82.10
Hurley|Buchanan|6000|37.43|-82.03
Council|Buchanan|5000|37.08|-82.06
Honaker|Russell|9000|37.02|-81.97
Lebanon|Russell|12000|36.90|-82.08
Castlewood|Russell|7000|36.89|-82.28
Richlands|Tazewell|18000|37.09|-81.79
Tazewell|Tazewell|18000|37.12|-81.52
Graham|Tazewell|14000|37.22|-81.32
Bland County|Bland|6000|37.10|-81.12
Richmond|Richmond|230000|37.54|-77.44
Henrico|Henrico|34000|37.55|-77.39
Highland Springs|Henrico|36000|37.54|-77.33
Varina|Henrico|34000|37.47|-77.36
Hermitage|Henrico|34000|37.62|-77.52
Glen Allen|Henrico|36000|37.67|-77.51
Deep Run|Henrico|36000|37.64|-77.61
Godwin|Henrico|34000|37.60|-77.61
Freeman|Henrico|32000|37.60|-77.56
Tucker|Henrico|30000|37.59|-77.53
Hanover|Hanover|34000|37.73|-77.33
Atlee|Hanover|32000|37.65|-77.40
Patrick Henry Ashland|Hanover|28000|37.76|-77.48
Lee-Davis|Hanover|30000|37.62|-77.28
Midlothian|Chesterfield|36000|37.51|-77.65
James River Chesterfield|Chesterfield|36000|37.47|-77.73
Cosby|Chesterfield|40000|37.40|-77.67
Clover Hill|Chesterfield|38000|37.41|-77.60
Manchester|Chesterfield|40000|37.44|-77.55
Monacan|Chesterfield|34000|37.47|-77.58
L.C. Bird|Chesterfield|36000|37.39|-77.48
Matoaca|Chesterfield|36000|37.27|-77.48
Meadowbrook|Chesterfield|34000|37.43|-77.47
Thomas Dale|Chesterfield|40000|37.34|-77.40
Cosby Woods|Chesterfield|30000|37.37|-77.71
Petersburg|Petersburg|33000|37.23|-77.40
Colonial Heights|Colonial Heights|18000|37.26|-77.40
Hopewell|Hopewell|23000|37.30|-77.29
Prince George|Prince George|43000|37.22|-77.29
Dinwiddie|Dinwiddie|28000|37.08|-77.59
Sussex Central|Sussex|11000|36.91|-77.28
Surry County|Surry|6500|37.14|-76.83
Southampton|Southampton|18000|36.70|-77.02
Franklin City|Franklin City|8000|36.68|-76.92
Isle of Wight|Isle of Wight|20000|36.92|-76.70
Smithfield|Isle of Wight|18000|36.98|-76.63
Nansemond River|Suffolk|32000|36.80|-76.48
King's Fork|Suffolk|32000|36.71|-76.60
Lakeland Suffolk|Suffolk|30000|36.73|-76.62
Chesapeake|Chesapeake|40000|36.77|-76.29
Great Bridge|Chesapeake|36000|36.72|-76.24
Hickory|Chesapeake|38000|36.65|-76.24
Grassfield|Chesapeake|38000|36.73|-76.20
Indian River Chesapeake|Chesapeake|36000|36.78|-76.22
Oscar Smith|Chesapeake|40000|36.79|-76.27
Deep Creek|Chesapeake|34000|36.74|-76.36
Western Branch|Chesapeake|36000|36.82|-76.40
Portsmouth|Portsmouth|30000|36.84|-76.30
Wilson Portsmouth|Portsmouth|28000|36.81|-76.36
Churchland|Portsmouth|28000|36.86|-76.40
Norfolk|Norfolk|240000|36.85|-76.29
Virginia Beach|Virginia Beach|40000|36.85|-76.03
Kempsville|Virginia Beach|36000|36.82|-76.14
Ocean Lakes|Virginia Beach|40000|36.76|-76.03
Landstown|Virginia Beach|40000|36.78|-76.11
Kellam|Virginia Beach|38000|36.74|-76.07
Salem Virginia Beach|Virginia Beach|36000|36.80|-76.13
Tallwood|Virginia Beach|36000|36.80|-76.20
Princess Anne|Virginia Beach|36000|36.80|-76.07
First Colonial|Virginia Beach|36000|36.87|-76.03
Cox|Virginia Beach|36000|36.88|-76.06
Bayside|Virginia Beach|34000|36.89|-76.14
Green Run|Virginia Beach|34000|36.81|-76.08
Hampton|Hampton|34000|37.03|-76.35
Kecoughtan|Hampton|32000|37.02|-76.33
Phoebus|Hampton|28000|37.02|-76.31
Bethel|Hampton|34000|37.06|-76.40
Newport News|Newport News|180000|37.09|-76.47
Poquoson|Poquoson|12000|37.12|-76.35
York|York|24000|37.20|-76.49
Tabb|York|24000|37.13|-76.43
Grafton|York|24000|37.16|-76.47
Bruton|York|10000|37.27|-76.65
Jamestown|James City|26000|37.24|-76.80
Lafayette|James City|26000|37.28|-76.72
Warhill|James City|26000|37.32|-76.78
New Kent|New Kent|24000|37.52|-77.01
West Point|West Point|3300|37.53|-76.80
King William|King William|17000|37.69|-77.01
Gloucester|Gloucester|38000|37.41|-76.53
Mathews|Mathews|8800|37.43|-76.32
Middlesex|Middlesex|10000|37.61|-76.53
Essex|Essex|11000|37.92|-76.86
Rappahannock County|Rappahannock|7000|38.68|-78.17
Lancaster|Lancaster|10000|37.75|-76.46
Northumberland|Northumberland|12000|37.88|-76.43
Westmoreland|Westmoreland|18000|38.11|-76.81
Colonial Beach|Westmoreland|3500|38.25|-76.96
Arcadia|Accomack|14000|37.89|-75.66
Nandua|Accomack|14000|37.66|-75.82
Chincoteague|Accomack|3000|37.93|-75.38
Northampton|Northampton|12000|37.35|-75.92
Charles City|Charles City|7000|37.34|-77.07
King and Queen|King and Queen|7000|37.68|-76.88
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
    ['James River', 37.5, -78.2], ['Potomac', 38.9, -77.4], ['Rappahannock', 38.3, -77.5], ['Shenandoah', 38.8, -78.4],
    ['New River', 37.0, -80.8], ['Roanoke', 37.2, -79.6], ['York River', 37.4, -76.7], ['Appomattox', 37.3, -78.1],
    ['Clinch', 36.9, -82.3], ['Holston', 36.7, -81.9], ['Dan River', 36.6, -79.4], ['Mattaponi', 37.8, -77.1],
    ['Pamunkey', 37.7, -77.2], ['Rivanna', 38.0, -78.4], ['Occoquan', 38.7, -77.3], ['Elizabeth River', 36.8, -76.3],
    ['Nottoway', 36.8, -77.3], ['Staunton River', 37.0, -79.0], ['Big Sandy', 37.3, -82.2], ['Blackwater', 36.8, -76.9],
    ['Maury', 37.8, -79.4], ['Cowpasture', 38.0, -79.7], ['Meherrin', 36.7, -77.8], ['Chickahominy', 37.4, -77.2],
  ].map(([name, lat, lon]) => ({ name, lat, lon }));

  FNG.DATA.virginia = {
    key: 'VA',
    name: 'Virginia',
    center: { lat: 37.7, lon: -78.6 },
    cities,
    rivers,
    ruralExtras: false,
  };

  // VHSL football: six classes by enrollment (6A largest), grouped into districts.
  FNG.States.register({
    key: 'VA',
    name: 'Virginia',
    assoc: 'VHSL',
    data: FNG.DATA.virginia,
    generator: 'places',
    classes: { count: 6, method: 'equal' },
    labels: 'A',
    leagues: { style: 'conferences', word: 'District', catholicMaxDiv: 3 },
    talent: -0.5,
    depth: 0.1,
    neighbors: ['MD', 'DC', 'WV', 'KY', 'TN', 'NC'],
  });
})();
