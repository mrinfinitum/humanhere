export type GlobeMockPortrait = "james" | "maya" | "lena" | "miguel" | "table" | "avery" | "elena" | "jonah" | "ren" | "mara";

export type GlobeMockStory = {
  name: string;
  location: string;
  lat: number;
  lng: number;
  quote: string;
  loveCount: number;
  headline: string;
  sectionHeading: string;
  paragraphs: [string, string];
  closingNote: string;
  portrait: GlobeMockPortrait;
};

/**
 * Fictional first-person fixtures for interaction and art-direction testing.
 * They simulate what someone might choose to post after signing in, but do not
 * represent actual people or accounts and never enter Supabase.
 */
export const GLOBE_MOCK_STORIES: GlobeMockStory[] = [
  {
    name: "James", location: "Tulsa, Oklahoma", lat: 36.154, lng: -95.993, loveCount: 327,
    headline: "I'm trying to keep this bike shop open.", sectionHeading: "Why I'm here",
    quote: "I'm James. I repair bikes in Tulsa and keep the shop open for anyone who needs a place to land.", portrait: "james",
    paragraphs: [
      "I open the side door every Saturday before the coffee is ready. By nine, I usually have three bicycles upside down on their handlebars and someone beside me searching for the right wrench. I started doing this because fixing a bike can give a person a way to work, get home, or simply move again.",
      "I'm here because I want this workshop to stay free and welcoming. I could use inner tubes, basic tools, and one or two people willing to help on Saturday mornings. More than anything, I want people to know my name and understand that this place matters to me.",
    ],
    closingNote: "I don't need to be rescued. I would like some help keeping the door open.",
  },
  {
    name: "Avery", location: "Los Angeles, California", lat: 34.052, lng: -118.244, loveCount: 84,
    headline: "I'm growing food with my neighbors.", sectionHeading: "What would help",
    quote: "I'm Avery. I help run a community garden in Los Angeles where neighbors share food, tools, and time.", portrait: "avery",
    paragraphs: [
      "I carry a ring of mismatched keys for our garden gates. I know which key opens the tool shed and which bent brass key opens the side entrance. On Sundays, I spend most of the afternoon helping people find gloves, seedlings, and a place to begin.",
      "I'm posting because our watering hoses are splitting and several raised beds need fresh soil. I would love to meet nearby people who can donate supplies or work beside me for an hour. I want this garden to remain a place where I know my neighbors and my neighbors know me.",
    ],
    closingNote: "I can provide the keys and the work. I need a few more hands.",
  },
  {
    name: "Noah", location: "New York, New York", lat: 40.713, lng: -74.006, loveCount: 146,
    headline: "I drive the last bus home.", sectionHeading: "What I notice at night",
    quote: "I'm Noah. I drive a late-night bus route in New York and try to make the ride home feel a little less anonymous.", portrait: "miguel",
    paragraphs: [
      "I work the late route, when the city gets quieter but never completely still. I recognize the grocery bags, the hospital uniforms, and the person running toward my stop with one hand raised. When I can, I wait ten extra seconds and lower the step before anyone has to ask.",
      "I'm not asking for anything complicated. I want the people on my route to know that I see them, and I want someone to see me too. If you ride late, say hello. If you work nights, tell me what would make the trip home feel safer and more human.",
    ],
    closingNote: "I want my route to feel like more than a line on a map.",
  },
  {
    name: "Elena", location: "Mexico City, Mexico", lat: 19.433, lng: -99.133, loveCount: 59,
    headline: "I'm baking before the city wakes up.", sectionHeading: "What I'm trying to protect",
    quote: "I'm Elena. I bake bread before sunrise in Mexico City and save the first loaf for a neighbor.", portrait: "elena",
    paragraphs: [
      "I arrive while the street is still blue with morning. I measure flour, line up the trays, and save one small loaf for the building porter next door. My bakery is narrow, so most conversations happen shoulder to shoulder while my hands keep moving.",
      "I'm here because my mixer is failing and replacing it is more than I can manage this month. I am looking for a used commercial mixer, a repair recommendation, or someone who understands this equipment. I want to keep baking for the people who have made room for me here.",
    ],
    closingNote: "I have bread to share. Right now, I need help keeping the kitchen moving.",
  },
  {
    name: "Micah", location: "São Paulo, Brazil", lat: -23.555, lng: -46.633, loveCount: 211,
    headline: "I want my chair to stay available.", sectionHeading: "Why I'm speaking up",
    quote: "My name is Micah. I cut hair in São Paulo and keep the window open for anyone who needs to talk.", portrait: "lena",
    paragraphs: [
      "I cut hair in a second-floor room above a hardware store. I keep the radio low, the window open, and enough time between appointments that nobody feels rushed out of my chair. Some days I talk. Some days I listen. I have learned to respect the difference.",
      "I'm posting because my rent increased and I may lose this room. I am looking for an affordable chair-share or a small workspace near my neighborhood. I have clients, my tools, and years of work invested here. I need someone to notice before the door closes.",
    ],
    closingNote: "I am ready to work. I need a room where I can keep showing up.",
  },
  {
    name: "Nadia", location: "Buenos Aires, Argentina", lat: -34.604, lng: -58.382, loveCount: 43,
    headline: "I'm making room for people to move.", sectionHeading: "What my class needs",
    quote: "I'm Nadia. I teach a Thursday-night movement class in Buenos Aires where nobody has to arrive knowing the steps.", portrait: "maya",
    paragraphs: [
      "I teach in the small room behind my building's laundry. I removed the mirrors because I want everyone to learn by watching one another instead of judging a reflection. I know every name, and I remember which song helped each person stay through a first class.",
      "I'm here because we have outgrown the six chairs I borrow from the caretaker. I need folding chairs, a portable speaker, and help covering the room fee for three months. I want to keep the class open to people who cannot pay but still need somewhere to belong.",
    ],
    closingNote: "I can teach the class. I need help making the room ready.",
  },
  {
    name: "Theo", location: "London, United Kingdom", lat: 51.507, lng: -0.128, loveCount: 132,
    headline: "I'm helping people face difficult paperwork.", sectionHeading: "What I need at the desk",
    quote: "I'm Theo. I volunteer at an evening advice desk in London and help people make sense of difficult forms.", portrait: "james",
    paragraphs: [
      "I sit at a table above the library with spare pens in one drawer and biscuits in another. I cannot solve every problem that reaches me, but I can slow the room down, translate the next step into ordinary language, and make sure nobody faces a form alone.",
      "I'm posting because I need volunteer interpreters and a reliable printer. I especially need help in the early evening, when people arrive after work and the queue grows. I want this desk to remain patient, private, and free.",
    ],
    closingNote: "I know the forms. I need people who know more languages than I do.",
  },
  {
    name: "June", location: "Paris, France", lat: 48.857, lng: 2.352, loveCount: 91,
    headline: "I'm giving yesterday's flowers another day.", sectionHeading: "What would keep this going",
    quote: "I'm June. I rescue leftover flowers from a Paris market and leave small arrangements at neighbors' doors.", portrait: "mara",
    paragraphs: [
      "I walk through the market before closing and ask which flowers will not survive another day. At home, I trim the bruised leaves and arrange the remaining stems in donated jars. Then I carry them to people who could use an unexpected knock at the door.",
      "I'm here because I need clean jars, a sturdy bicycle basket, and one person willing to help with deliveries twice a month. I do not want this small ritual to disappear simply because I cannot carry everything by myself.",
    ],
    closingNote: "I have the flowers. I need help getting them to the next door.",
  },
  {
    name: "Amara", location: "Berlin, Germany", lat: 52.52, lng: 13.405, loveCount: 118,
    headline: "I'm teaching people to repair what they own.", sectionHeading: "What I'm looking for",
    quote: "I'm Amara. I repair old radios in Berlin and teach free workshops so other people can learn how too.", portrait: "ren",
    paragraphs: [
      "I learned radio repair at my grandfather's table. Now I set up once a month in a neighborhood swap shop with cracked dials, loose wires, and the stories attached to them. I open every casing carefully and explain what I find instead of treating the object as disposable.",
      "I'm posting because my soldering iron is failing and my supply of basic components is almost gone. I need a safe replacement iron, spare wire, and small hand tools. I want to keep the workshop free so curiosity does not depend on income.",
    ],
    closingNote: "I can share what I know. I need the tools to keep teaching.",
  },
  {
    name: "Jonah", location: "Lagos, Nigeria", lat: 6.524, lng: 3.379, loveCount: 76,
    headline: "I'm keeping the rehearsal room open.", sectionHeading: "What the room needs",
    quote: "I'm Jonah. I open a rehearsal room in Lagos where young musicians can practice without paying for studio time.", portrait: "jonah",
    paragraphs: [
      "I unlock the room every Wednesday even when nobody has booked it. Someone almost always arrives with a rhythm, half a chorus, or simply a need to sit near the sound. I care more about giving an unfinished idea somewhere to live than producing a perfect performance.",
      "I'm here because the room needs acoustic panels and a working drum stool. I can install donated materials myself, and I would welcome anyone who knows safe soundproofing. I want young musicians to be heard before they can afford to be heard.",
    ],
    closingNote: "I have the room and the time. I need help making the space usable.",
  },
  {
    name: "Mae", location: "Nairobi, Kenya", lat: -1.286, lng: 36.818, loveCount: 64,
    headline: "I'm carrying a library in two crates.", sectionHeading: "What I hope to add",
    quote: "I'm Mae. I bring a mobile library to neighborhoods around Nairobi and let every reader keep one book.", portrait: "lena",
    paragraphs: [
      "I carry blue crates between two apartment courtyards and record borrowed books in a notebook filled with first names. I never charge a late fee. I want a child to choose quickly and an adult to take as long as needed to ask for the book they actually want.",
      "I'm posting because my crates are cracking and rain has damaged several books. I need weatherproof boxes and books in good condition for children, new readers, and adults learning practical skills. I want this tiny library to keep traveling.",
    ],
    closingNote: "I can carry the books. I need stronger boxes and more stories to share.",
  },
  {
    name: "Elias", location: "Cape Town, South Africa", lat: -33.925, lng: 18.424, loveCount: 153,
    headline: "I'm showing up at the same bench.", sectionHeading: "Why I'm posting",
    quote: "I'm Elias. I meet people for Saturday walks along the Cape Town waterfront, especially when they need company.", portrait: "miguel",
    paragraphs: [
      "I start at the same waterfront bench every Saturday. I do not bring an agenda. I can talk about work, watch the water in silence, or walk slowly enough for a difficult sentence to find its way out. Consistency is the only promise I know how to make.",
      "I'm here because I want anyone feeling isolated nearby to know there is a real person waiting. I would also like another volunteer to join me so the walk can continue when I am unavailable. I am not a counselor. I am a neighbor willing to be present.",
    ],
    closingNote: "I will be at the bench. I hope someone who needs company sees this.",
  },
  {
    name: "Iris", location: "Cairo, Egypt", lat: 30.044, lng: 31.236, loveCount: 37,
    headline: "I'm repairing the books people kept.", sectionHeading: "What my hands need",
    quote: "I'm Iris. I repair worn books in Cairo and write down the stories people tell me about why they kept them.", portrait: "elena",
    paragraphs: [
      "I work at a long wooden table near the back of a stationery shop. I mix paste in small batches and place clean paper beneath every torn edge. I listen while each owner tells me why this particular book survived moves, weather, and years of use.",
      "I'm posting because I need archival paper, book cloth, and a better cutting mat. I can keep doing the patient work, but my supplies are almost gone. I want to return these books without erasing the evidence that they were loved.",
    ],
    closingNote: "I have steady hands. I need the materials that let a repaired page turn again.",
  },
  {
    name: "Caleb", location: "Mumbai, India", lat: 19.076, lng: 72.878, loveCount: 184,
    headline: "I'm cooking one extra lunch.", sectionHeading: "How I want to continue",
    quote: "I'm Caleb. I pack an extra lunch each morning in Mumbai because someone at work usually needs one.", portrait: "jonah",
    paragraphs: [
      "I cook one additional portion every weekday without deciding who it is for. By noon, I usually meet a colleague working through lunch, a neighbor home sick, or a delivery rider waiting under the awning to escape the rain. I pass over the steel container without making it a conversation.",
      "I'm here because I want to prepare ten extra lunches each Friday, but I cannot cover the containers and ingredients alone. I need reusable containers, rice, lentils, and one nearby kitchen partner. I want the meals to stay simple and dignified.",
    ],
    closingNote: "I can cook. I need help turning one extra portion into ten.",
  },
  {
    name: "Sofia", location: "Delhi, India", lat: 28.614, lng: 77.209, loveCount: 102,
    headline: "I'm building shade on our roof.", sectionHeading: "What the garden needs",
    quote: "I'm Sofia. I help tend a rooftop garden in Delhi where our building shares herbs, shade, and conversation.", portrait: "mara",
    paragraphs: [
      "I go to the roof after the hottest part of the day. I water the herbs, unfold two chairs, and pour tea from a thermos. This small routine has helped me learn the names of people I used to pass silently on the stairs.",
      "I'm posting because the summer sun is burning the plants and the roof has almost no shade. I need shade cloth, secure fasteners, and two large watering cans. I can care for the garden if I can protect it through the next hot season.",
    ],
    closingNote: "I have a roof and a plan. I need help creating enough shade for both plants and people.",
  },
  {
    name: "Rowan", location: "Bangkok, Thailand", lat: 13.756, lng: 100.502, loveCount: 69,
    headline: "I'm keeping one café table free.", sectionHeading: "Why this table matters",
    quote: "I'm Rowan. I run a small café table in Bangkok where anyone can sit quietly without being asked to order again.", portrait: "avery",
    paragraphs: [
      "I keep one table at the back unreserved. I bring water, keep the music low, and check in without hovering. I made this rule because I know what it feels like when conversation is impossible but being alone feels worse.",
      "I'm here because keeping the table free has a real cost for my small café. I am looking for a local partner willing to cover a few drinks each week. I want people to receive welcome without having to explain why they need it.",
    ],
    closingNote: "I can keep the seat open. I need help covering what the table cannot earn.",
  },
  {
    name: "Mina", location: "Manila, Philippines", lat: 14.6, lng: 120.984, loveCount: 125,
    headline: "I'm writing the note someone needs tonight.", sectionHeading: "What I want to send",
    quote: "I'm Mina. I leave handwritten notes inside lunch bags for hospital staff working overnight in Manila.", portrait: "maya",
    paragraphs: [
      "I write short messages while I pack food for night-shift hospital staff. I write what I would want to read after a hard hour: I noticed your patience. Please eat. Come home safely. I fold each note once and place it where it will be found privately.",
      "I'm posting because I want to prepare fifty bags next month. I need paper lunch bags, pens, simple snacks, and a few people willing to write sincere notes with me. I want every message to feel personal, not mass-produced.",
    ],
    closingNote: "I will pack the first bags. I hope someone will sit beside me and write.",
  },
  {
    name: "Ren", location: "Tokyo, Japan", lat: 35.677, lng: 139.65, loveCount: 198,
    headline: "I'm bringing broken lamps back to light.", sectionHeading: "What would help my bench",
    quote: "I'm Ren. I repair household lamps in Tokyo and still love the moment a dark room lights up again.", portrait: "ren",
    paragraphs: [
      "I work at a shared bench overlooking a narrow courtyard. I test every switch twice and keep the old parts long enough to understand what failed. I never get tired of the moment a repaired lamp lights the room again.",
      "I'm here because my task light and wire strippers both need replacing. I am looking for reliable used tools or a repair shop willing to share bench time. I want to keep offering low-cost repairs instead of telling people to replace what they already value.",
    ],
    closingNote: "I know how to trace the fault. I need a safer light and tools I can trust.",
  },
  {
    name: "Hana", location: "Seoul, South Korea", lat: 37.566, lng: 126.978, loveCount: 87,
    headline: "I'm teaching after everyone leaves work.", sectionHeading: "What my class needs",
    quote: "I'm Hana. I teach an evening language class in Seoul for adults coming straight from work.", portrait: "lena",
    paragraphs: [
      "I begin class at nine because that is when everyone can arrive. I repeat a phrase without embarrassment, let the room laugh when we need to, and make space for a question to be skipped when it feels too heavy. I keep every student's first confident sentence in a folder labeled beginnings.",
      "I'm posting because I need current workbooks and transit cards for three students who are struggling to attend. I can provide the teaching and the room. I need help removing the small costs that are keeping people away.",
    ],
    closingNote: "I am ready to teach. I need help getting everyone through the door.",
  },
  {
    name: "Sam", location: "Singapore", lat: 1.352, lng: 103.82, loveCount: 51,
    headline: "I'm saving one chair at breakfast.", sectionHeading: "Why I'm here",
    quote: "I'm Sam. I share a breakfast table in Singapore where the regulars always keep one chair open.", portrait: "table",
    paragraphs: [
      "I eat at the same corner table three mornings a week. I began moving my bag when I noticed someone looking for a seat. Over time, that small gesture became a group of regulars who know my order, notice when I am missing, and keep one chair open.",
      "I'm posting because I want someone nearby who eats alone to know there is room. I am not organizing a club or asking for money. I am simply saying where I will be and hoping the person who needs an easy first hello finds this.",
    ],
    closingNote: "I will be at the table Tuesday morning. I will keep the chair beside me free.",
  },
  {
    name: "Lina", location: "Jakarta, Indonesia", lat: -6.208, lng: 106.846, loveCount: 113,
    headline: "I'm mending clothes in company.", sectionHeading: "What I need for the next circle",
    quote: "I'm Lina. I host a monthly mending circle in Jakarta where neighbors repair clothes and learn together.", portrait: "elena",
    paragraphs: [
      "I host the circle even though I am not an expert. I bring the thread I have, help hold fabric steady, and learn beside everyone else. I like the visible stitches because they remind me that something can be imperfect and still worth keeping.",
      "I'm here because our shared sewing kits are missing needles, scissors, and strong thread. I need basic supplies and one experienced person willing to teach simple repairs without taking over. I want the next gathering to stay free.",
    ],
    closingNote: "I can host the room. I need tools and someone patient enough to teach beside me.",
  },
  {
    name: "Mara", location: "Sydney, Australia", lat: -33.869, lng: 151.209, loveCount: 94,
    headline: "I'm turning our walkway into a garden.", sectionHeading: "What I hope to grow",
    quote: "I'm Mara. I grow herbs along my apartment walkway in Sydney and share them with everyone on the floor.", portrait: "mara",
    paragraphs: [
      "I started with one pot of basil outside my door. I added rosemary, then someone left a seedling, and soon I was talking with people I had only nodded to in the lift. I want this concrete walkway to feel like a shared place instead of a corridor between closed doors.",
      "I'm posting because I need lightweight planters, potting soil, and permission help from someone who understands strata rules. I can water and maintain everything. I need help making the next step safe and allowed.",
    ],
    closingNote: "I have the time to care for it. I need planters, soil, and a little guidance.",
  },
  {
    name: "Finn", location: "Auckland, New Zealand", lat: -36.85, lng: 174.764, loveCount: 46,
    headline: "I'm waiting until everyone is ready.", sectionHeading: "What our crew needs",
    quote: "I'm Finn. I help lead a weekend rowing group in Auckland where the boat waits until everyone is ready.", portrait: "miguel",
    paragraphs: [
      "I do not leave the dock until every life jacket fits and every new person knows where to place their hands. Some mornings I cover distance. Other mornings I practice turning, drift for a while, and return early for something warm to drink.",
      "I'm here because two life jackets need replacing and the cost could stop new people from joining. I am looking for correctly rated adult jackets in good condition or support through a verified local partner. I want safety to remain part of the welcome.",
    ],
    closingNote: "I can guide the boat. I need safe equipment for the next person who steps in.",
  },
  {
    name: "Ari", location: "Toronto, Canada", lat: 43.653, lng: -79.383, loveCount: 139,
    headline: "I'm keeping warm coats by the door.", sectionHeading: "What the rack needs",
    quote: "I'm Ari. I keep a free winter-coat rack by the door of a neighborhood studio in Toronto.", portrait: "avery",
    paragraphs: [
      "I keep the rack in the vestibule so nobody has to approach a desk or fill out a form. I sort every clean coat by size and leave the hangers facing outward. I want warmth to be available without requiring anyone to prove they are cold.",
      "I'm posting because the rack is almost empty in adult sizes large through extra-large. I need clean winter coats, strong hangers, and waterproof boots. I can organize and maintain the space if my neighbors help me refill it.",
    ],
    closingNote: "I can keep the exchange dignified. I need warm things to place on the rack.",
  },
  {
    name: "Leah", location: "Vancouver, Canada", lat: 49.283, lng: -123.121, loveCount: 72,
    headline: "I'm looking for someone to walk with.", sectionHeading: "Why I'm saying this out loud",
    quote: "I'm Leah. Every Friday in Vancouver, I walk the seawall with a friend and make room for an honest conversation.", portrait: "jonah",
    paragraphs: [
      "I have learned that I can say difficult things more easily while I am walking. I do not need constant advice. I need a steady pace, enough silence, and someone beside me who does not rush to fix the sentence before I finish it.",
      "I'm here because my regular walking friend is moving away and I do not want to lose the routine that has kept me connected. I am looking for another woman nearby who would like a weekly public walk and an honest conversation.",
    ],
    closingNote: "I am ready to keep walking. I hope the right person notices this.",
  },
];
