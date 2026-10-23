/* Ohio geography: places (City|County|Population|Lat|Lon) and rivers used for naming. */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  const RAW = `
West Union|Adams|3200|38.79|-83.55
Peebles|Adams|1800|38.95|-83.41
Manchester|Adams|2000|38.69|-83.61
Lima|Allen|35500|40.74|-84.11
Delphos|Allen|7100|40.84|-84.34
Bluffton|Allen|4100|40.89|-83.89
Spencerville|Allen|2200|40.71|-84.35
Elida|Allen|1900|40.79|-84.20
Ashland|Ashland|19900|40.87|-82.32
Loudonville|Ashland|2600|40.63|-82.23
Ashtabula|Ashtabula|17800|41.87|-80.79
Conneaut|Ashtabula|12500|41.95|-80.55
Geneva|Ashtabula|6000|41.80|-80.95
Jefferson|Ashtabula|3300|41.74|-80.77
Andover|Ashtabula|1100|41.61|-80.57
Orwell|Ashtabula|1600|41.54|-80.87
Rock Creek|Ashtabula|500|41.66|-80.86
Athens|Athens|23000|39.33|-82.10
Nelsonville|Athens|5000|39.46|-82.23
The Plains|Athens|3000|39.37|-82.13
Albany|Athens|800|39.22|-82.20
Glouster|Athens|1800|39.50|-82.08
Wapakoneta|Auglaize|9900|40.57|-84.19
St. Marys|Auglaize|8200|40.54|-84.39
New Bremen|Auglaize|3000|40.44|-84.38
Minster|Auglaize|2900|40.39|-84.38
New Knoxville|Auglaize|900|40.49|-84.31
Cridersville|Auglaize|1800|40.65|-84.15
St. Clairsville|Belmont|5000|40.08|-80.90
Martins Ferry|Belmont|6500|40.10|-80.72
Bellaire|Belmont|4000|40.02|-80.74
Barnesville|Belmont|4000|39.99|-81.18
Shadyside|Belmont|3600|39.97|-80.75
Bridgeport|Belmont|1800|40.07|-80.74
Georgetown|Brown|4300|38.86|-83.90
Ripley|Brown|1700|38.75|-83.84
Mount Orab|Brown|3700|39.03|-83.92
Fayetteville|Brown|1300|39.19|-83.93
Sardinia|Brown|1000|38.98|-83.80
Hamilton|Butler|63000|39.40|-84.56
Middletown|Butler|50000|39.52|-84.40
Fairfield|Butler|44000|39.35|-84.56
Oxford|Butler|23000|39.51|-84.75
West Chester|Butler|64000|39.33|-84.41
Monroe|Butler|15000|39.44|-84.36
Trenton|Butler|13000|39.48|-84.46
Ross|Butler|3400|39.32|-84.65
Liberty Township|Butler|40000|39.38|-84.39
Carrollton|Carroll|3200|40.57|-81.09
Malvern|Carroll|1100|40.69|-81.18
Urbana|Champaign|11000|40.11|-83.75
Mechanicsburg|Champaign|1600|40.07|-83.56
St. Paris|Champaign|2000|40.13|-83.96
North Lewisburg|Champaign|1500|40.22|-83.56
Springfield|Clark|58000|39.92|-83.81
New Carlisle|Clark|5600|39.94|-84.03
South Charleston|Clark|1700|39.83|-83.64
Enon|Clark|2400|39.88|-83.94
Batavia|Clermont|1900|39.08|-84.18
Milford|Clermont|6700|39.18|-84.29
Goshen|Clermont|1000|39.23|-84.16
Bethel|Clermont|2700|38.96|-84.08
New Richmond|Clermont|2600|38.95|-84.28
Amelia|Clermont|4800|39.03|-84.22
Williamsburg|Clermont|2500|39.05|-84.05
Felicity|Clermont|800|38.84|-84.10
Loveland|Clermont|13000|39.27|-84.26
Union Township|Clermont|48000|39.09|-84.27
Wilmington|Clinton|12500|39.45|-83.83
Blanchester|Clinton|4200|39.29|-83.99
Sabina|Clinton|2500|39.49|-83.64
East Liverpool|Columbiana|10000|40.62|-80.58
Salem|Columbiana|11800|40.90|-80.86
Columbiana|Columbiana|6500|40.89|-80.69
Lisbon|Columbiana|2800|40.77|-80.77
Wellsville|Columbiana|3200|40.60|-80.65
East Palestine|Columbiana|4700|40.83|-80.54
Leetonia|Columbiana|1900|40.88|-80.76
Hanoverton|Columbiana|400|40.75|-80.94
Coshocton|Coshocton|11000|40.27|-81.86
West Lafayette|Coshocton|2300|40.28|-81.75
Bucyrus|Crawford|11700|40.81|-82.98
Galion|Crawford|10400|40.73|-82.79
Crestline|Crawford|4500|40.79|-82.74
New Washington|Crawford|900|40.96|-82.85
Cleveland|Cuyahoga|370000|41.50|-81.69
Parma|Cuyahoga|80000|41.40|-81.72
Lakewood|Cuyahoga|50000|41.48|-81.80
Euclid|Cuyahoga|49000|41.59|-81.53
Cleveland Heights|Cuyahoga|45000|41.52|-81.56
Strongsville|Cuyahoga|46000|41.31|-81.84
North Olmsted|Cuyahoga|32000|41.42|-81.92
Westlake|Cuyahoga|34000|41.46|-81.93
Shaker Heights|Cuyahoga|29000|41.47|-81.54
Garfield Heights|Cuyahoga|29000|41.42|-81.61
Brook Park|Cuyahoga|18000|41.40|-81.80
Berea|Cuyahoga|19000|41.37|-81.85
Solon|Cuyahoga|24000|41.39|-81.44
Maple Heights|Cuyahoga|23000|41.41|-81.57
North Royalton|Cuyahoga|31000|41.31|-81.72
Rocky River|Cuyahoga|21000|41.48|-81.84
Bay Village|Cuyahoga|16000|41.48|-81.92
Brecksville|Cuyahoga|13600|41.32|-81.63
Independence|Cuyahoga|7500|41.37|-81.64
Mayfield Heights|Cuyahoga|19000|41.52|-81.46
Beachwood|Cuyahoga|14000|41.46|-81.51
Bedford|Cuyahoga|13000|41.39|-81.54
Brooklyn|Cuyahoga|11000|41.44|-81.74
Fairview Park|Cuyahoga|17000|41.44|-81.86
Olmsted Falls|Cuyahoga|9000|41.37|-81.91
Richmond Heights|Cuyahoga|10500|41.55|-81.51
South Euclid|Cuyahoga|22000|41.52|-81.52
Warrensville Heights|Cuyahoga|13000|41.43|-81.53
East Cleveland|Cuyahoga|14000|41.53|-81.58
Chagrin Falls|Cuyahoga|4100|41.43|-81.39
Cuyahoga Heights|Cuyahoga|600|41.43|-81.65
Orange|Cuyahoga|3300|41.44|-81.48
Greenville|Darke|13000|40.10|-84.63
Versailles|Darke|2700|40.22|-84.48
Arcanum|Darke|2100|39.99|-84.55
Ansonia|Darke|1100|40.21|-84.64
Union City|Darke|1600|40.20|-84.80
New Madison|Darke|900|39.97|-84.71
Defiance|Defiance|17000|41.28|-84.36
Hicksville|Defiance|3500|41.29|-84.76
Sherwood|Defiance|800|41.29|-84.55
Delaware|Delaware|41000|40.30|-83.07
Powell|Delaware|14000|40.16|-83.08
Lewis Center|Delaware|30000|40.19|-83.01
Sunbury|Delaware|6600|40.24|-82.86
Ashley|Delaware|1300|40.41|-82.95
Sandusky|Erie|25000|41.45|-82.71
Huron|Erie|7000|41.39|-82.56
Vermilion|Erie|10500|41.42|-82.36
Milan|Erie|1400|41.30|-82.60
Berlin Heights|Erie|700|41.33|-82.50
Perkins Township|Erie|12000|41.39|-82.72
Lancaster|Fairfield|41000|39.71|-82.60
Pickerington|Fairfield|23000|39.88|-82.75
Canal Winchester|Fairfield|9500|39.84|-82.80
Baltimore|Fairfield|3000|39.85|-82.60
Bremen|Fairfield|1400|39.70|-82.43
Amanda|Fairfield|700|39.65|-82.74
Carroll|Fairfield|500|39.80|-82.70
Washington Court House|Fayette|14000|39.54|-83.44
Jeffersonville|Fayette|1200|39.65|-83.56
Columbus|Franklin|905000|39.96|-83.00
Dublin|Franklin|49000|40.10|-83.11
Westerville|Franklin|39000|40.13|-82.93
Hilliard|Franklin|37000|40.03|-83.16
Upper Arlington|Franklin|36000|40.00|-83.06
Grove City|Franklin|42000|39.88|-83.09
Reynoldsburg|Franklin|41000|39.95|-82.81
Gahanna|Franklin|35000|40.02|-82.88
Worthington|Franklin|15000|40.09|-83.02
Whitehall|Franklin|20000|39.97|-82.89
Bexley|Franklin|13900|39.97|-82.94
Groveport|Franklin|6000|39.85|-82.88
New Albany|Franklin|11000|40.08|-82.81
Grandview Heights|Franklin|8300|39.98|-83.04
Wauseon|Fulton|7500|41.55|-84.14
Archbold|Fulton|4500|41.52|-84.31
Delta|Fulton|3100|41.57|-84.00
Swanton|Fulton|3900|41.59|-83.89
Fayette|Fulton|1300|41.67|-84.33
Pettisville|Fulton|500|41.53|-84.23
Gallipolis|Gallia|3200|38.81|-82.20
Bidwell|Gallia|2000|38.92|-82.29
Chardon|Geauga|5200|41.58|-81.21
Chesterland|Geauga|2500|41.52|-81.34
Middlefield|Geauga|2700|41.46|-81.07
Burton|Geauga|1400|41.47|-81.15
Newbury|Geauga|5000|41.50|-81.23
Bainbridge Township|Geauga|11000|41.39|-81.34
Xenia|Greene|26000|39.68|-83.93
Beavercreek|Greene|47000|39.71|-84.06
Fairborn|Greene|34000|39.82|-84.02
Bellbrook|Greene|7400|39.64|-84.07
Yellow Springs|Greene|3700|39.81|-83.89
Cedarville|Greene|4000|39.74|-83.81
Jamestown|Greene|2000|39.66|-83.73
Cambridge|Guernsey|10000|40.03|-81.59
Byesville|Guernsey|2400|39.97|-81.54
Cincinnati|Hamilton|310000|39.10|-84.51
Norwood|Hamilton|19000|39.16|-84.46
Sharonville|Hamilton|14000|39.27|-84.41
Forest Park|Hamilton|20000|39.29|-84.53
Harrison|Hamilton|12500|39.26|-84.82
Montgomery|Hamilton|10800|39.23|-84.35
Mariemont|Hamilton|3400|39.14|-84.37
Reading|Hamilton|10000|39.22|-84.44
Wyoming|Hamilton|8500|39.23|-84.47
Indian Hill|Hamilton|6000|39.18|-84.34
Madeira|Hamilton|9000|39.19|-84.36
Deer Park|Hamilton|5500|39.21|-84.40
North College Hill|Hamilton|9300|39.22|-84.55
Mount Healthy|Hamilton|6000|39.23|-84.55
Lockland|Hamilton|3500|39.23|-84.46
St. Bernard|Hamilton|4300|39.17|-84.50
Cheviot|Hamilton|8300|39.16|-84.61
Anderson Township|Hamilton|44000|39.08|-84.35
Colerain Township|Hamilton|59000|39.25|-84.60
Green Township|Hamilton|58000|39.15|-84.63
Sycamore Township|Hamilton|19000|39.25|-84.37
Findlay|Hancock|41000|41.04|-83.65
Arlington|Hancock|1500|40.89|-83.65
McComb|Hancock|1600|41.11|-83.79
Van Buren|Hancock|400|41.14|-83.65
Arcadia|Hancock|500|41.11|-83.52
Vanlue|Hancock|300|40.97|-83.48
Kenton|Hardin|8100|40.65|-83.61
Ada|Hardin|5300|40.77|-83.82
Forest|Hardin|1400|40.80|-83.51
Cadiz|Harrison|3300|40.27|-81.00
Scio|Harrison|700|40.40|-81.08
Napoleon|Henry|8800|41.39|-84.13
Deshler|Henry|1800|41.21|-83.90
Liberty Center|Henry|1100|41.44|-84.01
Holgate|Henry|1100|41.25|-84.13
Hillsboro|Highland|6600|39.20|-83.61
Greenfield|Highland|4600|39.35|-83.38
Leesburg|Highland|1300|39.34|-83.55
Lynchburg|Highland|1400|39.24|-83.79
Logan|Hocking|7300|39.54|-82.41
Millersburg|Holmes|3000|40.55|-81.92
Norwalk|Huron|17000|41.24|-82.62
Willard|Huron|6000|41.05|-82.73
Bellevue|Huron|8200|41.27|-82.84
Monroeville|Huron|1400|41.24|-82.70
New London|Huron|2400|41.09|-82.40
Wakeman|Huron|1000|41.25|-82.40
Plymouth|Huron|1800|40.99|-82.67
Jackson|Jackson|6300|39.05|-82.64
Wellston|Jackson|5400|39.12|-82.53
Oak Hill|Jackson|1500|38.89|-82.57
Steubenville|Jefferson|18000|40.37|-80.63
Toronto|Jefferson|5000|40.46|-80.60
Wintersville|Jefferson|3900|40.38|-80.70
Mingo Junction|Jefferson|3400|40.32|-80.61
Mount Vernon|Knox|16900|40.39|-82.49
Fredericktown|Knox|2500|40.48|-82.54
Danville|Knox|1000|40.45|-82.26
Centerburg|Knox|1800|40.30|-82.70
Gambier|Knox|2400|40.38|-82.40
Mentor|Lake|47000|41.67|-81.34
Willoughby|Lake|23000|41.64|-81.41
Painesville|Lake|20000|41.72|-81.25
Eastlake|Lake|18000|41.65|-81.45
Wickliffe|Lake|12700|41.61|-81.47
Madison|Lake|3300|41.77|-81.05
Perry|Lake|1700|41.76|-81.14
Kirtland|Lake|6900|41.63|-81.36
Ironton|Lawrence|10500|38.54|-82.68
Chesapeake|Lawrence|700|38.43|-82.46
South Point|Lawrence|3900|38.42|-82.59
Newark|Licking|50000|40.06|-82.40
Heath|Licking|10400|40.02|-82.44
Granville|Licking|5900|40.07|-82.52
Pataskala|Licking|17000|40.00|-82.67
Johnstown|Licking|5100|40.15|-82.69
Utica|Licking|2100|40.23|-82.45
Hebron|Licking|2300|39.96|-82.49
Bellefontaine|Logan|14000|40.36|-83.76
West Liberty|Logan|1800|40.25|-83.76
Lorain|Lorain|65000|41.45|-82.18
Elyria|Lorain|53000|41.37|-82.11
North Ridgeville|Lorain|35000|41.39|-82.02
Avon Lake|Lorain|25000|41.51|-82.03
Avon|Lorain|24000|41.45|-82.04
Amherst|Lorain|12000|41.40|-82.22
Oberlin|Lorain|8300|41.29|-82.22
Wellington|Lorain|4800|41.17|-82.22
Grafton|Lorain|6000|41.27|-82.05
Columbia Station|Lorain|7000|41.31|-81.94
Sheffield Lake|Lorain|9000|41.49|-82.10
LaGrange|Lorain|2300|41.24|-82.12
Toledo|Lucas|270000|41.66|-83.56
Sylvania|Lucas|19000|41.72|-83.71
Oregon|Lucas|20000|41.64|-83.49
Maumee|Lucas|14000|41.56|-83.65
Holland|Lucas|1700|41.62|-83.71
Waterville|Lucas|6000|41.50|-83.72
Whitehouse|Lucas|5000|41.52|-83.80
Ottawa Hills|Lucas|4500|41.67|-83.64
London|Madison|10000|39.89|-83.45
Plain City|Madison|4500|40.11|-83.27
West Jefferson|Madison|4300|39.94|-83.27
Mount Sterling|Madison|1800|39.72|-83.27
Youngstown|Mahoning|60000|41.10|-80.65
Boardman|Mahoning|35000|41.02|-80.66
Austintown|Mahoning|30000|41.10|-80.76
Canfield|Mahoning|7500|41.02|-80.76
Struthers|Mahoning|10000|41.05|-80.61
Campbell|Mahoning|7800|41.08|-80.60
Poland|Mahoning|2500|41.02|-80.61
Sebring|Mahoning|4200|40.92|-81.02
Lowellville|Mahoning|1100|41.03|-80.54
North Lima|Mahoning|1200|40.95|-80.66
Marion|Marion|36000|40.59|-83.13
Caledonia|Marion|600|40.64|-82.97
Prospect|Marion|1100|40.45|-83.19
LaRue|Marion|700|40.58|-83.38
Medina|Medina|26000|41.14|-81.86
Brunswick|Medina|35000|41.24|-81.84
Wadsworth|Medina|24000|41.03|-81.73
Lodi|Medina|2700|41.03|-82.01
Seville|Medina|2300|41.01|-81.86
Hinckley|Medina|7700|41.24|-81.75
Pomeroy|Meigs|1700|39.03|-82.03
Racine|Meigs|700|38.97|-81.91
Tuppers Plains|Meigs|500|39.17|-81.84
Celina|Mercer|10400|40.55|-84.57
Coldwater|Mercer|4400|40.48|-84.63
Fort Recovery|Mercer|1500|40.41|-84.78
St. Henry|Mercer|2600|40.42|-84.64
Rockford|Mercer|1100|40.69|-84.65
Troy|Miami|26000|40.04|-84.20
Piqua|Miami|20500|40.14|-84.24
Tipp City|Miami|10000|39.96|-84.17
West Milton|Miami|4700|39.96|-84.33
Covington|Miami|2600|40.12|-84.35
Bradford|Miami|1800|40.13|-84.43
Pleasant Hill|Miami|1200|40.05|-84.34
Woodsfield|Monroe|2300|39.76|-81.12
Dayton|Montgomery|137000|39.76|-84.19
Kettering|Montgomery|57000|39.69|-84.17
Huber Heights|Montgomery|43000|39.84|-84.12
Centerville|Montgomery|24000|39.63|-84.16
Miamisburg|Montgomery|20000|39.64|-84.29
Trotwood|Montgomery|23000|39.80|-84.31
Vandalia|Montgomery|15000|39.89|-84.20
Englewood|Montgomery|13500|39.88|-84.30
Riverside|Montgomery|25000|39.78|-84.12
Oakwood|Montgomery|9500|39.73|-84.17
West Carrollton|Montgomery|13000|39.67|-84.25
Brookville|Montgomery|6000|39.84|-84.41
Germantown|Montgomery|5600|39.63|-84.37
Clayton|Montgomery|13000|39.86|-84.36
McConnelsville|Morgan|1700|39.65|-81.85
Mount Gilead|Morrow|3600|40.55|-82.83
Cardington|Morrow|2000|40.50|-82.89
Zanesville|Muskingum|25000|39.94|-82.01
New Concord|Muskingum|2500|39.99|-81.73
Dresden|Muskingum|1500|40.12|-82.01
Roseville|Muskingum|1800|39.81|-82.07
Caldwell|Noble|1700|39.75|-81.52
Port Clinton|Ottawa|6000|41.51|-82.94
Oak Harbor|Ottawa|2700|41.51|-83.15
Genoa|Ottawa|2300|41.52|-83.36
Elmore|Ottawa|1400|41.48|-83.30
Paulding|Paulding|3400|41.14|-84.58
Antwerp|Paulding|1700|41.18|-84.74
Payne|Paulding|1100|41.08|-84.73
New Lexington|Perry|4700|39.71|-82.21
Crooksville|Perry|2500|39.77|-82.09
Somerset|Perry|1500|39.81|-82.30
Thornville|Perry|1000|39.89|-82.42
Circleville|Pickaway|14000|39.60|-82.95
Ashville|Pickaway|4500|39.72|-82.95
Williamsport|Pickaway|1000|39.58|-83.12
Waverly|Pike|4400|39.13|-82.98
Piketon|Pike|2200|39.07|-83.01
Beaver|Pike|400|39.03|-82.82
Kent|Portage|28000|41.15|-81.36
Ravenna|Portage|11000|41.16|-81.24
Streetsboro|Portage|17000|41.24|-81.35
Aurora|Portage|17000|41.32|-81.35
Garrettsville|Portage|2300|41.28|-81.10
Mantua|Portage|1000|41.28|-81.22
Rootstown|Portage|8000|41.10|-81.24
Windham|Portage|2200|41.24|-81.05
Eaton|Preble|8300|39.74|-84.64
Camden|Preble|2000|39.63|-84.65
Lewisburg|Preble|1800|39.85|-84.54
New Paris|Preble|1600|39.86|-84.79
West Alexandria|Preble|1300|39.74|-84.53
Ottawa|Putnam|4300|41.02|-84.05
Columbus Grove|Putnam|2100|40.92|-84.06
Leipsic|Putnam|2100|41.10|-83.98
Kalida|Putnam|1100|40.98|-84.20
Ottoville|Putnam|900|40.93|-84.34
Pandora|Putnam|1100|40.95|-83.96
Fort Jennings|Putnam|500|40.90|-84.30
Continental|Putnam|1100|41.10|-84.27
Mansfield|Richland|47000|40.76|-82.52
Ontario|Richland|6200|40.76|-82.59
Shelby|Richland|9300|40.88|-82.66
Lexington|Richland|4800|40.68|-82.58
Bellville|Richland|1900|40.62|-82.51
Butler|Richland|900|40.59|-82.42
Lucas|Richland|600|40.70|-82.42
Chillicothe|Ross|22000|39.33|-82.98
Frankfort|Ross|1000|39.40|-83.18
Kingston|Ross|1000|39.47|-82.91
Bainbridge|Ross|900|39.23|-83.27
Fremont|Sandusky|16000|41.35|-83.12
Clyde|Sandusky|6300|41.30|-82.98
Woodville|Sandusky|2000|41.45|-83.36
Gibsonburg|Sandusky|2500|41.38|-83.32
Portsmouth|Scioto|20000|38.73|-83.00
Wheelersburg|Scioto|6400|38.73|-82.86
Lucasville|Scioto|2700|38.88|-83.00
Minford|Scioto|700|38.86|-82.86
New Boston|Scioto|2200|38.75|-82.94
South Webster|Scioto|900|38.82|-82.73
McDermott|Scioto|400|38.83|-83.06
West Portsmouth|Scioto|3100|38.76|-83.03
Tiffin|Seneca|17900|41.11|-83.18
Fostoria|Seneca|13000|41.16|-83.42
Attica|Seneca|900|41.07|-82.89
New Riegel|Seneca|250|41.05|-83.32
Sidney|Shelby|20000|40.28|-84.16
Anna|Shelby|1600|40.40|-84.17
Botkins|Shelby|1100|40.47|-84.18
Fort Loramie|Shelby|1500|40.35|-84.37
Russia|Shelby|650|40.23|-84.41
Jackson Center|Shelby|1400|40.44|-84.04
Canton|Stark|70000|40.80|-81.38
Massillon|Stark|32000|40.80|-81.52
Alliance|Stark|21000|40.92|-81.11
North Canton|Stark|17800|40.88|-81.40
Louisville|Stark|9500|40.84|-81.26
Canal Fulton|Stark|5400|40.89|-81.60
Navarre|Stark|1900|40.72|-81.52
Minerva|Stark|3700|40.73|-81.10
Hartville|Stark|3000|40.96|-81.33
Beach City|Stark|1000|40.65|-81.58
Uniontown|Stark|3300|40.98|-81.41
Jackson Township|Stark|40000|40.85|-81.49
Plain Township|Stark|36000|40.86|-81.37
Brewster|Stark|2100|40.71|-81.60
East Canton|Stark|1600|40.79|-81.28
Akron|Summit|190000|41.08|-81.52
Cuyahoga Falls|Summit|51000|41.13|-81.48
Stow|Summit|34000|41.16|-81.44
Hudson|Summit|23000|41.24|-81.44
Barberton|Summit|25000|41.01|-81.60
Green|Summit|27000|40.95|-81.48
Twinsburg|Summit|19000|41.31|-81.44
Tallmadge|Summit|17500|41.10|-81.44
Copley|Summit|18000|41.10|-81.64
Norton|Summit|12000|41.03|-81.64
Macedonia|Summit|12000|41.31|-81.51
Fairlawn|Summit|7500|41.13|-81.61
Richfield|Summit|3700|41.24|-81.64
Coventry Township|Summit|10000|40.99|-81.53
Bath|Summit|9700|41.17|-81.64
Mogadore|Summit|3800|41.05|-81.40
Warren|Trumbull|39000|41.24|-80.82
Niles|Trumbull|18000|41.18|-80.77
Girard|Trumbull|9600|41.15|-80.70
Hubbard|Trumbull|7600|41.16|-80.57
Howland|Trumbull|16000|41.25|-80.75
Newton Falls|Trumbull|4600|41.19|-80.98
Cortland|Trumbull|7000|41.33|-80.73
Champion|Trumbull|4500|41.30|-80.84
Brookfield|Trumbull|9000|41.23|-80.56
Kinsman|Trumbull|600|41.44|-80.59
McDonald|Trumbull|3200|41.16|-80.72
Bristolville|Trumbull|500|41.38|-80.86
Mineral Ridge|Trumbull|3800|41.14|-80.77
Lordstown|Trumbull|3400|41.17|-80.86
Liberty|Trumbull|12000|41.16|-80.67
New Philadelphia|Tuscarawas|17000|40.49|-81.45
Dover|Tuscarawas|13000|40.52|-81.47
Uhrichsville|Tuscarawas|5400|40.39|-81.35
Newcomerstown|Tuscarawas|3800|40.27|-81.61
Strasburg|Tuscarawas|2600|40.60|-81.53
Sugarcreek|Tuscarawas|2200|40.50|-81.64
Bolivar|Tuscarawas|1000|40.65|-81.45
Gnadenhutten|Tuscarawas|1300|40.36|-81.43
Marysville|Union|25000|40.24|-83.37
Richwood|Union|2200|40.43|-83.30
Van Wert|Van Wert|11000|40.87|-84.58
Convoy|Van Wert|1000|40.92|-84.70
Ohio City|Van Wert|700|40.77|-84.62
McArthur|Vinton|1700|39.25|-82.48
Lebanon|Warren|21000|39.44|-84.21
Mason|Warren|35000|39.36|-84.31
Springboro|Warren|19000|39.55|-84.23
Franklin|Warren|11700|39.56|-84.30
Waynesville|Warren|2700|39.53|-84.09
Morrow|Warren|1500|39.35|-84.13
Maineville|Warren|1100|39.31|-84.23
South Lebanon|Warren|6000|39.37|-84.21
Carlisle|Warren|5500|39.58|-84.32
Kings Mills|Warren|3000|39.36|-84.25
Marietta|Washington|13000|39.42|-81.45
Belpre|Washington|6400|39.27|-81.57
Beverly|Washington|1200|39.55|-81.64
Lowell|Washington|500|39.53|-81.51
Waterford|Washington|800|39.54|-81.65
Vincent|Washington|300|39.33|-81.66
Wooster|Wayne|27000|40.80|-81.94
Orrville|Wayne|8400|40.84|-81.76
Rittman|Wayne|6100|40.98|-81.78
Smithville|Wayne|1300|40.86|-81.86
Shreve|Wayne|1500|40.68|-81.99
Dalton|Wayne|1800|40.80|-81.70
Doylestown|Wayne|3000|40.97|-81.70
Apple Creek|Wayne|1200|40.75|-81.84
Creston|Wayne|2100|40.99|-81.89
Bryan|Williams|8600|41.47|-84.55
Montpelier|Williams|4000|41.58|-84.61
Edgerton|Williams|2000|41.45|-84.75
Edon|Williams|800|41.56|-84.77
Pioneer|Williams|1400|41.68|-84.55
Stryker|Williams|1300|41.50|-84.41
West Unity|Williams|1700|41.59|-84.43
Bowling Green|Wood|30000|41.37|-83.65
Perrysburg|Wood|25000|41.56|-83.63
Rossford|Wood|6500|41.61|-83.56
Northwood|Wood|5300|41.61|-83.48
North Baltimore|Wood|3400|41.18|-83.68
Pemberville|Wood|1400|41.41|-83.46
Walbridge|Wood|3100|41.59|-83.49
Weston|Wood|1500|41.34|-83.80
Upper Sandusky|Wyandot|6600|40.83|-83.28
Carey|Wyandot|3600|40.95|-83.38
`;

  const cities = RAW.trim()
    .split('\n')
    .map((line) => {
      const [name, county, pop, lat, lon] = line.split('|');
      return { name, county, pop: Number(pop), lat: Number(lat), lon: Number(lon) };
    });

  // Rivers / creeks / natural features with an approximate representative point.
  const rivers = [
    ['Maumee', 41.4, -84.0], ['Sandusky', 41.1, -83.1], ['Scioto', 39.8, -83.0], ['Olentangy', 40.3, -83.05],
    ['Muskingum', 39.7, -81.7], ['Hocking', 39.4, -82.2], ['Mohican', 40.6, -82.2], ['Kokosing', 40.4, -82.4],
    ['Walhonding', 40.35, -82.0], ['Tuscarawas', 40.5, -81.5], ['Cuyahoga', 41.2, -81.5], ['Chagrin', 41.45, -81.35],
    ['Grand River', 41.7, -81.0], ['Vermilion', 41.25, -82.35], ['Huron', 41.25, -82.6], ['Mad River', 40.05, -83.85],
    ['Stillwater', 40.05, -84.35], ['Auglaize', 40.8, -84.2], ['Blanchard', 40.95, -83.75], ['Tiffin River', 41.4, -84.4],
    ['Portage', 41.3, -83.4], ['Mahoning', 41.0, -80.85], ['Licking', 40.05, -82.3], ['Raccoon', 39.0, -82.4],
    ['Paint Creek', 39.3, -83.2], ['Big Walnut', 40.0, -82.85], ['Darby', 40.0, -83.35], ['Deer Creek', 39.6, -83.3],
    ['Clear Fork', 40.7, -82.4], ['Killbuck', 40.5, -81.95], ['Wills Creek', 40.0, -81.6], ['Symmes', 38.6, -82.5],
    ['Brush Creek', 38.85, -83.45], ['Little Miami', 39.4, -84.1], ['Great Miami', 39.5, -84.4], ['Whitewater', 39.3, -84.8],
    ['Ottawa River', 41.0, -84.1], ['Black Fork', 40.8, -82.5], ['Rocky Fork', 39.2, -83.4], ['Little Beaver', 40.75, -80.6],
    ['Yellow Creek', 40.55, -80.75], ['Captina', 39.9, -80.95], ['Duck Creek', 39.6, -81.4], ['Salt Creek', 39.4, -82.7],
    ['Sugar Creek', 40.55, -81.6], ['Conneaut Creek', 41.9, -80.6], ['Rocky River', 41.4, -81.9], ['Black River', 41.35, -82.1],
    ['Ohio Valley', 38.75, -82.6], ['Shade River', 39.1, -81.9], ['Leading Creek', 39.0, -82.1], ['Twin Creek', 39.65, -84.45],
    ['Loramie', 40.35, -84.35], ['St. Joseph', 41.5, -84.7], ['Wabash', 40.55, -84.75], ['Kokosing Gap', 40.45, -82.2],
  ].map(([name, lat, lon]) => ({ name, lat, lon }));

  FNG.DATA.ohio = {
    key: 'OH',
    name: 'Ohio',
    center: { lat: 40.25, lon: -82.75 },
    cities,
    rivers,
  };

  FNG.States.register({
    key: 'OH',
    name: 'Ohio',
    assoc: 'OHSAA',
    data: FNG.DATA.ohio,
    generator: 'places',
    seedTag: '',
    classes: { count: 7, method: 'ohio' },
    labels: 'roman',
    leagues: { style: 'conferences', word: 'League', prefix: 'L', catholicMaxDiv: 4 },
    regions: true,
    playoffs: 'ohio',
    talent: 0,
    depth: 0.4,
    neighbors: ['MI', 'IN', 'KY', 'WV', 'PA'],
  });

  // The state picker shows every state; the ones with a registered data module are playable.
  FNG.DATA.states = [
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'],
    ['CT', 'Connecticut'], ['DE', 'Delaware'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
    ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
    ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
    ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
    ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'],
    ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'],
    ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
    ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
    ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
  ].map(([abbr, name]) => ({
    abbr,
    name,
    get playable() {
      return FNG.States.has(abbr);
    },
  }));
})();
