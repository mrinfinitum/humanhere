// Approximate centers for places people type as their location. A story's pin
// is only ever one of these centroids, never a precise spot, and a place this
// list does not know simply gets no pin. Kept in code so typed locations are
// never sent to an outside geocoding service.

type Precision = "city" | "region" | "country";
export type PlaceCentroid = { latitude: number; longitude: number; precision: Precision; label: string };

const STATES: Record<string, [string, number, number]> = {
  al: ["Alabama", 32.8, -86.8], ak: ["Alaska", 64.2, -152.5], az: ["Arizona", 34.3, -111.7], ar: ["Arkansas", 34.9, -92.4],
  ca: ["California", 37.2, -119.5], co: ["Colorado", 39.0, -105.5], ct: ["Connecticut", 41.6, -72.7], de: ["Delaware", 39.0, -75.5],
  fl: ["Florida", 28.6, -82.4], ga: ["Georgia", 32.7, -83.4], hi: ["Hawaii", 20.8, -156.3], id: ["Idaho", 44.4, -114.6],
  il: ["Illinois", 40.0, -89.2], in: ["Indiana", 39.9, -86.3], ia: ["Iowa", 42.1, -93.5], ks: ["Kansas", 38.5, -98.4],
  ky: ["Kentucky", 37.5, -85.3], la: ["Louisiana", 31.1, -92.0], me: ["Maine", 45.4, -69.2], md: ["Maryland", 39.0, -76.8],
  ma: ["Massachusetts", 42.3, -71.8], mi: ["Michigan", 44.3, -85.4], mn: ["Minnesota", 46.3, -94.3], ms: ["Mississippi", 32.7, -89.7],
  mo: ["Missouri", 38.4, -92.5], mt: ["Montana", 47.0, -109.6], ne: ["Nebraska", 41.5, -99.8], nv: ["Nevada", 39.3, -116.6],
  nh: ["New Hampshire", 43.7, -71.6], nj: ["New Jersey", 40.2, -74.7], nm: ["New Mexico", 34.4, -106.1], ny: ["New York", 42.9, -75.5],
  nc: ["North Carolina", 35.6, -79.4], nd: ["North Dakota", 47.5, -100.5], oh: ["Ohio", 40.3, -82.8], ok: ["Oklahoma", 35.6, -97.5],
  or: ["Oregon", 43.9, -120.6], pa: ["Pennsylvania", 40.9, -77.8], ri: ["Rhode Island", 41.7, -71.5], sc: ["South Carolina", 33.9, -80.9],
  sd: ["South Dakota", 44.4, -100.2], tn: ["Tennessee", 35.9, -86.4], tx: ["Texas", 31.5, -99.3], ut: ["Utah", 39.3, -111.7],
  vt: ["Vermont", 44.1, -72.7], va: ["Virginia", 37.5, -78.8], wa: ["Washington", 47.4, -120.5], wv: ["West Virginia", 38.6, -80.6],
  wi: ["Wisconsin", 44.6, -89.9], wy: ["Wyoming", 43.0, -107.6], dc: ["District of Columbia", 38.9, -77.03],
};

// [city, state code, latitude, longitude]
const US_CITIES: Array<[string, string, number, number]> = [
  ["New York", "ny", 40.71, -74.01], ["Brooklyn", "ny", 40.68, -73.94], ["Queens", "ny", 40.73, -73.79], ["Bronx", "ny", 40.84, -73.87],
  ["Buffalo", "ny", 42.89, -78.88], ["Rochester", "ny", 43.16, -77.61], ["Albany", "ny", 42.65, -73.76], ["Syracuse", "ny", 43.05, -76.15],
  ["Los Angeles", "ca", 34.05, -118.24], ["San Diego", "ca", 32.72, -117.16], ["San Jose", "ca", 37.34, -121.89], ["San Francisco", "ca", 37.77, -122.42],
  ["Fresno", "ca", 36.74, -119.79], ["Sacramento", "ca", 38.58, -121.49], ["Long Beach", "ca", 33.77, -118.19], ["Oakland", "ca", 37.80, -122.27],
  ["Bakersfield", "ca", 35.37, -119.02], ["Anaheim", "ca", 33.84, -117.91], ["Riverside", "ca", 33.95, -117.40], ["Stockton", "ca", 37.96, -121.29],
  ["Chicago", "il", 41.88, -87.63], ["Springfield", "il", 39.78, -89.65], ["Peoria", "il", 40.69, -89.59],
  ["Houston", "tx", 29.76, -95.37], ["San Antonio", "tx", 29.42, -98.49], ["Dallas", "tx", 32.78, -96.80], ["Austin", "tx", 30.27, -97.74],
  ["Fort Worth", "tx", 32.76, -97.33], ["El Paso", "tx", 31.76, -106.49], ["Arlington", "tx", 32.74, -97.11], ["Corpus Christi", "tx", 27.80, -97.40],
  ["Plano", "tx", 33.02, -96.70], ["Lubbock", "tx", 33.58, -101.86], ["Amarillo", "tx", 35.22, -101.83], ["Waco", "tx", 31.55, -97.15],
  ["Phoenix", "az", 33.45, -112.07], ["Tucson", "az", 32.22, -110.97], ["Mesa", "az", 33.42, -111.83], ["Scottsdale", "az", 33.49, -111.93], ["Flagstaff", "az", 35.20, -111.65],
  ["Philadelphia", "pa", 39.95, -75.17], ["Pittsburgh", "pa", 40.44, -80.00], ["Allentown", "pa", 40.60, -75.49], ["Harrisburg", "pa", 40.27, -76.88],
  ["Jacksonville", "fl", 30.33, -81.66], ["Miami", "fl", 25.76, -80.19], ["Tampa", "fl", 27.95, -82.46], ["Orlando", "fl", 28.54, -81.38],
  ["St. Petersburg", "fl", 27.77, -82.64], ["Tallahassee", "fl", 30.44, -84.28], ["Fort Lauderdale", "fl", 26.12, -80.14], ["Gainesville", "fl", 29.65, -82.32],
  ["Columbus", "oh", 39.96, -83.00], ["Cleveland", "oh", 41.50, -81.69], ["Cincinnati", "oh", 39.10, -84.51], ["Toledo", "oh", 41.65, -83.54], ["Akron", "oh", 41.08, -81.52], ["Dayton", "oh", 39.76, -84.19],
  ["Charlotte", "nc", 35.23, -80.84], ["Raleigh", "nc", 35.78, -78.64], ["Greensboro", "nc", 36.07, -79.79], ["Durham", "nc", 35.99, -78.90], ["Asheville", "nc", 35.60, -82.55],
  ["Indianapolis", "in", 39.77, -86.16], ["Fort Wayne", "in", 41.08, -85.14], ["Evansville", "in", 37.97, -87.57],
  ["Seattle", "wa", 47.61, -122.33], ["Spokane", "wa", 47.66, -117.43], ["Tacoma", "wa", 47.25, -122.44],
  ["Denver", "co", 39.74, -104.99], ["Colorado Springs", "co", 38.83, -104.82], ["Aurora", "co", 39.73, -104.83], ["Boulder", "co", 40.01, -105.27],
  ["Washington", "dc", 38.91, -77.04], ["Boston", "ma", 42.36, -71.06], ["Worcester", "ma", 42.26, -71.80], ["Springfield", "ma", 42.10, -72.59],
  ["Nashville", "tn", 36.16, -86.78], ["Memphis", "tn", 35.15, -90.05], ["Knoxville", "tn", 35.96, -83.92], ["Chattanooga", "tn", 35.05, -85.31],
  ["Detroit", "mi", 42.33, -83.05], ["Grand Rapids", "mi", 42.96, -85.67], ["Lansing", "mi", 42.73, -84.56], ["Ann Arbor", "mi", 42.28, -83.74], ["Flint", "mi", 43.01, -83.69],
  ["Oklahoma City", "ok", 35.47, -97.52], ["Tulsa", "ok", 36.15, -95.99], ["Norman", "ok", 35.22, -97.44], ["Broken Arrow", "ok", 36.05, -95.79], ["Lawton", "ok", 34.60, -98.39], ["Edmond", "ok", 35.65, -97.48],
  ["Portland", "or", 45.52, -122.68], ["Eugene", "or", 44.05, -123.09], ["Salem", "or", 44.94, -123.04], ["Portland", "me", 43.66, -70.26],
  ["Las Vegas", "nv", 36.17, -115.14], ["Reno", "nv", 39.53, -119.81], ["Henderson", "nv", 36.04, -114.98],
  ["Louisville", "ky", 38.25, -85.76], ["Lexington", "ky", 38.04, -84.50], ["Baltimore", "md", 39.29, -76.61],
  ["Milwaukee", "wi", 43.04, -87.91], ["Madison", "wi", 43.07, -89.40], ["Green Bay", "wi", 44.51, -88.02],
  ["Albuquerque", "nm", 35.08, -106.65], ["Santa Fe", "nm", 35.69, -105.94], ["Las Cruces", "nm", 32.32, -106.76],
  ["Kansas City", "mo", 39.10, -94.58], ["St. Louis", "mo", 38.63, -90.20], ["Springfield", "mo", 37.21, -93.29], ["Columbia", "mo", 38.95, -92.33],
  ["Kansas City", "ks", 39.11, -94.63], ["Wichita", "ks", 37.69, -97.34], ["Topeka", "ks", 39.05, -95.68], ["Overland Park", "ks", 38.98, -94.67],
  ["Atlanta", "ga", 33.75, -84.39], ["Savannah", "ga", 32.08, -81.09], ["Augusta", "ga", 33.47, -81.97], ["Columbus", "ga", 32.46, -84.99], ["Macon", "ga", 32.84, -83.63],
  ["Omaha", "ne", 41.26, -95.93], ["Lincoln", "ne", 40.81, -96.70], ["Minneapolis", "mn", 44.98, -93.27], ["St. Paul", "mn", 44.95, -93.09], ["Duluth", "mn", 46.79, -92.10],
  ["New Orleans", "la", 29.95, -90.07], ["Baton Rouge", "la", 30.45, -91.19], ["Shreveport", "la", 32.53, -93.75], ["Lafayette", "la", 30.22, -92.02],
  ["Virginia Beach", "va", 36.85, -75.98], ["Richmond", "va", 37.54, -77.44], ["Norfolk", "va", 36.85, -76.29], ["Roanoke", "va", 37.27, -79.94],
  ["Birmingham", "al", 33.52, -86.80], ["Montgomery", "al", 32.38, -86.30], ["Mobile", "al", 30.69, -88.04], ["Huntsville", "al", 34.73, -86.59],
  ["Little Rock", "ar", 34.75, -92.29], ["Fayetteville", "ar", 36.06, -94.16], ["Fort Smith", "ar", 35.39, -94.40], ["Jackson", "ms", 32.30, -90.18],
  ["Salt Lake City", "ut", 40.76, -111.89], ["Provo", "ut", 40.23, -111.66], ["Boise", "id", 43.62, -116.21], ["Des Moines", "ia", 41.59, -93.62], ["Cedar Rapids", "ia", 41.98, -91.67],
  ["Honolulu", "hi", 21.31, -157.86], ["Anchorage", "ak", 61.22, -149.90], ["Billings", "mt", 45.78, -108.50], ["Fargo", "nd", 46.88, -96.79], ["Sioux Falls", "sd", 43.55, -96.73],
  ["Cheyenne", "wy", 41.14, -104.82], ["Charleston", "sc", 32.78, -79.93], ["Columbia", "sc", 34.00, -81.03], ["Greenville", "sc", 34.85, -82.40], ["Charleston", "wv", 38.35, -81.63],
  ["Providence", "ri", 41.82, -71.41], ["Hartford", "ct", 41.76, -72.69], ["New Haven", "ct", 41.31, -72.92], ["Newark", "nj", 40.74, -74.17], ["Jersey City", "nj", 40.73, -74.08],
  ["Wilmington", "de", 39.74, -75.55], ["Manchester", "nh", 42.99, -71.46], ["Burlington", "vt", 44.48, -73.21],
];

// [name, latitude, longitude, country name for "City, Country" matching]
const WORLD_CITIES: Array<[string, number, number, string]> = [
  ["London", 51.51, -0.13, "united kingdom"], ["Manchester", 53.48, -2.24, "united kingdom"], ["Birmingham", 52.49, -1.89, "united kingdom"], ["Glasgow", 55.86, -4.25, "united kingdom"], ["Edinburgh", 55.95, -3.19, "united kingdom"],
  ["Dublin", 53.35, -6.26, "ireland"], ["Paris", 48.86, 2.35, "france"], ["Berlin", 52.52, 13.40, "germany"], ["Madrid", 40.42, -3.70, "spain"], ["Barcelona", 41.39, 2.17, "spain"],
  ["Rome", 41.90, 12.50, "italy"], ["Milan", 45.46, 9.19, "italy"], ["Amsterdam", 52.37, 4.90, "netherlands"], ["Brussels", 50.85, 4.35, "belgium"], ["Lisbon", 38.72, -9.14, "portugal"],
  ["Vienna", 48.21, 16.37, "austria"], ["Zurich", 47.38, 8.54, "switzerland"], ["Stockholm", 59.33, 18.07, "sweden"], ["Oslo", 59.91, 10.75, "norway"], ["Copenhagen", 55.68, 12.57, "denmark"],
  ["Warsaw", 52.23, 21.01, "poland"], ["Prague", 50.08, 14.44, "czech republic"], ["Athens", 37.98, 23.73, "greece"], ["Istanbul", 41.01, 28.98, "turkey"], ["Kyiv", 50.45, 30.52, "ukraine"],
  ["Toronto", 43.65, -79.38, "canada"], ["Montreal", 45.50, -73.57, "canada"], ["Vancouver", 49.28, -123.12, "canada"], ["Calgary", 51.05, -114.07, "canada"], ["Ottawa", 45.42, -75.70, "canada"],
  ["Mexico City", 19.43, -99.13, "mexico"], ["Guadalajara", 20.66, -103.35, "mexico"], ["Monterrey", 25.69, -100.32, "mexico"], ["Tijuana", 32.51, -117.04, "mexico"],
  ["Guatemala City", 14.63, -90.51, "guatemala"], ["San Salvador", 13.69, -89.22, "el salvador"], ["Tegucigalpa", 14.07, -87.19, "honduras"], ["San José", 9.93, -84.08, "costa rica"], ["Panama City", 8.98, -79.52, "panama"],
  ["Havana", 23.11, -82.37, "cuba"], ["Santo Domingo", 18.49, -69.93, "dominican republic"], ["San Juan", 18.47, -66.11, "puerto rico"], ["Port-au-Prince", 18.59, -72.31, "haiti"], ["Kingston", 18.02, -76.80, "jamaica"],
  ["Bogotá", 4.71, -74.07, "colombia"], ["Medellín", 6.24, -75.58, "colombia"], ["Lima", -12.05, -77.04, "peru"], ["Quito", -0.18, -78.47, "ecuador"], ["Caracas", 10.48, -66.90, "venezuela"],
  ["Santiago", -33.45, -70.67, "chile"], ["Buenos Aires", -34.60, -58.38, "argentina"], ["São Paulo", -23.55, -46.63, "brazil"], ["Rio de Janeiro", -22.91, -43.17, "brazil"], ["Montevideo", -34.90, -56.16, "uruguay"],
  ["Lagos", 6.52, 3.38, "nigeria"], ["Abuja", 9.08, 7.40, "nigeria"], ["Accra", 5.60, -0.19, "ghana"], ["Nairobi", -1.29, 36.82, "kenya"], ["Addis Ababa", 9.03, 38.74, "ethiopia"],
  ["Johannesburg", -26.20, 28.05, "south africa"], ["Cape Town", -33.92, 18.42, "south africa"], ["Cairo", 30.04, 31.24, "egypt"], ["Casablanca", 33.57, -7.59, "morocco"], ["Kampala", 0.35, 32.58, "uganda"], ["Kinshasa", -4.44, 15.27, "democratic republic of the congo"],
  ["Dubai", 25.20, 55.27, "united arab emirates"], ["Riyadh", 24.71, 46.68, "saudi arabia"], ["Tel Aviv", 32.09, 34.78, "israel"], ["Jerusalem", 31.77, 35.21, "israel"], ["Amman", 31.95, 35.93, "jordan"], ["Beirut", 33.89, 35.50, "lebanon"],
  ["Mumbai", 19.08, 72.88, "india"], ["Delhi", 28.70, 77.10, "india"], ["New Delhi", 28.61, 77.21, "india"], ["Bangalore", 12.97, 77.59, "india"], ["Chennai", 13.08, 80.27, "india"], ["Kolkata", 22.57, 88.36, "india"],
  ["Karachi", 24.86, 67.01, "pakistan"], ["Lahore", 31.55, 74.34, "pakistan"], ["Dhaka", 23.81, 90.41, "bangladesh"], ["Kathmandu", 27.72, 85.32, "nepal"], ["Colombo", 6.93, 79.86, "sri lanka"],
  ["Tokyo", 35.68, 139.69, "japan"], ["Osaka", 34.69, 135.50, "japan"], ["Seoul", 37.57, 126.98, "south korea"], ["Beijing", 39.90, 116.41, "china"], ["Shanghai", 31.23, 121.47, "china"], ["Hong Kong", 22.32, 114.17, "china"],
  ["Taipei", 25.03, 121.57, "taiwan"], ["Manila", 14.60, 120.98, "philippines"], ["Bangkok", 13.76, 100.50, "thailand"], ["Hanoi", 21.03, 105.85, "vietnam"], ["Ho Chi Minh City", 10.82, 106.63, "vietnam"],
  ["Singapore", 1.35, 103.82, "singapore"], ["Kuala Lumpur", 3.14, 101.69, "malaysia"], ["Jakarta", -6.21, 106.85, "indonesia"],
  ["Sydney", -33.87, 151.21, "australia"], ["Melbourne", -37.81, 144.96, "australia"], ["Brisbane", -27.47, 153.03, "australia"], ["Perth", -31.95, 115.86, "australia"], ["Auckland", -36.85, 174.76, "new zealand"],
];

const COUNTRIES: Record<string, [string, number, number]> = {
  "united states": ["United States", 39.8, -98.6], usa: ["United States", 39.8, -98.6], us: ["United States", 39.8, -98.6], america: ["United States", 39.8, -98.6],
  canada: ["Canada", 56.1, -106.3], mexico: ["Mexico", 23.6, -102.6], "united kingdom": ["United Kingdom", 54.0, -2.5], uk: ["United Kingdom", 54.0, -2.5], england: ["England", 52.4, -1.5],
  scotland: ["Scotland", 56.5, -4.2], wales: ["Wales", 52.1, -3.8], ireland: ["Ireland", 53.4, -8.2], france: ["France", 46.6, 2.2], germany: ["Germany", 51.2, 10.5], spain: ["Spain", 40.4, -3.7],
  portugal: ["Portugal", 39.4, -8.2], italy: ["Italy", 42.8, 12.6], netherlands: ["Netherlands", 52.1, 5.3], belgium: ["Belgium", 50.6, 4.6], switzerland: ["Switzerland", 46.8, 8.2], austria: ["Austria", 47.6, 14.6],
  poland: ["Poland", 52.1, 19.4], ukraine: ["Ukraine", 48.4, 31.2], greece: ["Greece", 39.1, 21.8], turkey: ["Turkey", 39.0, 35.2], sweden: ["Sweden", 62.2, 17.6], norway: ["Norway", 61.4, 8.5], denmark: ["Denmark", 56.0, 10.0],
  "czech republic": ["Czech Republic", 49.8, 15.5], guatemala: ["Guatemala", 15.8, -90.2], "el salvador": ["El Salvador", 13.8, -88.9], honduras: ["Honduras", 15.2, -86.2], nicaragua: ["Nicaragua", 12.9, -85.2],
  "costa rica": ["Costa Rica", 9.7, -83.8], panama: ["Panama", 8.5, -80.8], cuba: ["Cuba", 21.5, -78.0], "dominican republic": ["Dominican Republic", 18.7, -70.2], haiti: ["Haiti", 19.0, -72.3], jamaica: ["Jamaica", 18.1, -77.3],
  "puerto rico": ["Puerto Rico", 18.2, -66.5], colombia: ["Colombia", 4.6, -74.3], venezuela: ["Venezuela", 6.4, -66.6], ecuador: ["Ecuador", -1.8, -78.2], peru: ["Peru", -9.2, -75.0], brazil: ["Brazil", -14.2, -51.9],
  chile: ["Chile", -35.7, -71.5], argentina: ["Argentina", -38.4, -63.6], uruguay: ["Uruguay", -32.5, -55.8], nigeria: ["Nigeria", 9.1, 8.7], ghana: ["Ghana", 7.9, -1.0], kenya: ["Kenya", -0.0, 37.9],
  ethiopia: ["Ethiopia", 9.1, 40.5], uganda: ["Uganda", 1.4, 32.3], "south africa": ["South Africa", -30.6, 22.9], egypt: ["Egypt", 26.8, 30.8], morocco: ["Morocco", 31.8, -7.1],
  "democratic republic of the congo": ["DR Congo", -4.0, 21.8], "united arab emirates": ["United Arab Emirates", 23.4, 53.8], "saudi arabia": ["Saudi Arabia", 23.9, 45.1], israel: ["Israel", 31.0, 34.9],
  jordan: ["Jordan", 30.6, 36.2], lebanon: ["Lebanon", 33.9, 35.9], india: ["India", 20.6, 79.0], pakistan: ["Pakistan", 30.4, 69.3], bangladesh: ["Bangladesh", 23.7, 90.4], nepal: ["Nepal", 28.4, 84.1],
  "sri lanka": ["Sri Lanka", 7.9, 80.8], china: ["China", 35.9, 104.2], japan: ["Japan", 36.2, 138.3], "south korea": ["South Korea", 35.9, 127.8], korea: ["South Korea", 35.9, 127.8], taiwan: ["Taiwan", 23.7, 121.0],
  philippines: ["Philippines", 12.9, 121.8], thailand: ["Thailand", 15.9, 101.0], vietnam: ["Vietnam", 14.1, 108.3], singapore: ["Singapore", 1.35, 103.8], malaysia: ["Malaysia", 4.2, 102.0],
  indonesia: ["Indonesia", -0.8, 113.9], australia: ["Australia", -25.3, 133.8], "new zealand": ["New Zealand", -40.9, 174.9],
};

const STATE_BY_NAME = new Map(Object.entries(STATES).map(([code, [name]]) => [normalize(name), code]));

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\./g, "").replace(/[^a-z0-9 ,-]/g, " ").replace(/\s+/g, " ").trim();
}

function stateCode(part: string) {
  const key = normalize(part);
  if (Object.hasOwn(STATES, key)) return key;
  return STATE_BY_NAME.get(key) ?? null;
}

type City = { name: string; latitude: number; longitude: number };
const usCity = (city: string, code: string | null): City[] => US_CITIES
  .filter(([name, state]) => normalize(name) === city && (!code || state === code))
  .map(([name, , latitude, longitude]) => ({ name, latitude, longitude }));
const worldCity = (city: string, country: string | null): City[] => WORLD_CITIES
  .filter(([name, , , nation]) => normalize(name) === city && (!country || nation === country))
  .map(([name, latitude, longitude]) => ({ name, latitude, longitude }));

const US_NAMES = new Set(["united states", "usa", "us", "america"]);
const cityCentroid = ({ name, latitude, longitude }: City): PlaceCentroid => ({ latitude, longitude, precision: "city", label: name });

/**
 * Matches what a member typed as their location ("Tulsa, OK", "Tulsa",
 * "Oklahoma", "Lagos, Nigeria") to an approximate center. Returns null when the
 * place is unknown or ambiguous, so the story simply has no pin.
 */
export function placeCentroid(typed: string | null | undefined): PlaceCentroid | null {
  if (!typed) return null;
  const parts = normalize(typed).split(",").map(part => part.trim()).filter(Boolean);
  if (!parts.length || parts.length > 4) return null;
  const [first, qualifier] = parts;

  // "City, State" or "City, Country"; an unknown city falls back to the state or country.
  if (qualifier) {
    const code = stateCode(qualifier);
    const country = COUNTRIES[qualifier] ? normalize(COUNTRIES[qualifier][0]) : null;
    const cities = code ? usCity(first, code) : US_NAMES.has(qualifier) ? usCity(first, null) : worldCity(first, country ?? qualifier);
    if (cities.length === 1) return cityCentroid(cities[0]);
    if (code) return { latitude: STATES[code][1], longitude: STATES[code][2], precision: "region", label: STATES[code][0] };
    if (COUNTRIES[qualifier]) return { latitude: COUNTRIES[qualifier][1], longitude: COUNTRIES[qualifier][2], precision: "country", label: COUNTRIES[qualifier][0] };
    return null;
  }

  // A single name: a city only when it is unambiguous, then a state, then a country.
  const cities = [...usCity(first, null), ...worldCity(first, null)];
  if (cities.length === 1) return cityCentroid(cities[0]);
  if (cities.length > 1) return null;
  const code = stateCode(first);
  if (code && first.length > 2) return { latitude: STATES[code][1], longitude: STATES[code][2], precision: "region", label: STATES[code][0] };
  if (COUNTRIES[first]) return { latitude: COUNTRIES[first][1], longitude: COUNTRIES[first][2], precision: "country", label: COUNTRIES[first][0] };
  return null;
}
