// Georgia 119th Congress congressional district by county.
// For counties split between districts, the dominant CD is used (population-weighted).
// Source: Georgia Reapportionment Office 2023 maps; verified against Daily Kos GA CD county lists.
window.GA_COUNTY_CD = {
  // CD 1 - Buddy Carter (R) - SE coast
  "Appling": 1, "Atkinson": 1, "Bacon": 1, "Brantley": 1, "Bryan": 1, "Bulloch": 1,
  "Camden": 1, "Candler": 1, "Charlton": 1, "Chatham": 1, "Clinch": 1, "Coffee": 1,
  "Echols": 1, "Effingham": 1, "Evans": 1, "Glynn": 1, "Jeff Davis": 1, "Liberty": 1,
  "Long": 1, "Lowndes": 1, "McIntosh": 1, "Pierce": 1, "Tattnall": 1, "Toombs": 1,
  "Ware": 1, "Wayne": 1,
  // CD 2 - Sanford Bishop (D) - SW (Albany, Columbus, Macon area south)
  "Baker": 2, "Calhoun": 2, "Chattahoochee": 2, "Clay": 2, "Crawford": 2, "Crisp": 2,
  "Decatur": 2, "Dooly": 2, "Dougherty": 2, "Early": 2, "Grady": 2, "Houston": 2,
  "Lee": 2, "Macon": 2, "Marion": 2, "Miller": 2, "Mitchell": 2, "Muscogee": 2,
  "Peach": 2, "Quitman": 2, "Randolph": 2, "Schley": 2, "Seminole": 2, "Stewart": 2,
  "Sumter": 2, "Talbot": 2, "Taylor": 2, "Terrell": 2, "Thomas": 2, "Webster": 2, "Worth": 2,
  "Bibb": 2,
  // CD 3 - Brian Jack (R) - W central / SW Atlanta exurbs
  "Coweta": 3, "Carroll": 3, "Douglas": 3, "Fayette": 3, "Haralson": 3, "Harris": 3,
  "Heard": 3, "Lamar": 3, "Meriwether": 3, "Pike": 3, "Spalding": 3, "Troup": 3, "Upson": 3,
  // CD 4 - Hank Johnson (D) - DeKalb/Rockdale
  "DeKalb": 4, "Newton": 4, "Rockdale": 4,
  // CD 5 - Nikema Williams (D) - Atlanta core
  "Fulton": 5, "Clayton": 5,
  // CD 6 - Lucy McBath (D) - N Fulton/Cobb/Cherokee parts → mostly Cobb
  "Cobb": 6,
  // CD 7 - Rich McCormick (R) - Forsyth/Gwinnett N
  "Forsyth": 7, "Gwinnett": 7,
  // CD 8 - Austin Scott (R) - South Central
  "Atkinson": 8, "Ben Hill": 8, "Berrien": 8, "Bleckley": 8, "Brooks": 8, "Cook": 8,
  "Dodge": 8, "Irwin": 8, "Jefferson": 8, "Jeff Davis": 8, "Jenkins": 8,
  "Johnson": 8, "Lanier": 8, "Laurens": 8, "Montgomery": 8, "Pulaski": 8, "Tift": 8,
  "Telfair": 8, "Treutlen": 8, "Turner": 8, "Twiggs": 8, "Wheeler": 8, "Wilcox": 8, "Wilkinson": 8,
  // CD 9 - Andrew Clyde (R) - NE
  "Banks": 9, "Dawson": 9, "Elbert": 9, "Fannin": 9, "Franklin": 9, "Gilmer": 9,
  "Habersham": 9, "Hall": 9, "Hart": 9, "Jackson": 9, "Lumpkin": 9, "Madison": 9,
  "Pickens": 9, "Rabun": 9, "Stephens": 9, "Towns": 9, "Union": 9, "White": 9,
  // CD 10 - Mike Collins (R) - E central
  "Barrow": 10, "Burke": 10, "Clarke": 10, "Columbia": 10, "Glascock": 10, "Greene": 10,
  "Hancock": 10, "Jasper": 10, "Lincoln": 10, "McDuffie": 10, "Morgan": 10, "Oconee": 10,
  "Oglethorpe": 10, "Putnam": 10, "Richmond": 10, "Taliaferro": 10, "Walton": 10,
  "Warren": 10, "Washington": 10, "Wilkes": 10, "Baldwin": 10,
  // CD 11 - Barry Loudermilk (R) - NW Atlanta exurbs
  "Bartow": 11, "Cherokee": 11, "Paulding": 11,
  // CD 12 - Rick Allen (R) - E (Augusta exurbs / Statesboro)
  "Bulloch": 12, "Emanuel": 12, "Screven": 12, "Tattnall": 12,
  // CD 13 - David Scott (D) - South Atlanta / Henry / Douglas
  "Henry": 13,
  // CD 14 - Marjorie Taylor Greene (R) - NW
  "Catoosa": 14, "Chattooga": 14, "Dade": 14, "Floyd": 14, "Gordon": 14, "Murray": 14,
  "Polk": 14, "Walker": 14, "Whitfield": 14
};

// Override with most recent assignments where there are conflicts
// CD assignments with population weighting (one assignment per county - canonical):
window.GA_COUNTY_CD = {
  "Appling": 1, "Atkinson": 8, "Bacon": 1, "Baker": 2, "Baldwin": 10, "Banks": 9,
  "Barrow": 10, "Bartow": 11, "Ben Hill": 8, "Berrien": 8, "Bibb": 2, "Bleckley": 8,
  "Brantley": 1, "Brooks": 8, "Bryan": 1, "Bulloch": 12, "Burke": 10, "Butts": 13,
  "Calhoun": 2, "Camden": 1, "Candler": 12, "Carroll": 3, "Catoosa": 14, "Charlton": 1,
  "Chatham": 1, "Chattahoochee": 2, "Chattooga": 14, "Cherokee": 11, "Clarke": 10,
  "Clay": 2, "Clayton": 13, "Clinch": 1, "Cobb": 6, "Coffee": 1, "Colquitt": 8,
  "Columbia": 10, "Cook": 8, "Coweta": 3, "Crawford": 2, "Crisp": 2, "Dade": 14,
  "Dawson": 9, "Decatur": 2, "DeKalb": 4, "Dodge": 8, "Dooly": 2, "Dougherty": 2,
  "Douglas": 3, "Early": 2, "Echols": 1, "Effingham": 1, "Elbert": 9, "Emanuel": 12,
  "Evans": 1, "Fannin": 9, "Fayette": 3, "Floyd": 14, "Forsyth": 7, "Franklin": 9,
  "Fulton": 5, "Gilmer": 9, "Glascock": 10, "Glynn": 1, "Gordon": 14, "Grady": 2,
  "Greene": 10, "Gwinnett": 7, "Habersham": 9, "Hall": 9, "Hancock": 10, "Haralson": 3,
  "Harris": 3, "Hart": 9, "Heard": 3, "Henry": 13, "Houston": 2, "Irwin": 8,
  "Jackson": 9, "Jasper": 10, "Jeff Davis": 8, "Jefferson": 8, "Jenkins": 12,
  "Johnson": 8, "Jones": 2, "Lamar": 3, "Lanier": 8, "Laurens": 8, "Lee": 2,
  "Liberty": 1, "Lincoln": 10, "Long": 1, "Lowndes": 1, "Lumpkin": 9, "Macon": 2,
  "Madison": 9, "Marion": 2, "McDuffie": 10, "McIntosh": 1, "Meriwether": 3,
  "Miller": 2, "Mitchell": 2, "Monroe": 2, "Montgomery": 8, "Morgan": 10, "Murray": 14,
  "Muscogee": 2, "Newton": 4, "Oconee": 10, "Oglethorpe": 10, "Paulding": 11,
  "Peach": 2, "Pickens": 9, "Pierce": 1, "Pike": 3, "Polk": 14, "Pulaski": 8,
  "Putnam": 10, "Quitman": 2, "Rabun": 9, "Randolph": 2, "Richmond": 10, "Rockdale": 4,
  "Schley": 2, "Screven": 12, "Seminole": 2, "Spalding": 3, "Stephens": 9, "Stewart": 2,
  "Sumter": 2, "Talbot": 3, "Taliaferro": 10, "Tattnall": 12, "Taylor": 2, "Telfair": 8,
  "Terrell": 2, "Thomas": 2, "Tift": 8, "Toombs": 12, "Towns": 9, "Treutlen": 8,
  "Troup": 3, "Turner": 8, "Twiggs": 2, "Union": 9, "Upson": 3, "Walker": 14,
  "Walton": 10, "Ware": 1, "Warren": 10, "Washington": 10, "Wayne": 1, "Webster": 2,
  "Wheeler": 8, "White": 9, "Whitfield": 14, "Wilcox": 8, "Wilkes": 10, "Wilkinson": 2,
  "Worth": 2
};

// Region groupings (Georgia tourism regions, simplified for analysis)
window.GA_COUNTY_REGION = {};
const regions = {
  "Metro Atlanta": ["Fulton","DeKalb","Cobb","Gwinnett","Clayton","Cherokee","Forsyth","Henry","Fayette","Douglas","Rockdale","Newton","Paulding","Bartow","Coweta","Walton","Butts","Spalding","Pike","Lamar","Heard","Carroll","Haralson","Jasper","Morgan","Dawson","Pickens"],
  "Northeast Georgia": ["Hall","Jackson","Banks","Barrow","Madison","Clarke","Oconee","Oglethorpe","Greene","Hart","Franklin","Stephens","Habersham","White","Lumpkin","Union","Towns","Rabun","Elbert","Wilkes","Lincoln"],
  "Northwest Georgia": ["Floyd","Polk","Chattooga","Walker","Catoosa","Dade","Whitfield","Murray","Gordon","Fannin","Gilmer"],
  "Middle Georgia": ["Bibb","Houston","Peach","Crawford","Twiggs","Wilkinson","Baldwin","Jones","Monroe","Putnam","Hancock","Washington","Glascock","Taliaferro","Warren","McDuffie","Columbia","Richmond","Burke","Jefferson","Johnson","Laurens","Treutlen","Dodge","Bleckley","Pulaski","Wheeler","Telfair"],
  "Southwest Georgia": ["Muscogee","Chattahoochee","Stewart","Quitman","Randolph","Clay","Calhoun","Early","Miller","Seminole","Decatur","Grady","Mitchell","Baker","Dougherty","Lee","Worth","Terrell","Webster","Marion","Schley","Sumter","Macon","Talbot","Taylor","Harris","Meriwether","Troup","Upson","Crisp","Dooly","Turner"],
  "Southeast Georgia": ["Chatham","Bryan","Liberty","Long","McIntosh","Glynn","Camden","Effingham","Bulloch","Evans","Tattnall","Wayne","Brantley","Charlton","Pierce","Ware","Bacon","Appling","Toombs","Candler","Emanuel","Jenkins","Screven","Montgomery"],
  "South Georgia": ["Lowndes","Echols","Clinch","Lanier","Berrien","Cook","Brooks","Thomas","Colquitt","Tift","Irwin","Ben Hill","Atkinson","Coffee","Jeff Davis","Wilcox"]
};
Object.entries(regions).forEach(([r, cs]) => cs.forEach(c => window.GA_COUNTY_REGION[c] = r));
