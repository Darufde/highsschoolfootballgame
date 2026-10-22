/* Name pools for players, schools and leagues. */
(function () {
  'use strict';
  const FNG = (window.FNG = window.FNG || {});
  FNG.DATA = FNG.DATA || {};

  const split = (s) => s.trim().split(/\s*,\s*/);

  FNG.DATA.names = {
    first: split(`
      Aaron, Adam, Aiden, AJ, Alex, Andre, Andrew, Anthony, Antonio, Austin, Ben, Blake, Brady, Brandon, Brayden,
      Brendan, Brennan, Brett, Brian, Brody, Bryce, Caleb, Calvin, Cam, Cameron, Carson, Carter, Chase, Chris,
      Cody, Colin, Colton, Connor, Cooper, Corey, Dalton, Damian, Damon, Daniel, Dante, Darius, David, Davion, Deandre,
      Derek, Devin, Devon, Dominic, Donovan, Drew, Dylan, Eli, Elijah, Eric, Ethan, Evan, Gabe, Gage, Garrett, Gavin,
      Grant, Grayson, Hayden, Hunter, Isaac, Isaiah, Jace, Jack, Jackson, Jacob, Jaden, Jake, Jalen, Jamal, James,
      Jared, Jason, Javon, Jaylen, Jeremiah, Jesse, Joel, John, Jonah, Jordan, Joseph, Josh, Josiah, Julian, Justin,
      Kaden, Kai, Keegan, Keith, Kendall, Kevin, Kobe, Kyle, Landon, Lane, Leo, Levi, Liam, Logan, Lucas, Luke,
      Malik, Marcus, Mason, Matt, Max, Micah, Michael, Miles, Mitchell, Nate, Nathan, Nick, Noah, Nolan, Owen, Parker,
      Peyton, Preston, Quinn, Reese, Ricky, Riley, Roman, Ryan, Sam, Sean, Seth, Shane, Spencer, Terrell, Trent,
      Trevor, Tristan, Ty, Tyler, Tyrese, Wade, Wes, Will, Wyatt, Xavier, Zach, Zane, Mateo, Diego, Marco, Luis,
      Andres, Ivan, Nikolai, Omar, Khalil, Malachi, Jamari, Cortez, Desmond, Keon, Tavion, Rashad, Quentin, Beau
    `),
    last: split(`
      Adams, Allen, Anderson, Bailey, Baker, Barnes, Bauer, Beck, Becker, Bell, Bennett, Berger, Bishop, Black, Boyd,
      Bradley, Brewer, Brooks, Brown, Bryant, Burke, Butler, Byrd, Campbell, Carpenter, Carter, Castillo, Chambers,
      Clark, Cole, Coleman, Collins, Conley, Cook, Cooper, Cox, Crawford, Cross, Cunningham, Daniels, Davis, Dawson,
      Dixon, Douglas, Duncan, Dunn, Edwards, Elliott, Ellis, Evans, Ferguson, Fischer, Fisher, Fleming, Ford, Foster,
      Fox, Franklin, Freeman, Fuller, Garcia, Gardner, Gibson, Gilbert, Gordon, Graham, Grant, Gray, Green, Griffin,
      Hahn, Hall, Hamilton, Hansen, Harper, Harris, Hart, Hayes, Henderson, Henry, Hill, Hoffman, Holland, Holmes,
      Hopkins, Howard, Hudson, Hughes, Hunt, Jackson, James, Jenkins, Johnson, Jones, Jordan, Kaiser, Keller, Kelly,
      Kennedy, King, Klein, Knight, Koch, Kowalski, Kraus, Lane, Lawrence, Lee, Lewis, Long, Lucas, Lynch, Marshall,
      Martin, Martinez, Mason, Matthews, Maxwell, McCarthy, McDonald, Meyer, Miller, Mitchell, Moore, Morgan, Morris,
      Murphy, Murray, Myers, Nelson, Newman, Nichols, Novak, O'Brien, Olson, Owens, Palmer, Parker, Patterson, Payne,
      Perry, Peters, Peterson, Phillips, Porter, Powell, Price, Quinn, Ramirez, Ramsey, Reed, Reid, Reyes, Reynolds,
      Rice, Richards, Richardson, Riley, Roberts, Robinson, Rodgers, Rogers, Ross, Russell, Ryan, Sanders, Schmidt,
      Schneider, Schroeder, Schultz, Scott, Shaw, Simmons, Simpson, Sims, Smith, Snyder, Spencer, Stevens, Stewart,
      Stone, Sullivan, Sutton, Taylor, Thomas, Thompson, Tucker, Turner, Vance, Wagner, Walker, Wallace, Walsh, Ward,
      Warner, Washington, Watson, Weaver, Webb, Weber, Wells, West, White, Williams, Willis, Wilson, Wise, Wolfe,
      Wood, Woods, Wright, Young, Zimmerman, Yoder, Hershberger, Troyer, Zielinski, Brandt, Dietrich, Engel, Hartman
    `),
    saints: split(`
      Ambrose, Anselm, Augustine, Benedict, Bernard, Bonaventure, Brendan, Casimir, Charles, Clement, Columba,
      Dominic, Edward, Francis, Gabriel, Gregory, Hubert, Ignatius, Jerome, John, Joseph, Jude, Lawrence, Leo, Luke,
      Mark, Martin, Matthew, Michael, Nicholas, Patrick, Paul, Peter, Philip, Pius, Raphael, Sebastian, Stephen,
      Thomas, Vincent, Wendelin, Aloysius, Bede, Cyril, Damian, Kilian, Malachy, Norbert, Remigius, Albert
    `),
    clergy: split(`
      Kelleher, Donnelly, Hartigan, Mullaney, Brennan, Fitzgerald, Gallagher, Kerrigan, McAuley, Moynihan, Dempsey,
      Rosetti, Kowalczyk, Schreiber, Vogel, Hennessy, Callahan, Flaherty, Lombardi, Mahoney, Corcoran, Dolan,
      Healy, Keane, Reilly, Sheehan, Tierney, Walsh, Breen, Conroy, Devlin, Garrity, Mulcahy, Noonan, Quigley
    `),
    ourLady: split(`
      Mercy, Grace, Lourdes, Peace, the Lake, the Valley, Good Counsel, Victory, Hope, Perpetual Help, the Hills
    `),
    holy: split(`Cross, Name, Trinity, Family, Spirit, Redeemer, Rosary, Angels`),
    christian: split(`
      Grace, Faith, Calvary, Heritage, Cornerstone, Covenant, Trinity, Victory, Harvest, Lighthouse, Providence,
      Redeemer, Emmanuel, Shiloh, Zion, Liberty, Crossroads, Living Word, New Hope, Rock Hill, Wellspring, Summit
    `),
    historic: split(`
      Garfield, McKinley, Harding, Taft, Hayes, Grant, Sherman, Edison, Wright, Glenn, Armstrong, Owens, Stowe, Chase,
      Tod, Whitmore, Hartwell, Kensington, Ashbury, Lancaster, Whittier, Hawthorne, Emerson, Longfellow, Morrison,
      Brookings, Sterling, Harmon, Whitfield, Carver, Douglass, Lowell, Bancroft, Kingsley, Thurman, Hollister,
      Prescott, Beecher, Fulton, Roebling, Putnam, Cutler, Symmes, Worthington, Galloway, Meeker, Abbott, Ellery
    `),
    compoundPre: split(`
      Brook, Oak, Elm, Maple, Ridge, Fair, Glen, Lake, River, Spring, Wood, Pine, Cedar, Clear, Green, High, Silver,
      Stone, Willow, Ash, Briar, Hazel, Kings, Mid, Shady, Rock, Sun, Bel, Wal, Hill, Meadow, Bright, Wind, Haw,
      Crest, Linden, Bur, Holly, Whit, Fox
    `),
    compoundSuf: split(`
      wood, view, mont, dale, field, ridge, land, crest, haven, brook, ford, side, more, ton, way, gate, port,
      hurst, burg, wick, moor, croft, mead, worth
    `),
    dirs: split(`North, South, East, West, Central`),
    dirErn: split(`Northern, Southern, Eastern, Western, Northwestern, Northeastern, Southwestern, Southeastern`),
    dirShort: split(`North, South, East, West, Northwest, Northeast, Southwest, Southeast`),
    townships: split(`
      Jackson, Liberty, Union, Washington, Franklin, Madison, Monroe, Jefferson, Harrison, Perry, Clay, Wayne,
      Green, Marion, Benton, Pleasant, Center, Salem, Richland, Milton, Plain, Butler, Lake, Scott, Allen,
      Morgan, Brown, Pike, Knox, Logan, Mercer, Paris, York, Auburn, Berlin, Canaan, Hopewell, Mifflin, Sharon,
      Vernon, Rawson, Cory, Ridge, Buckland, Elmwood, Fairview, Harmony, Hanover, Chester, Bristol, Bloom
    `),
    tri: split(`Valley, County, Village, Rivers, Township, Lakes, Hills`),
    localNouns: split(`Valley, Ridge, Heights, Hills, Plains, Local, Central, Highlands, Trail`),
    prepSuffix: split(`Academy, Preparatory, School, Country Day`),
    leagueGeneric: split(`
      Buckeye Conference, Heartland Conference, Frontier League, Pioneer Conference, Lakeland Conference,
      Mid-State League, Tri-County Conference, Inter-County League, Federal League, Metro League,
      Greater Ohio Conference, Mid-Buckeye Conference, Ohio Heritage Conference, Cardinal Conference,
      Firelands Conference, Black Swamp Conference, Western Reserve Conference, Portage Trail League,
      Erie Shores Conference, Allegheny Valley League, Appalachian Conference, Northern Lakes League,
      Great Lakes League, Keystone Conference, Patriot League, Capital Conference, Crossroads Conference,
      Twin Valley League, Tri-Rivers Conference, Midland League, Prairie League, Pinnacle Conference,
      Sentinel League, Liberty Conference, Summit Conference, Ridgeline Conference, Harvest League,
      Canal Conference, Railroad League, Covered Bridge Conference
    `),
  };
})();
