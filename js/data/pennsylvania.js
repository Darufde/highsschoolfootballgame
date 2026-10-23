/* Pennsylvania geography: communities with high schools (City|County|Population|Lat|Lon) and rivers used for naming. */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  const RAW = `
Gettysburg|Adams|8000|39.83|-77.23
Hanover|York|16000|39.80|-76.98
Bermudian Springs|Adams|6000|39.94|-77.11
Littlestown|Adams|4800|39.74|-77.09
Biglerville|Adams|5000|39.93|-77.25
Fairfield|Adams|3000|39.79|-77.37
New Oxford|Adams|7000|39.86|-77.06
Pittsburgh|Allegheny|300000|40.44|-80.00
Mount Lebanon|Allegheny|34000|40.37|-80.05
Bethel Park|Allegheny|33000|40.33|-80.04
Penn Hills|Allegheny|41000|40.50|-79.84
North Allegheny|Allegheny|45000|40.57|-80.03
Upper St. Clair|Allegheny|20000|40.34|-80.08
Baldwin|Allegheny|21000|40.37|-79.97
Plum|Allegheny|27000|40.50|-79.75
Shaler|Allegheny|28000|40.52|-79.96
North Hills|Allegheny|30000|40.54|-80.02
Pine-Richland|Allegheny|25000|40.65|-79.97
Woodland Hills|Allegheny|38000|40.42|-79.85
Gateway|Allegheny|22000|40.43|-79.76
Fox Chapel|Allegheny|29000|40.52|-79.88
Hampton|Allegheny|18000|40.58|-79.95
Moon|Allegheny|26000|40.52|-80.21
West Allegheny|Allegheny|20000|40.45|-80.29
Montour|Allegheny|21000|40.47|-80.12
Chartiers Valley|Allegheny|22000|40.38|-80.10
Keystone Oaks|Allegheny|20000|40.39|-80.03
West Mifflin|Allegheny|20000|40.36|-79.87
McKeesport|Allegheny|19000|40.35|-79.86
Elizabeth Forward|Allegheny|16000|40.27|-79.86
South Fayette|Allegheny|16000|40.37|-80.16
Thomas Jefferson|Allegheny|20000|40.30|-79.94
Steel Valley|Allegheny|15000|40.40|-79.90
Sto-Rox|Allegheny|12000|40.48|-80.06
Clairton|Allegheny|6800|40.29|-79.88
Duquesne|Allegheny|5500|40.38|-79.86
Highlands|Allegheny|17000|40.61|-79.73
Deer Lakes|Allegheny|13000|40.62|-79.83
Avonworth|Allegheny|10000|40.53|-80.07
Quaker Valley|Allegheny|12000|40.55|-80.19
Northgate|Allegheny|9000|40.50|-80.06
Riverview|Allegheny|7000|40.53|-79.82
Brentwood|Allegheny|10000|40.37|-79.98
South Allegheny|Allegheny|12000|40.31|-79.85
East Allegheny|Allegheny|12000|40.39|-79.81
Carlynton|Allegheny|11000|40.42|-80.07
Kittanning|Armstrong|4000|40.82|-79.52
Ford City|Armstrong|3000|40.77|-79.53
Apollo|Armstrong|5000|40.58|-79.57
Leechburg|Armstrong|2000|40.63|-79.60
Freeport|Armstrong|5000|40.67|-79.68
Aliquippa|Beaver|9000|40.64|-80.24
Beaver Falls|Beaver|9000|40.75|-80.32
Ambridge|Beaver|7000|40.59|-80.23
Beaver|Beaver|5000|40.70|-80.31
Hopewell|Beaver|13000|40.66|-80.31
Central Valley|Beaver|14000|40.66|-80.39
Blackhawk|Beaver|12000|40.78|-80.31
New Brighton|Beaver|6000|40.73|-80.31
Riverside|Beaver|8000|40.80|-80.25
Rochester|Beaver|3700|40.70|-80.29
Freedom|Beaver|6000|40.68|-80.25
South Side|Beaver|5000|40.60|-80.48
Bedford|Bedford|3000|40.02|-78.50
Everett|Bedford|2000|40.01|-78.37
Chestnut Ridge|Bedford|5000|40.06|-78.68
Northern Bedford|Bedford|4000|40.21|-78.35
Tussey Mountain|Bedford|4000|40.13|-78.22
Reading|Berks|95000|40.34|-75.93
Wilson|Berks|35000|40.31|-76.00
Exeter|Berks|26000|40.31|-75.83
Governor Mifflin|Berks|25000|40.30|-75.96
Muhlenberg|Berks|20000|40.39|-75.91
Daniel Boone|Berks|19000|40.25|-75.80
Boyertown|Berks|35000|40.33|-75.64
Twin Valley|Berks|14000|40.19|-75.87
Conrad Weiser|Berks|15000|40.37|-76.19
Kutztown|Berks|10000|40.52|-75.78
Fleetwood|Berks|12000|40.45|-75.82
Brandywine Heights|Berks|10000|40.44|-75.67
Hamburg|Berks|10000|40.56|-75.98
Tulpehocken|Berks|8000|40.43|-76.25
Schuylkill Valley|Berks|10000|40.41|-75.96
Oley Valley|Berks|8000|40.38|-75.78
Antietam|Berks|7000|40.34|-75.88
Altoona|Blair|43000|40.52|-78.39
Hollidaysburg|Blair|26000|40.43|-78.39
Tyrone|Blair|7000|40.67|-78.24
Bellwood|Blair|5000|40.60|-78.33
Williamsburg|Blair|2000|40.46|-78.20
Claysburg|Blair|3500|40.30|-78.45
Towanda|Bradford|5000|41.77|-76.44
Athens|Bradford|12000|41.95|-76.52
Wyalusing|Bradford|6000|41.67|-76.26
Troy|Bradford|7000|41.79|-76.79
Canton|Bradford|5000|41.66|-76.85
Sayre|Bradford|5500|41.98|-76.52
Bensalem|Bucks|62000|40.10|-74.95
Council Rock|Bucks|75000|40.23|-74.94
Central Bucks|Bucks|90000|40.31|-75.13
Pennsbury|Bucks|70000|40.18|-74.83
Neshaminy|Bucks|55000|40.15|-74.92
Pennridge|Bucks|45000|40.38|-75.25
Palisades|Bucks|14000|40.54|-75.17
Quakertown|Bucks|36000|40.44|-75.34
Bristol|Bucks|9700|40.10|-74.85
Morrisville|Bucks|8700|40.21|-74.78
Butler|Butler|13000|40.86|-79.90
Seneca Valley|Butler|45000|40.79|-80.11
Mars|Butler|20000|40.69|-80.01
Knoch|Butler|17000|40.75|-79.83
Slippery Rock|Butler|17000|41.06|-80.06
Karns City|Butler|12000|40.99|-79.73
Moniteau|Butler|10000|41.08|-79.88
Johnstown|Cambria|18000|40.33|-78.92
Richland|Cambria|13000|40.29|-78.85
Westmont|Cambria|10000|40.32|-78.95
Greater Johnstown|Cambria|20000|40.32|-78.92
Forest Hills|Cambria|10000|40.42|-78.75
Central Cambria|Cambria|11000|40.49|-78.72
Bishop Carroll|Cambria|3000|40.48|-78.69
Cambria Heights|Cambria|10000|40.62|-78.77
Penn Cambria|Cambria|11000|40.49|-78.55
Northern Cambria|Cambria|8000|40.66|-78.78
Portage|Cambria|5000|40.39|-78.67
Conemaugh Valley|Cambria|5000|40.36|-78.87
Emporium|Cameron|4500|41.51|-78.24
Jim Thorpe|Carbon|10000|40.87|-75.73
Lehighton|Carbon|15000|40.83|-75.71
Palmerton|Carbon|12000|40.80|-75.61
Panther Valley|Carbon|10000|40.80|-75.88
Pleasant Valley|Monroe|28000|40.85|-75.38
Bellefonte|Centre|20000|40.91|-77.78
State College|Centre|80000|40.79|-77.86
Penns Valley|Centre|11000|40.88|-77.48
Bald Eagle|Centre|11000|40.95|-77.82
Philipsburg-Osceola|Centre|13000|40.90|-78.22
West Chester|Chester|75000|39.96|-75.60
Downingtown|Chester|60000|40.01|-75.70
Coatesville|Chester|45000|39.98|-75.82
Unionville|Chester|25000|39.89|-75.73
Great Valley|Chester|28000|40.04|-75.51
Phoenixville|Chester|25000|40.13|-75.51
Owen J. Roberts|Chester|35000|40.18|-75.71
Kennett|Chester|22000|39.85|-75.71
Avon Grove|Chester|30000|39.79|-75.86
Octorara|Chester|14000|39.91|-75.98
Oxford|Chester|20000|39.78|-75.98
Tredyffrin|Chester|35000|40.05|-75.45
Clarion|Clarion|5000|41.21|-79.39
Keystone|Clarion|8000|41.14|-79.53
Redbank Valley|Clarion|7000|41.07|-79.27
Clarion-Limestone|Clarion|5000|41.17|-79.30
Union|Clarion|4000|41.07|-79.45
Clearfield|Clearfield|12000|41.03|-78.44
DuBois|Clearfield|15000|41.12|-78.76
Curwensville|Clearfield|5000|40.98|-78.53
West Branch|Clearfield|5000|40.94|-78.15
Moshannon Valley|Clearfield|5000|40.82|-78.33
Glendale|Clearfield|5000|40.71|-78.56
Lock Haven|Clinton|9000|41.14|-77.45
Bloomsburg|Columbia|14000|41.00|-76.45
Berwick|Columbia|16000|41.05|-76.23
Central Columbia|Columbia|13000|41.03|-76.38
Southern Columbia|Columbia|8000|40.86|-76.50
Millville|Columbia|4000|41.12|-76.53
Meadville|Crawford|13000|41.64|-80.15
Conneaut|Crawford|15000|41.64|-80.39
Cambridge Springs|Crawford|5000|41.80|-80.06
Titusville|Crawford|9000|41.63|-79.67
Carlisle|Cumberland|30000|40.20|-77.19
Cumberland Valley|Cumberland|60000|40.24|-77.04
Mechanicsburg|Cumberland|22000|40.21|-77.01
Camp Hill|Cumberland|8000|40.24|-76.92
East Pennsboro|Cumberland|20000|40.29|-76.95
Red Land|York|22000|40.13|-76.83
Big Spring|Cumberland|18000|40.17|-77.40
Shippensburg|Cumberland|18000|40.05|-77.52
Boiling Springs|Cumberland|12000|40.15|-77.13
Harrisburg|Dauphin|50000|40.27|-76.88
Central Dauphin|Dauphin|50000|40.33|-76.82
Susquehanna Township|Dauphin|25000|40.30|-76.86
Hershey|Dauphin|23000|40.29|-76.65
Lower Dauphin|Dauphin|20000|40.22|-76.68
Middletown|Dauphin|15000|40.20|-76.73
Steelton-Highspire|Dauphin|8000|40.23|-76.83
Halifax|Dauphin|5000|40.47|-76.93
Millersburg|Dauphin|5000|40.54|-76.96
Upper Dauphin|Dauphin|7000|40.58|-76.85
Williams Valley|Schuylkill|6000|40.62|-76.62
Chester|Delaware|33000|39.85|-75.36
Upper Darby|Delaware|85000|39.96|-75.27
Haverford|Delaware|49000|39.99|-75.31
Radnor|Delaware|31000|40.04|-75.36
Garnet Valley|Delaware|25000|39.86|-75.48
Penncrest|Delaware|30000|39.92|-75.42
Springfield|Delaware|25000|39.93|-75.32
Strath Haven|Delaware|25000|39.90|-75.39
Ridley|Delaware|40000|39.88|-75.33
Interboro|Delaware|25000|39.87|-75.30
Marple Newtown|Delaware|35000|39.98|-75.36
Sun Valley|Delaware|30000|39.86|-75.43
Academy Park|Delaware|25000|39.89|-75.26
Chichester|Delaware|25000|39.83|-75.43
Penn Wood|Delaware|25000|39.93|-75.25
St. Marys|Elk|12500|41.43|-78.56
Ridgway|Elk|4000|41.42|-78.73
Johnsonburg|Elk|2500|41.49|-78.68
Erie|Erie|95000|42.12|-80.08
Millcreek|Erie|54000|42.08|-80.13
Harbor Creek|Erie|17000|42.15|-79.95
Fairview|Erie|11000|42.03|-80.25
Fort LeBoeuf|Erie|15000|41.93|-80.00
General McLane|Erie|15000|41.89|-80.12
Corry|Erie|10000|41.92|-79.64
North East|Erie|10000|42.22|-79.83
Northwestern|Erie|10000|41.98|-80.36
Iroquois|Erie|10000|42.15|-80.01
Union City|Erie|6000|41.90|-79.85
Uniontown|Fayette|10000|39.90|-79.72
Laurel Highlands|Fayette|22000|39.87|-79.75
Connellsville|Fayette|35000|40.02|-79.59
Albert Gallatin|Fayette|20000|39.80|-79.85
Brownsville|Fayette|12000|40.02|-79.89
Frazier|Fayette|8000|40.07|-79.79
Southmoreland|Westmoreland|12000|40.12|-79.58
Chambersburg|Franklin|60000|39.94|-77.66
Greencastle-Antrim|Franklin|17000|39.79|-77.73
Waynesboro|Franklin|25000|39.76|-77.58
James Buchanan|Franklin|13000|39.81|-77.92
Fannett-Metal|Franklin|3000|40.07|-77.83
McConnellsburg|Fulton|5000|39.93|-77.99
Southern Fulton|Fulton|3000|39.79|-78.13
Waynesburg|Greene|12000|39.90|-80.18
Carmichaels|Greene|5000|39.90|-79.97
Jefferson-Morgan|Greene|5000|39.89|-79.95
West Greene|Greene|4000|39.84|-80.42
Mapletown|Greene|4000|39.79|-79.90
Huntingdon|Huntingdon|12000|40.48|-78.01
Juniata Valley|Huntingdon|5000|40.55|-78.13
Mount Union|Huntingdon|6000|40.38|-77.88
Southern Huntingdon|Huntingdon|5000|40.22|-77.95
Indiana|Indiana|25000|40.62|-79.15
Homer-Center|Indiana|6000|40.54|-79.16
Penns Manor|Indiana|5000|40.66|-78.95
Purchase Line|Indiana|6000|40.74|-78.87
Marion Center|Indiana|8000|40.77|-79.05
Blairsville|Indiana|9000|40.43|-79.26
United|Indiana|7000|40.46|-78.98
Punxsutawney|Jefferson|12000|40.94|-78.97
Brookville|Jefferson|9000|41.16|-79.08
Brockway|Jefferson|5000|41.25|-78.80
Juniata|Juniata|12000|40.57|-77.40
Scranton|Lackawanna|77000|41.41|-75.66
Abington Heights|Lackawanna|25000|41.48|-75.70
Dunmore|Lackawanna|14000|41.42|-75.63
North Pocono|Lackawanna|20000|41.31|-75.53
Valley View|Lackawanna|16000|41.47|-75.56
Lakeland|Lackawanna|10000|41.54|-75.59
Mid Valley|Lackawanna|10000|41.47|-75.62
Old Forge|Lackawanna|8000|41.37|-75.73
Riverside|Lackawanna|8000|41.38|-75.70
Carbondale|Lackawanna|8800|41.57|-75.50
Western Wayne|Wayne|12000|41.38|-75.42
Lancaster|Lancaster|58000|40.04|-76.31
Manheim Township|Lancaster|40000|40.09|-76.29
Hempfield|Lancaster|42000|40.06|-76.42
Penn Manor|Lancaster|40000|39.96|-76.36
Conestoga Valley|Lancaster|25000|40.08|-76.21
Warwick|Lancaster|30000|40.16|-76.30
Manheim Central|Lancaster|25000|40.16|-76.40
Cocalico|Lancaster|25000|40.22|-76.13
Ephrata|Lancaster|35000|40.18|-76.18
Garden Spot|Lancaster|25000|40.13|-76.05
Elizabethtown|Lancaster|28000|40.15|-76.60
Donegal|Lancaster|18000|40.09|-76.52
Solanco|Lancaster|30000|39.86|-76.15
Lampeter-Strasburg|Lancaster|17000|40.01|-76.24
Pequea Valley|Lancaster|13000|40.02|-76.06
Columbia|Lancaster|10000|40.03|-76.50
Annville-Cleona|Lebanon|12000|40.33|-76.51
Lebanon|Lebanon|26000|40.34|-76.41
Cedar Crest|Lebanon|33000|40.31|-76.40
Elco|Lebanon|17000|40.36|-76.30
Northern Lebanon|Lebanon|17000|40.43|-76.50
Palmyra|Lebanon|25000|40.31|-76.59
New Castle|Lawrence|21000|41.00|-80.35
Neshannock|Lawrence|9000|41.04|-80.35
Shenango|Lawrence|8000|40.97|-80.27
Union Area|Lawrence|6000|40.97|-80.42
Laurel|Lawrence|8000|41.03|-80.25
Mohawk|Lawrence|8000|40.94|-80.45
Ellwood City|Lawrence|10000|40.86|-80.29
Wilmington|Lawrence|8000|41.11|-80.29
Allentown|Lehigh|125000|40.60|-75.47
Parkland|Lehigh|60000|40.60|-75.58
Emmaus|Lehigh|55000|40.54|-75.50
Whitehall|Lehigh|27000|40.66|-75.50
Salisbury|Lehigh|14000|40.57|-75.45
Northwestern Lehigh|Lehigh|15000|40.71|-75.70
Catasauqua|Lehigh|12000|40.65|-75.47
Southern Lehigh|Lehigh|22000|40.52|-75.40
Northern Lehigh|Lehigh|12000|40.75|-75.58
Wilkes-Barre|Luzerne|40000|41.25|-75.88
Hazleton|Luzerne|29000|40.96|-75.97
Pittston|Luzerne|30000|41.33|-75.79
Wyoming Valley West|Luzerne|30000|41.26|-75.92
Dallas|Luzerne|20000|41.34|-75.96
Crestwood|Luzerne|20000|41.17|-75.86
Hanover Area|Luzerne|15000|41.21|-75.93
Lake-Lehman|Luzerne|15000|41.32|-76.05
Northwest|Luzerne|10000|41.18|-76.20
Berwick|Columbia|16000|41.05|-76.23
Wyoming Area|Luzerne|20000|41.37|-75.82
Williamsport|Lycoming|28000|41.24|-77.00
Loyalsock|Lycoming|11000|41.26|-76.98
Montoursville|Lycoming|9000|41.25|-76.92
South Williamsport|Lycoming|7000|41.23|-77.00
Jersey Shore|Lycoming|15000|41.20|-77.26
Muncy|Lycoming|5000|41.21|-76.79
Hughesville|Lycoming|10000|41.24|-76.73
Montgomery|Lycoming|4000|41.17|-76.88
Bradford|McKean|8000|41.96|-78.64
Kane|McKean|5000|41.66|-78.81
Smethport|McKean|4000|41.81|-78.44
Port Allegany|McKean|5000|41.81|-78.28
Otto-Eldred|McKean|4000|41.95|-78.39
Hermitage|Mercer|16000|41.23|-80.45
Sharon|Mercer|13000|41.23|-80.49
Grove City|Mercer|16000|41.16|-80.09
Greenville|Mercer|12000|41.40|-80.39
Mercer|Mercer|8000|41.23|-80.24
Reynolds|Mercer|6000|41.35|-80.40
Sharpsville|Mercer|6000|41.26|-80.47
West Middlesex|Mercer|5000|41.17|-80.46
Lewistown|Mifflin|18000|40.60|-77.57
Stroudsburg|Monroe|25000|40.99|-75.20
East Stroudsburg|Monroe|40000|41.00|-75.18
Pocono Mountain|Monroe|50000|41.12|-75.38
Norristown|Montgomery|60000|40.12|-75.34
Abington|Montgomery|58000|40.12|-75.12
Lower Merion|Montgomery|60000|40.01|-75.28
Cheltenham|Montgomery|37000|40.07|-75.13
North Penn|Montgomery|95000|40.24|-75.29
Souderton|Montgomery|45000|40.31|-75.33
Methacton|Montgomery|36000|40.16|-75.41
Perkiomen Valley|Montgomery|40000|40.21|-75.47
Pottstown|Montgomery|23000|40.25|-75.65
Pottsgrove|Montgomery|22000|40.26|-75.60
Spring-Ford|Montgomery|55000|40.19|-75.52
Upper Merion|Montgomery|30000|40.09|-75.38
Hatboro-Horsham|Montgomery|35000|40.18|-75.13
Upper Moreland|Montgomery|25000|40.16|-75.11
Upper Dublin|Montgomery|26000|40.15|-75.17
Wissahickon|Montgomery|35000|40.16|-75.22
Plymouth Whitemarsh|Montgomery|40000|40.09|-75.28
Springfield Township|Montgomery|20000|40.09|-75.20
Jenkintown|Montgomery|4500|40.10|-75.13
Colonial|Montgomery|30000|40.11|-75.27
Upper Perkiomen|Montgomery|20000|40.38|-75.51
Danville|Montour|18000|40.96|-76.61
Easton|Northampton|55000|40.69|-75.22
Bethlehem|Northampton|75000|40.63|-75.37
Nazareth|Northampton|25000|40.74|-75.31
Northampton|Northampton|35000|40.69|-75.50
Wilson Area|Northampton|15000|40.68|-75.24
Bangor|Northampton|18000|40.87|-75.21
Pen Argyl|Northampton|12000|40.87|-75.25
Saucon Valley|Northampton|13000|40.57|-75.31
Freedom|Northampton|35000|40.62|-75.33
Liberty|Northampton|35000|40.63|-75.38
Shamokin|Northumberland|17000|40.79|-76.56
Mount Carmel|Northumberland|10000|40.80|-76.41
Milton|Northumberland|12000|41.01|-76.85
Shikellamy|Northumberland|20000|40.86|-76.79
Line Mountain|Northumberland|8000|40.70|-76.80
Warrior Run|Northumberland|10000|41.06|-76.80
West Perry|Perry|15000|40.42|-77.26
Newport|Perry|8000|40.48|-77.13
Susquenita|Perry|9000|40.37|-77.03
Greenwood|Perry|4000|40.53|-77.17
Philadelphia|Philadelphia|1600000|39.95|-75.17
Milford|Pike|25000|41.32|-74.80
Wallenpaupack|Pike|25000|41.43|-75.23
Coudersport|Potter|5000|41.77|-78.02
Galeton|Potter|2000|41.73|-77.64
Pottsville|Schuylkill|14000|40.69|-76.20
Blue Mountain|Schuylkill|18000|40.64|-76.08
Schuylkill Haven|Schuylkill|9000|40.63|-76.17
Tamaqua|Schuylkill|14000|40.80|-75.97
Mahanoy|Schuylkill|9000|40.81|-76.14
Pine Grove|Schuylkill|11000|40.55|-76.38
Minersville|Schuylkill|8000|40.69|-76.26
North Schuylkill|Schuylkill|12000|40.75|-76.24
Shenandoah Valley|Schuylkill|6000|40.82|-76.20
Tri-Valley|Schuylkill|6000|40.64|-76.53
Nativity BVM|Schuylkill|2000|40.70|-76.19
Selinsgrove|Snyder|15000|40.80|-76.86
Midd-West|Snyder|10000|40.79|-77.09
Somerset|Somerset|12000|40.01|-79.08
Berlin Brothersvalley|Somerset|6000|39.92|-78.96
Conemaugh Township|Somerset|7000|40.23|-78.95
Meyersdale|Somerset|6000|39.81|-79.02
Rockwood|Somerset|5000|39.92|-79.16
Shade|Somerset|5000|40.11|-78.85
Windber|Somerset|8000|40.24|-78.84
North Star|Somerset|6000|40.13|-79.00
Turkeyfoot Valley|Somerset|3000|39.85|-79.34
Shanksville|Somerset|3000|40.02|-78.91
Montrose|Susquehanna|9000|41.83|-75.88
Blue Ridge|Susquehanna|5000|41.89|-75.62
Mountain View|Susquehanna|6000|41.73|-75.71
Elk Lake|Susquehanna|6000|41.73|-75.95
Forest City|Susquehanna|4000|41.65|-75.47
Wellsboro|Tioga|9000|41.75|-77.30
Mansfield|Tioga|7000|41.81|-77.08
Northern Tioga|Tioga|7000|41.97|-77.33
Lewisburg|Union|15000|40.96|-76.88
Mifflinburg|Union|12000|40.92|-77.05
Franklin|Venango|7000|41.40|-79.83
Oil City|Venango|12000|41.43|-79.71
Cranberry|Venango|7000|41.36|-79.72
Rocky Grove|Venango|5000|41.40|-79.81
Warren|Warren|20000|41.84|-79.14
Eisenhower|Warren|6000|41.92|-79.30
Youngsville|Warren|6000|41.85|-79.32
Washington|Washington|13000|40.17|-80.25
Canon-McMillan|Washington|30000|40.25|-80.17
Peters Township|Washington|23000|40.27|-80.08
Trinity|Washington|25000|40.15|-80.24
Ringgold|Washington|20000|40.15|-79.95
Charleroi|Washington|12000|40.14|-79.90
Fort Cherry|Washington|9000|40.31|-80.31
McGuffey|Washington|12000|40.12|-80.37
Burgettstown|Washington|10000|40.38|-80.39
Avella|Washington|4000|40.27|-80.46
Bentworth|Washington|9000|40.11|-80.05
California|Washington|7000|40.06|-79.89
Bethlehem-Center|Washington|9000|40.06|-80.00
Chartiers-Houston|Washington|7000|40.25|-80.21
Honesdale|Wayne|12000|41.58|-75.26
Greensburg|Westmoreland|25000|40.30|-79.54
Hempfield Area|Westmoreland|42000|40.28|-79.58
Penn-Trafford|Westmoreland|28000|40.36|-79.70
Norwin|Westmoreland|39000|40.33|-79.71
Franklin Regional|Westmoreland|30000|40.42|-79.66
Latrobe|Westmoreland|30000|40.32|-79.38
Kiski Area|Westmoreland|30000|40.57|-79.59
Belle Vernon|Westmoreland|20000|40.13|-79.87
Yough|Westmoreland|14000|40.22|-79.72
Mount Pleasant|Westmoreland|14000|40.15|-79.54
Ligonier Valley|Westmoreland|13000|40.24|-79.24
Derry|Westmoreland|14000|40.33|-79.30
Jeannette|Westmoreland|9000|40.33|-79.62
Monessen|Westmoreland|7000|40.15|-79.88
Burrell|Westmoreland|12000|40.58|-79.70
Valley|Westmoreland|9000|40.57|-79.77
Greensburg Salem|Westmoreland|20000|40.30|-79.51
Tunkhannock|Wyoming|14000|41.54|-75.95
York|York|45000|39.96|-76.73
Central York|York|30000|40.00|-76.71
Dallastown|York|35000|39.90|-76.64
Red Lion|York|35000|39.90|-76.61
Spring Grove|York|20000|39.87|-76.86
Dover|York|20000|40.00|-76.85
Northeastern|York|25000|40.04|-76.62
West York|York|20000|39.95|-76.77
York Suburban|York|25000|39.95|-76.68
Eastern York|York|15000|40.01|-76.50
Kennard-Dale|York|15000|39.75|-76.50
Susquehannock|York|18000|39.76|-76.68
South Western|York|18000|39.80|-76.94
Northern York|York|18000|40.12|-76.98
Delone Catholic|Adams|3000|39.82|-77.01
`;

  // Duplicate place lines (a district listed under two counties) keep only the first.
  const seen = new Set();
  const cities = RAW.trim()
    .split('\n')
    .map((line) => {
      const [name, county, pop, lat, lon] = line.split('|');
      return { name, county, pop: Number(pop), lat: Number(lat), lon: Number(lon) };
    })
    .filter((c) => (seen.has(c.name) ? false : seen.add(c.name)));

  const rivers = [
    ['Susquehanna', 40.6, -76.9], ['Allegheny', 41.2, -79.6], ['Monongahela', 40.2, -79.9], ['Ohio Valley', 40.6, -80.3],
    ['Delaware Valley', 40.6, -75.1], ['Schuylkill', 40.4, -75.9], ['Lehigh', 40.7, -75.6], ['Juniata', 40.5, -77.6],
    ['Youghiogheny', 40.1, -79.6], ['Conemaugh', 40.4, -79.1], ['Kiskiminetas', 40.6, -79.5], ['Beaver', 40.8, -80.3],
    ['Shenango', 41.2, -80.4], ['Clarion', 41.3, -79.2], ['Lackawanna', 41.4, -75.6], ['Brandywine', 40.0, -75.7],
    ['Conestoga', 40.1, -76.2], ['Swatara', 40.3, -76.6], ['Conodoguinet', 40.2, -77.2], ['Loyalsock', 41.3, -76.9],
    ['Pine Creek', 41.5, -77.4], ['Tioga', 41.9, -77.1], ['Wyalusing', 41.7, -76.2], ['Lackawaxen', 41.5, -75.1],
    ['Raystown', 40.3, -78.1], ['Penns Creek', 40.8, -77.2], ['Bald Eagle', 41.0, -77.6], ['Moshannon', 40.9, -78.2],
    ['Tionesta', 41.5, -79.2], ['French Creek', 41.6, -80.1], ['Oil Creek', 41.6, -79.7], ['Mahoning', 40.9, -79.2],
    ['Perkiomen', 40.3, -75.5], ['Neshaminy', 40.2, -75.0], ['Chartiers', 40.3, -80.2], ['Raccoon Creek', 40.5, -80.4],
  ].map(([name, lat, lon]) => ({ name, lat, lon }));

  FNG.DATA.pennsylvania = {
    key: 'PA',
    name: 'Pennsylvania',
    center: { lat: 40.9, lon: -77.8 },
    cities,
    rivers,
    ruralExtras: false,
  };

  // PIAA football: six classes by enrollment, with 6A the largest schools.
  FNG.States.register({
    key: 'PA',
    name: 'Pennsylvania',
    assoc: 'PIAA',
    data: FNG.DATA.pennsylvania,
    generator: 'places',
    classes: { count: 6, method: 'equal', top: 70 },
    labels: 'A',
    leagues: { style: 'conferences', word: 'Conference', catholicMaxDiv: 3 },
    talent: -0.3,
    depth: 0.3,
    neighbors: ['OH', 'WV', 'MD', 'DE', 'NJ', 'NY'],
  });
})();
