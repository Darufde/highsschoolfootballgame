/* Michigan geography: communities with high schools (City|County|Population|Lat|Lon) and rivers used for naming. */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  const RAW = `
Detroit|Wayne|630000|42.35|-83.10
Dearborn|Wayne|108000|42.32|-83.18
Livonia|Wayne|95000|42.40|-83.37
Canton|Wayne|98000|42.31|-83.48
Westland|Wayne|85000|42.32|-83.40
Taylor|Wayne|62000|42.24|-83.27
Dearborn Heights|Wayne|62000|42.34|-83.27
Redford|Wayne|48000|42.39|-83.30
Lincoln Park|Wayne|39000|42.25|-83.18
Southgate|Wayne|30000|42.21|-83.21
Allen Park|Wayne|28000|42.26|-83.21
Hamtramck|Wayne|28000|42.40|-83.05
Garden City|Wayne|27000|42.33|-83.33
Wyandotte|Wayne|25000|42.21|-83.15
Inkster|Wayne|25000|42.29|-83.31
Romulus|Wayne|23000|42.22|-83.40
Belleville|Wayne|30000|42.20|-83.49
Trenton|Wayne|18000|42.14|-83.18
Wayne|Wayne|17000|42.28|-83.39
Harper Woods|Wayne|15000|42.43|-82.92
Grosse Pointe|Wayne|45000|42.39|-82.91
Riverview|Wayne|12000|42.17|-83.18
Woodhaven|Wayne|12000|42.14|-83.24
Melvindale|Wayne|12000|42.28|-83.18
Flat Rock|Wayne|10000|42.10|-83.29
Grosse Ile|Wayne|10000|42.13|-83.15
Plymouth|Wayne|28000|42.37|-83.47
Northville|Wayne|30000|42.43|-83.48
Ecorse|Wayne|9000|42.24|-83.15
River Rouge|Wayne|7000|42.27|-83.13
Highland Park|Wayne|9000|42.41|-83.10
Pontiac|Oakland|61000|42.64|-83.29
Troy|Oakland|87000|42.61|-83.15
Farmington Hills|Oakland|83000|42.49|-83.38
Southfield|Oakland|76000|42.47|-83.22
Rochester Hills|Oakland|76000|42.66|-83.15
Waterford|Oakland|70000|42.66|-83.39
Novi|Oakland|66000|42.48|-83.48
West Bloomfield|Oakland|65000|42.57|-83.38
Royal Oak|Oakland|58000|42.49|-83.14
Bloomfield Hills|Oakland|42000|42.58|-83.25
Lake Orion|Oakland|38000|42.78|-83.24
Clarkston|Oakland|36000|42.74|-83.42
Oak Park|Oakland|29000|42.46|-83.18
Madison Heights|Oakland|28000|42.49|-83.10
Birmingham|Oakland|21000|42.55|-83.21
Oxford|Oakland|22000|42.82|-83.26
Ferndale|Oakland|19000|42.46|-83.13
Walled Lake|Oakland|30000|42.54|-83.48
South Lyon|Oakland|24000|42.46|-83.65
Milford|Oakland|16000|42.59|-83.60
Berkley|Oakland|15000|42.50|-83.18
Hazel Park|Oakland|15000|42.46|-83.10
Clawson|Oakland|12000|42.53|-83.15
Holly|Oakland|12000|42.79|-83.63
Ortonville|Oakland|15000|42.85|-83.44
Lathrup Village|Oakland|4000|42.50|-83.22
Warren|Macomb|139000|42.51|-83.03
Sterling Heights|Macomb|134000|42.58|-83.03
Clinton Township|Macomb|100000|42.59|-82.92
Macomb|Macomb|91000|42.67|-82.92
Shelby Township|Macomb|80000|42.67|-83.03
St. Clair Shores|Macomb|58000|42.50|-82.89
Roseville|Macomb|47000|42.50|-82.94
Chesterfield|Macomb|45000|42.67|-82.80
Eastpointe|Macomb|34000|42.47|-82.96
Harrison Township|Macomb|24000|42.58|-82.82
Mount Clemens|Macomb|16000|42.60|-82.88
Fraser|Macomb|14000|42.54|-82.95
Utica|Macomb|20000|42.63|-83.03
Center Line|Macomb|8000|42.48|-83.03
Romeo|Macomb|12000|42.80|-83.01
New Haven|Macomb|6000|42.73|-82.80
Richmond|Macomb|6000|42.81|-82.76
Armada|Macomb|3000|42.84|-82.88
Ann Arbor|Washtenaw|123000|42.28|-83.74
Ypsilanti|Washtenaw|20000|42.24|-83.61
Lincoln|Washtenaw|30000|42.20|-83.58
Saline|Washtenaw|14000|42.17|-83.78
Chelsea|Washtenaw|9000|42.32|-84.02
Dexter|Washtenaw|9000|42.34|-83.89
Milan|Washtenaw|6000|42.09|-83.68
Manchester|Washtenaw|3000|42.15|-84.04
Whitmore Lake|Washtenaw|7000|42.43|-83.75
Howell|Livingston|25000|42.61|-83.93
Brighton|Livingston|25000|42.53|-83.78
Hartland|Livingston|15000|42.65|-83.75
Pinckney|Livingston|12000|42.46|-83.95
Fowlerville|Livingston|8000|42.66|-84.07
Monroe|Monroe|20000|41.92|-83.40
Temperance|Monroe|30000|41.78|-83.57
Dundee|Monroe|6000|41.96|-83.66
Ida|Monroe|5000|41.91|-83.57
Carleton|Monroe|6000|42.06|-83.39
Newport|Monroe|5000|42.00|-83.31
Erie|Monroe|4000|41.79|-83.50
Port Huron|St. Clair|28000|42.97|-82.42
Marysville|St. Clair|10000|42.91|-82.49
St. Clair|St. Clair|6000|42.82|-82.49
Algonac|St. Clair|4000|42.62|-82.53
Marine City|St. Clair|4000|42.72|-82.49
Yale|St. Clair|2000|43.13|-82.80
Capac|St. Clair|2000|43.01|-82.93
Memphis|St. Clair|1200|42.90|-82.77
Lapeer|Lapeer|30000|43.05|-83.32
Imlay City|Lapeer|6000|43.02|-83.08
Almont|Lapeer|4000|42.92|-83.04
North Branch|Lapeer|4000|43.23|-83.20
Dryden|Lapeer|2000|42.95|-83.12
Flint|Genesee|81000|43.01|-83.69
Burton|Genesee|29000|42.99|-83.62
Grand Blanc|Genesee|45000|42.93|-83.63
Fenton|Genesee|20000|42.80|-83.71
Flushing|Genesee|16000|43.06|-83.85
Davison|Genesee|20000|43.03|-83.52
Swartz Creek|Genesee|15000|42.96|-83.83
Clio|Genesee|10000|43.18|-83.73
Mount Morris|Genesee|8000|43.12|-83.70
Linden|Genesee|10000|42.82|-83.78
Goodrich|Genesee|5000|42.92|-83.51
Montrose|Genesee|4000|43.18|-83.89
Saginaw|Saginaw|44000|43.42|-83.95
Saginaw Township|Saginaw|40000|43.46|-84.02
Frankenmuth|Saginaw|8000|43.33|-83.74
Freeland|Saginaw|8000|43.53|-84.12
Chesaning|Saginaw|5000|43.18|-84.12
Birch Run|Saginaw|5000|43.25|-83.79
St. Charles|Saginaw|3000|43.30|-84.14
Hemlock|Saginaw|3000|43.41|-84.23
Bridgeport|Saginaw|10000|43.36|-83.88
Bay City|Bay|32000|43.59|-83.89
Essexville|Bay|8000|43.61|-83.84
Pinconning|Bay|3000|43.85|-83.96
Auburn|Bay|8000|43.60|-84.07
Midland|Midland|42000|43.62|-84.25
Coleman|Midland|2000|43.76|-84.59
Sanford|Midland|4000|43.67|-84.38
Grand Rapids|Kent|198000|42.96|-85.67
Wyoming|Kent|76000|42.91|-85.71
Kentwood|Kent|54000|42.87|-85.64
Walker|Kent|25000|43.00|-85.77
Grandville|Kent|16000|42.91|-85.76
East Grand Rapids|Kent|12000|42.94|-85.61
Ada|Kent|30000|42.95|-85.49
Rockford|Kent|20000|43.12|-85.56
Lowell|Kent|10000|42.93|-85.34
Cedar Springs|Kent|8000|43.22|-85.55
Sparta|Kent|9000|43.16|-85.71
Byron Center|Kent|15000|42.81|-85.72
Caledonia|Kent|14000|42.79|-85.52
Comstock Park|Kent|12000|43.04|-85.67
Kent City|Kent|3000|43.22|-85.75
Holland|Ottawa|34000|42.79|-86.11
Jenison|Ottawa|17000|42.91|-85.79
Hudsonville|Ottawa|14000|42.87|-85.86
Allendale|Ottawa|26000|42.97|-85.95
Grand Haven|Ottawa|22000|43.06|-86.23
Zeeland|Ottawa|12000|42.81|-86.02
Coopersville|Ottawa|8000|43.06|-85.93
Spring Lake|Ottawa|8000|43.08|-86.20
Muskegon|Muskegon|38000|43.23|-86.25
Muskegon Heights|Muskegon|10000|43.20|-86.24
Norton Shores|Muskegon|25000|43.17|-86.26
North Muskegon|Muskegon|4000|43.26|-86.27
Whitehall|Muskegon|5000|43.41|-86.35
Montague|Muskegon|3000|43.42|-86.36
Ravenna|Muskegon|3000|43.19|-85.94
Fruitport|Muskegon|10000|43.13|-86.15
Holton|Muskegon|2000|43.41|-86.06
Kalamazoo|Kalamazoo|73000|42.29|-85.59
Portage|Kalamazoo|49000|42.20|-85.58
Vicksburg|Kalamazoo|6000|42.12|-85.53
Schoolcraft|Kalamazoo|3000|42.11|-85.64
Parchment|Kalamazoo|4000|42.33|-85.57
Richland|Kalamazoo|8000|42.37|-85.46
Comstock|Kalamazoo|10000|42.28|-85.51
Battle Creek|Calhoun|52000|42.32|-85.18
Marshall|Calhoun|7000|42.27|-84.96
Albion|Calhoun|7700|42.24|-84.75
Homer|Calhoun|2000|42.15|-84.81
Athens|Calhoun|1500|42.09|-85.23
Jackson|Jackson|31000|42.25|-84.40
Michigan Center|Jackson|5000|42.23|-84.33
Grass Lake|Jackson|3000|42.25|-84.21
Napoleon|Jackson|3000|42.16|-84.25
Brooklyn|Jackson|3000|42.11|-84.25
Parma|Jackson|4000|42.26|-84.60
Springport|Jackson|2000|42.38|-84.70
Horton|Jackson|3000|42.15|-84.52
Lansing|Ingham|112000|42.73|-84.56
East Lansing|Ingham|48000|42.74|-84.48
Okemos|Ingham|25000|42.72|-84.43
Holt|Ingham|26000|42.64|-84.52
Haslett|Ingham|19000|42.75|-84.40
Mason|Ingham|9000|42.58|-84.44
Williamston|Ingham|6000|42.69|-84.28
Leslie|Ingham|2500|42.45|-84.43
Stockbridge|Ingham|2000|42.45|-84.18
Charlotte|Eaton|9000|42.56|-84.84
Grand Ledge|Eaton|12000|42.75|-84.75
Eaton Rapids|Eaton|8000|42.51|-84.66
Olivet|Eaton|2000|42.44|-84.92
Potterville|Eaton|3000|42.63|-84.74
Bellevue|Eaton|1500|42.44|-85.02
Vermontville|Eaton|2000|42.63|-85.02
St. Johns|Clinton|10000|43.00|-84.56
DeWitt|Clinton|12000|42.84|-84.57
Bath|Clinton|12000|42.82|-84.45
Ovid|Clinton|2500|43.01|-84.37
Fowler|Clinton|1500|42.99|-84.74
Owosso|Shiawassee|15000|43.00|-84.18
Durand|Shiawassee|5000|42.91|-83.98
Corunna|Shiawassee|5000|42.98|-84.12
Laingsburg|Shiawassee|3000|42.89|-84.35
Perry|Shiawassee|3000|42.83|-84.22
Byron|Shiawassee|1500|42.82|-83.94
Morrice|Shiawassee|1500|42.84|-84.18
Ionia|Ionia|13000|42.99|-85.07
Belding|Ionia|6000|43.10|-85.23
Portland|Ionia|5000|42.87|-84.90
Lake Odessa|Ionia|3000|42.78|-85.14
Saranac|Ionia|2000|42.93|-85.21
Hastings|Barry|9000|42.65|-85.29
Middleville|Barry|6000|42.71|-85.46
Delton|Barry|3000|42.50|-85.41
Allegan|Allegan|6000|42.53|-85.86
Otsego|Allegan|5000|42.46|-85.70
Plainwell|Allegan|5000|42.44|-85.65
Wayland|Allegan|6000|42.67|-85.64
Hamilton|Allegan|4000|42.68|-86.00
Fennville|Allegan|2000|42.59|-86.10
Saugatuck|Allegan|2000|42.65|-86.20
Hopkins|Allegan|1500|42.62|-85.76
Martin|Allegan|1000|42.54|-85.64
South Haven|Van Buren|6000|42.40|-86.27
Paw Paw|Van Buren|5000|42.22|-85.89
Mattawan|Van Buren|6000|42.21|-85.78
Lawton|Van Buren|2500|42.17|-85.85
Decatur|Van Buren|2000|42.11|-85.97
Hartford|Van Buren|3000|42.21|-86.17
Bangor|Van Buren|2500|42.31|-86.11
Gobles|Van Buren|1500|42.36|-85.88
Lawrence|Van Buren|1500|42.22|-86.05
Bloomingdale|Van Buren|1500|42.38|-85.96
St. Joseph|Berrien|12000|42.09|-86.48
Benton Harbor|Berrien|9000|42.12|-86.45
Niles|Berrien|14000|41.83|-86.25
Stevensville|Berrien|12000|42.01|-86.52
Buchanan|Berrien|5000|41.83|-86.36
Berrien Springs|Berrien|5000|41.95|-86.34
Coloma|Berrien|4000|42.19|-86.31
Bridgman|Berrien|3000|41.94|-86.56
Three Oaks|Berrien|3000|41.80|-86.61
Eau Claire|Berrien|1500|42.00|-86.30
Galien|Berrien|1000|41.80|-86.50
Dowagiac|Cass|6000|41.98|-86.11
Cassopolis|Cass|3000|41.91|-86.01
Edwardsburg|Cass|4000|41.80|-86.08
Marcellus|Cass|2000|42.03|-85.82
Sturgis|St. Joseph|11000|41.80|-85.42
Three Rivers|St. Joseph|8000|41.94|-85.63
Constantine|St. Joseph|2500|41.84|-85.67
White Pigeon|St. Joseph|2000|41.80|-85.64
Centreville|St. Joseph|2000|41.92|-85.53
Mendon|St. Joseph|1500|42.01|-85.45
Colon|St. Joseph|1500|41.96|-85.32
Coldwater|Branch|14000|41.94|-85.00
Quincy|Branch|2500|41.94|-84.88
Bronson|Branch|3000|41.87|-85.19
Union City|Branch|2000|42.07|-85.14
Hillsdale|Hillsdale|8000|41.92|-84.63
Jonesville|Hillsdale|3000|41.98|-84.66
Litchfield|Hillsdale|1500|42.04|-84.76
Reading|Hillsdale|1500|41.84|-84.75
Pittsford|Hillsdale|2000|41.87|-84.47
North Adams|Hillsdale|1000|41.97|-84.53
Camden|Hillsdale|1000|41.76|-84.76
Adrian|Lenawee|21000|41.90|-84.04
Tecumseh|Lenawee|9000|42.00|-83.94
Blissfield|Lenawee|4000|41.83|-83.86
Hudson|Lenawee|3000|41.86|-84.35
Onsted|Lenawee|2000|42.01|-84.19
Morenci|Lenawee|2500|41.72|-84.22
Clinton|Lenawee|3000|42.07|-83.97
Deerfield|Lenawee|1500|41.89|-83.77
Addison|Lenawee|1500|41.99|-84.35
Madison|Lenawee|4000|41.87|-84.10
Sandusky|Sanilac|3000|43.42|-82.83
Croswell|Sanilac|3000|43.27|-82.62
Marlette|Sanilac|2500|43.33|-83.08
Brown City|Sanilac|1500|43.21|-82.99
Deckerville|Sanilac|1500|43.53|-82.74
Carsonville|Sanilac|1000|43.43|-82.67
Peck|Sanilac|1000|43.26|-82.82
Bad Axe|Huron|3500|43.80|-83.00
Harbor Beach|Huron|2000|43.85|-82.65
Ubly|Huron|1500|43.71|-82.94
Pigeon|Huron|2000|43.83|-83.27
Kinde|Huron|1000|43.94|-82.99
Elkton|Huron|1500|43.82|-83.18
Caro|Tuscola|4500|43.49|-83.40
Cass City|Tuscola|2500|43.60|-83.17
Vassar|Tuscola|3000|43.37|-83.58
Reese|Tuscola|2000|43.45|-83.70
Millington|Tuscola|2000|43.28|-83.53
Mayville|Tuscola|1500|43.34|-83.35
Unionville|Tuscola|1500|43.65|-83.47
Kingston|Tuscola|1000|43.41|-83.19
Alma|Gratiot|9400|43.38|-84.66
St. Louis|Gratiot|7000|43.41|-84.61
Ithaca|Gratiot|3000|43.29|-84.61
Breckenridge|Gratiot|2000|43.41|-84.48
Ashley|Gratiot|1000|43.19|-84.48
Mount Pleasant|Isabella|26000|43.60|-84.77
Shepherd|Isabella|2500|43.52|-84.69
Beal City|Isabella|1000|43.65|-84.91
Greenville|Montcalm|9000|43.18|-85.25
Carson City|Montcalm|2000|43.18|-84.85
Lakeview|Montcalm|2000|43.45|-85.27
Stanton|Montcalm|2500|43.29|-85.08
Howard City|Montcalm|2500|43.40|-85.47
Edmore|Montcalm|1500|43.41|-85.04
Vestaburg|Montcalm|1000|43.40|-84.90
Big Rapids|Mecosta|10000|43.70|-85.48
Remus|Mecosta|2000|43.60|-85.15
Morley|Mecosta|1500|43.49|-85.44
Fremont|Newaygo|5000|43.47|-85.94
Newaygo|Newaygo|3000|43.42|-85.80
Grant|Newaygo|2000|43.33|-85.81
White Cloud|Newaygo|2000|43.55|-85.77
Hesperia|Newaygo|1500|43.57|-86.04
Hart|Oceana|3000|43.70|-86.36
Shelby|Oceana|3000|43.61|-86.36
Pentwater|Oceana|1000|43.78|-86.43
Ludington|Mason|8000|43.96|-86.45
Scottville|Mason|2000|43.95|-86.28
Custer|Mason|1000|43.95|-86.22
Manistee|Manistee|6200|44.24|-86.32
Onekama|Manistee|1000|44.36|-86.21
Bear Lake|Manistee|1000|44.42|-86.15
Brethren|Manistee|1000|44.30|-86.00
Baldwin|Lake|2000|43.90|-85.85
Reed City|Osceola|3000|43.87|-85.51
Evart|Osceola|2000|43.90|-85.26
LeRoy|Osceola|1500|44.04|-85.45
Clare|Clare|4000|43.82|-84.77
Harrison|Clare|3000|44.02|-84.80
Farwell|Clare|2000|43.84|-84.87
Gladwin|Gladwin|4000|43.98|-84.49
Beaverton|Gladwin|2000|43.88|-84.48
Standish|Arenac|2500|43.98|-83.96
Au Gres|Arenac|1500|44.05|-83.70
West Branch|Ogemaw|4000|44.28|-84.24
Houghton Lake|Roscommon|4000|44.31|-84.76
Roscommon|Roscommon|2000|44.50|-84.59
Lake City|Missaukee|1500|44.34|-85.21
McBain|Missaukee|1500|44.19|-85.21
Cadillac|Wexford|10400|44.25|-85.40
Manton|Wexford|2000|44.41|-85.40
Mesick|Wexford|1000|44.41|-85.71
Traverse City|Grand Traverse|35000|44.76|-85.62
Kingsley|Grand Traverse|2500|44.58|-85.54
Buckley|Grand Traverse|1000|44.50|-85.68
Benzonia|Benzie|3000|44.62|-86.10
Frankfort|Benzie|2000|44.63|-86.23
Suttons Bay|Leelanau|1500|44.98|-85.65
Glen Arbor|Leelanau|1500|44.88|-85.95
Leland|Leelanau|1000|45.02|-85.76
Kalkaska|Kalkaska|3000|44.73|-85.18
Elk Rapids|Antrim|2500|44.90|-85.42
Bellaire|Antrim|1500|44.98|-85.21
Mancelona|Antrim|2000|44.90|-85.06
Central Lake|Antrim|1000|45.07|-85.26
Charlevoix|Charlevoix|3000|45.32|-85.26
Boyne City|Charlevoix|4000|45.22|-85.01
East Jordan|Charlevoix|2500|45.16|-85.12
Boyne Falls|Charlevoix|1000|45.17|-84.92
Petoskey|Emmet|7000|45.37|-84.96
Harbor Springs|Emmet|2000|45.43|-84.99
Pellston|Emmet|1500|45.55|-84.78
Cheboygan|Cheboygan|5000|45.65|-84.47
Indian River|Cheboygan|2000|45.41|-84.61
Gaylord|Otsego|6000|45.03|-84.67
Johannesburg|Otsego|1500|44.99|-84.46
Grayling|Crawford|3000|44.66|-84.71
Mio|Oscoda|2000|44.65|-84.13
Harrisville|Alcona|1500|44.66|-83.29
Oscoda|Iosco|4000|44.42|-83.33
Tawas City|Iosco|3000|44.27|-83.51
Hale|Iosco|1500|44.38|-83.81
Whittemore|Iosco|1000|44.23|-83.80
Alpena|Alpena|12000|45.06|-83.43
Hillman|Montmorency|1500|45.06|-83.90
Atlanta|Montmorency|1500|45.00|-84.14
Rogers City|Presque Isle|3000|45.42|-83.82
Onaway|Presque Isle|1500|45.36|-84.23
Posen|Presque Isle|1000|45.26|-83.69
Sault Ste. Marie|Chippewa|13300|46.50|-84.35
Brimley|Chippewa|1500|46.41|-84.57
Rudyard|Chippewa|1500|46.23|-84.60
Pickford|Chippewa|1000|46.16|-84.36
St. Ignace|Mackinac|2300|45.87|-84.73
Cedarville|Mackinac|1000|45.99|-84.36
Newberry|Luce|2000|46.35|-85.51
Manistique|Schoolcraft|3000|45.96|-86.25
Munising|Alger|2500|46.41|-86.65
Escanaba|Delta|12400|45.75|-87.06
Gladstone|Delta|5000|45.85|-87.02
Rapid River|Delta|1500|45.92|-86.96
Bark River|Delta|1500|45.71|-87.31
Menominee|Menominee|8500|45.11|-87.61
Stephenson|Menominee|1000|45.42|-87.61
Powers|Menominee|1000|45.69|-87.53
Iron Mountain|Dickinson|7500|45.82|-88.07
Kingsford|Dickinson|5000|45.79|-88.07
Norway|Dickinson|3000|45.79|-87.90
Marquette|Marquette|20600|46.54|-87.40
Negaunee|Marquette|4600|46.50|-87.61
Ishpeming|Marquette|6100|46.49|-87.67
Gwinn|Marquette|2500|46.28|-87.44
Iron River|Iron|3000|46.09|-88.64
Crystal Falls|Iron|1500|46.10|-88.33
L'Anse|Baraga|2000|46.76|-88.45
Houghton|Houghton|8400|47.12|-88.57
Hancock|Houghton|4500|47.13|-88.58
Calumet|Houghton|3000|47.25|-88.45
Lake Linden|Houghton|1500|47.19|-88.41
Ontonagon|Ontonagon|1500|46.87|-89.31
Ironwood|Gogebic|5200|46.45|-90.17
Bessemer|Gogebic|2000|46.48|-90.05
Wakefield|Gogebic|1500|46.48|-89.94
`;

  const cities = RAW.trim()
    .split('\n')
    .map((line) => {
      const [name, county, pop, lat, lon] = line.split('|');
      return { name, county, pop: Number(pop), lat: Number(lat), lon: Number(lon) };
    });

  // Rivers and natural features with an approximate representative point.
  const rivers = [
    ['Grand River', 42.95, -85.4], ['Saginaw', 43.5, -83.95], ['Kalamazoo', 42.4, -85.8], ['St. Joseph', 41.95, -85.9],
    ['Huron', 42.3, -83.7], ['River Raisin', 41.95, -83.8], ['Clinton', 42.6, -83.0], ['Thunder Bay', 45.0, -83.6],
    ['Muskegon', 43.4, -85.8], ['Manistee', 44.3, -85.9], ['Au Sable', 44.6, -84.2], ['Shiawassee', 43.0, -84.1],
    ['Flint River', 43.1, -83.6], ['Cass River', 43.4, -83.5], ['Black River', 43.1, -82.6], ['Rouge', 42.35, -83.3],
    ['Escanaba', 46.0, -87.2], ['Menominee', 45.6, -87.7], ['Tahquamenon', 46.5, -85.3], ['Ontonagon', 46.7, -89.2],
    ['Pere Marquette', 43.9, -86.1], ['Boardman', 44.65, -85.55], ['Thornapple', 42.7, -85.3], ['Looking Glass', 42.85, -84.6],
    ['Red Cedar', 42.7, -84.35], ['Tittabawassee', 43.7, -84.3], ['Pine River', 43.5, -84.6], ['Rifle River', 44.2, -84.0],
    ['Cheboygan River', 45.5, -84.5], ['Paw Paw', 42.2, -86.1], ['Portage', 42.0, -85.6], ['Coldwater River', 41.9, -85.1],
    ['Tiffin', 41.8, -84.2], ['Belle River', 42.9, -82.75], ['Maple River', 43.05, -84.6], ['Flat River', 43.15, -85.25],
    ['White River', 43.5, -86.2], ['Sturgeon', 45.3, -84.6], ['Keweenaw', 47.2, -88.4], ['Gogebic', 46.45, -89.7],
  ].map(([name, lat, lon]) => ({ name, lat, lon }));

  FNG.DATA.michigan = {
    key: 'MI',
    name: 'Michigan',
    center: { lat: 43.3, lon: -84.6 },
    cities,
    rivers,
  };
})();
