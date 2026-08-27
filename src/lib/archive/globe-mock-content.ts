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
 * Fictional editorial fixtures for interaction and art-direction testing.
 * These are deliberately specific enough to exercise real story layouts, but
 * they do not represent actual people or accounts and never enter Supabase.
 */
export const GLOBE_MOCK_STORIES: GlobeMockStory[] = [
  {
    name: "James", location: "Tulsa, Oklahoma", lat: 36.154, lng: -95.993, loveCount: 327,
    headline: "The bikes know where to find him.", sectionHeading: "Saturday mornings",
    quote: "People stopped asking my name.", portrait: "james",
    paragraphs: [
      "James opens the side door of the neighborhood workshop before the coffee is ready. By nine, there are usually three bicycles upside down on their handlebars and somebody searching for the right-sized wrench.",
      "He started repairing bikes because it gave people a reason to stay and talk. Now the workbench has become a meeting place—part repair shop, part front porch, part reminder that being useful and being known can happen at the same time.",
    ],
    closingNote: "Ask my name before you ask what happened.",
  },
  {
    name: "Avery", location: "Los Angeles, California", lat: 34.052, lng: -118.244, loveCount: 84,
    headline: "A garden with no guest list.", sectionHeading: "What grows between neighbors",
    quote: "Someone stayed long enough to listen.", portrait: "avery",
    paragraphs: [
      "Avery keeps a ring of mismatched keys for the community garden gates. The smallest key opens the tool shed; the bent brass one opens a side entrance that most new volunteers miss.",
      "On Sunday afternoons, the garden fills with people trading cuttings, recipes, and whatever news the week has carried. Avery says the vegetables matter, but the real harvest is learning who needs an extra chair pulled close.",
    ],
    closingNote: "Take what you need. Water something before you leave.",
  },
  {
    name: "Noah", location: "New York, New York", lat: 40.713, lng: -74.006, loveCount: 146,
    headline: "The last bus still has regulars.", sectionHeading: "End of the line",
    quote: "The smallest kindness changed the direction of my day.", portrait: "miguel",
    paragraphs: [
      "Noah works the late route, when the city becomes quieter but never entirely still. He notices who always boards with grocery bags, who falls asleep after the hospital stop, and who needs ten more seconds to reach the curb.",
      "There is no announcement for care. Sometimes it is simply waiting with the doors open, lowering the step, or saying good night as though the words are meant for one person in particular.",
    ],
    closingNote: "Nobody should feel invisible on the way home.",
  },
  {
    name: "Elena", location: "Mexico City, Mexico", lat: 19.433, lng: -99.133, loveCount: 59,
    headline: "Before the bakery opens.", sectionHeading: "Bread for the first hour",
    quote: "We made room at the table.", portrait: "elena",
    paragraphs: [
      "Elena arrives while the street is still blue with morning. She measures flour without looking, lines the trays in familiar rows, and saves the first small loaf for the building porter next door.",
      "The bakery is narrow, so conversations happen shoulder to shoulder. People bring change, neighborhood news, and occasionally a problem that needs more than bread. Elena listens while her hands keep moving.",
    ],
    closingNote: "The first loaf belongs to whoever arrives carrying the longest night.",
  },
  {
    name: "Micah", location: "São Paulo, Brazil", lat: -23.555, lng: -46.633, loveCount: 211,
    headline: "A chair by the open window.", sectionHeading: "The hour nobody rushes",
    quote: "Hope looked ordinary that morning.", portrait: "lena",
    paragraphs: [
      "Micah cuts hair in a second-floor room above a hardware store. The radio stays low, the window stays open, and appointments routinely stretch past the time written in the book.",
      "He says people sometimes need to speak while looking at their reflection and sometimes need the opposite. His job is to recognize the difference—and to send everyone back downstairs standing a little taller.",
    ],
    closingNote: "You can sit here without explaining anything.",
  },
  {
    name: "Nadia", location: "Buenos Aires, Argentina", lat: -34.604, lng: -58.382, loveCount: 43,
    headline: "Music through the apartment floor.", sectionHeading: "Thursday at seven",
    quote: "A name can be the beginning of being seen.", portrait: "maya",
    paragraphs: [
      "Nadia teaches a small movement class in the room behind her building's laundry. There are no mirrors. Newcomers learn the steps by watching one another and laughing when everyone turns the wrong way.",
      "The class began with four people and now the caretaker moves the chairs before they arrive. Nadia knows each person by name and remembers which song made them stay the first time.",
    ],
    closingNote: "Come late. Come tired. Just come as yourself.",
  },
  {
    name: "Theo", location: "London, United Kingdom", lat: 51.507, lng: -0.128, loveCount: 132,
    headline: "The kettle is part of the work.", sectionHeading: "A room above the library",
    quote: "The door was open, so I walked through it.", portrait: "james",
    paragraphs: [
      "Theo volunteers at an evening advice desk where the forms are complicated and the tea is strong. He keeps spare pens in one drawer and biscuits in another, because both run out at exactly the wrong moment.",
      "He cannot solve every problem that reaches the table. What he can do is slow the room down, translate the next step into ordinary language, and make sure nobody has to face the paperwork alone.",
    ],
    closingNote: "Start with tea. Then find the next possible step.",
  },
  {
    name: "June", location: "Paris, France", lat: 48.857, lng: 2.352, loveCount: 91,
    headline: "A second life for old flowers.", sectionHeading: "After the market closes",
    quote: "Care begins when attention becomes action.", portrait: "mara",
    paragraphs: [
      "June walks the market just before closing and asks vendors which stems will not survive another day. Back home, she trims the bruised leaves and makes small arrangements for neighbors who could use an unexpected knock.",
      "Nothing about the ritual is grand. A jar, a short walk, five minutes at a doorway. June likes that the flowers arrive without requiring anyone to explain why they needed them.",
    ],
    closingNote: "Beauty does not have to be new to be given.",
  },
  {
    name: "Amara", location: "Berlin, Germany", lat: 52.52, lng: 13.405, loveCount: 118,
    headline: "The radio repair table.", sectionHeading: "Signals returned",
    quote: "There is more to every person than the hardest day.", portrait: "ren",
    paragraphs: [
      "Amara learned to repair radios from her grandfather and now runs a monthly table at the neighborhood swap shop. People arrive with cracked dials, loose wires, and stories about the kitchens where the radios once lived.",
      "Some devices cannot be saved. Even then, Amara opens the casing carefully and shows the owner what failed. She believes understanding a broken thing is different from throwing it away.",
    ],
    closingNote: "Listen closely. Some signals are only faint, not gone.",
  },
  {
    name: "Jonah", location: "Lagos, Nigeria", lat: 6.524, lng: 3.379, loveCount: 76,
    headline: "One more song before everyone leaves.", sectionHeading: "The rehearsal room",
    quote: "I remembered I did not have to carry it alone.", portrait: "jonah",
    paragraphs: [
      "Jonah keeps the rehearsal room open on Wednesday nights even when nobody has booked it. Someone almost always arrives: a drummer without a kit, a singer with half a chorus, a friend who only came to sit near the sound.",
      "The best nights are not the polished ones. They are the nights when a rough idea becomes something the whole room can hold, and everybody walks out humming the same unfinished line.",
    ],
    closingNote: "Bring the part you have. We can build around it.",
  },
  {
    name: "Mae", location: "Nairobi, Kenya", lat: -1.286, lng: 36.818, loveCount: 64,
    headline: "The books that travel home.", sectionHeading: "A library in two crates",
    quote: "Being seen can change the shape of a day.", portrait: "lena",
    paragraphs: [
      "Mae carries a small lending library between two apartment courtyards. The books fit into blue crates, and the borrowing system is a notebook filled with first names and penciled promises.",
      "Children choose quickly. Adults pretend to browse before asking for what they really want: a story that feels familiar, a manual that teaches something useful, or a quiet reason to sit for a while.",
    ],
    closingNote: "Return the book when you are ready—not before.",
  },
  {
    name: "Elias", location: "Cape Town, South Africa", lat: -33.925, lng: 18.424, loveCount: 153,
    headline: "The bench facing the water.", sectionHeading: "A regular place to begin",
    quote: "Showing up is a small act until you need someone.", portrait: "miguel",
    paragraphs: [
      "Elias meets two friends at the same waterfront bench every Tuesday. There is no agenda. Sometimes they talk about work; sometimes they watch gulls argue over a paper bag and say almost nothing.",
      "The ritual survived schedule changes, long winters, and one year when nobody felt especially talkative. Elias says consistency can be its own kind of language: I expected you. I came anyway.",
    ],
    closingNote: "Same bench. Same time. No performance required.",
  },
  {
    name: "Iris", location: "Cairo, Egypt", lat: 30.044, lng: 31.236, loveCount: 37,
    headline: "Pages repaired by hand.", sectionHeading: "The patient work",
    quote: "I found courage in an ordinary conversation.", portrait: "elena",
    paragraphs: [
      "Iris restores damaged books at a long wooden table near the back of a family stationery shop. She mixes paste in tiny batches and places clean paper beneath every torn edge.",
      "Customers often stay to watch. The work is slow enough to make room for conversation, and Iris has learned that people speak differently when their hands and eyes are occupied by something careful.",
    ],
    closingNote: "A repaired page still carries the tear. It also turns again.",
  },
  {
    name: "Caleb", location: "Mumbai, India", lat: 19.076, lng: 72.878, loveCount: 184,
    headline: "Lunch arrives in steel containers.", sectionHeading: "An extra portion",
    quote: "Someone remembered what I said.", portrait: "jonah",
    paragraphs: [
      "Caleb cooks one additional portion every weekday. He does not decide in advance who it is for. By noon, a colleague is working through lunch, a neighbor is home sick, or a delivery rider has stopped beneath the awning to escape the rain.",
      "The container always comes back washed. Sometimes it returns with fruit, sometimes with a note, and sometimes with nothing at all. Caleb says the empty container is enough—it means the meal reached somebody.",
    ],
    closingNote: "Make one more than you think you need.",
  },
  {
    name: "Sofia", location: "Delhi, India", lat: 28.614, lng: 77.209, loveCount: 102,
    headline: "A rooftop after sunset.", sectionHeading: "The cooler hour",
    quote: "We were strangers until someone said hello.", portrait: "mara",
    paragraphs: [
      "Sofia's building comes alive on the roof after the heat breaks. Laundry is folded, homework is finished, and people who passed silently on the stairs finally learn one another's names.",
      "She started bringing a thermos of tea and a second cup. The gathering grew from there—not through invitations, but through the simple visibility of two chairs facing the evening sky.",
    ],
    closingNote: "Leave one chair open for the person who has not come up yet.",
  },
  {
    name: "Rowan", location: "Bangkok, Thailand", lat: 13.756, lng: 100.502, loveCount: 69,
    headline: "The quiet table at the back.", sectionHeading: "A place without questions",
    quote: "I learned that asking for help is also an act of hope.", portrait: "avery",
    paragraphs: [
      "Rowan helps run a small café with one table that is never reserved. Regulars know it as the quiet table: a place to sit when conversation feels impossible but being alone feels worse.",
      "Nobody explains the rule. Water appears, the music stays low, and staff check in without hovering. Rowan says hospitality begins by noticing what kind of welcome a person can receive that day.",
    ],
    closingNote: "You do not have to be cheerful to be welcome here.",
  },
  {
    name: "Mina", location: "Manila, Philippines", lat: 14.6, lng: 120.984, loveCount: 125,
    headline: "Messages folded into lunch bags.", sectionHeading: "Before the school bell",
    quote: "The light stayed on for me.", portrait: "maya",
    paragraphs: [
      "Mina writes short notes while packing lunches for the children in her extended family. Most are practical reminders—umbrella, keys, call me—but every few days she writes something that has nothing to do with logistics.",
      "You did a hard thing. I noticed your patience. Come home when you can. The notes are rarely mentioned, yet the empty paper squares keep turning up pressed inside notebooks and phone cases.",
    ],
    closingNote: "Write down the thing you assume they already know.",
  },
  {
    name: "Ren", location: "Tokyo, Japan", lat: 35.677, lng: 139.65, loveCount: 198,
    headline: "Nothing is only broken.", sectionHeading: "The repair shelf",
    quote: "Quiet attention can still be love.", portrait: "ren",
    paragraphs: [
      "Ren repairs household lamps in a shared workshop overlooking a narrow courtyard. Each object arrives with a small history: a moving-day accident, a cord chewed by a puppy, a shade carried from another home.",
      "He tests every switch twice before calling the owner. The moment a dark lamp returns to light never becomes routine; it is small, practical proof that care can travel through wires, hands, and time.",
    ],
    closingNote: "Before replacing something, learn how it was held together.",
  },
  {
    name: "Hana", location: "Seoul, South Korea", lat: 37.566, lng: 126.978, loveCount: 87,
    headline: "The classroom after work.", sectionHeading: "Learning at nine o'clock",
    quote: "I was met as a person, not a problem.", portrait: "lena",
    paragraphs: [
      "Hana teaches an evening language class to adults whose days begin long before the lesson. She knows when to repeat a phrase, when to let the room laugh, and when to quietly move on from a question that landed too heavily.",
      "At the end of each term, students bring food from home and write one sentence they can now say with confidence. Hana keeps copies in a folder labeled beginnings.",
    ],
    closingNote: "Progress can sound like one new sentence spoken without fear.",
  },
  {
    name: "Sam", location: "Singapore", lat: 1.352, lng: 103.82, loveCount: 51,
    headline: "The table beside the fan.", sectionHeading: "Breakfast regulars",
    quote: "Belonging began with one empty chair.", portrait: "table",
    paragraphs: [
      "Sam eats breakfast at the same corner table three mornings a week. Over time, separate regulars became a loose group: the retired teacher, the night-shift nurse, the student who always orders tea last.",
      "Nobody formed a club. They simply began saving seats. Sam says belonging often arrives without ceremony, in the moment someone looks up and moves their bag before you ask.",
    ],
    closingNote: "An empty chair can be an invitation if someone notices it.",
  },
  {
    name: "Lina", location: "Jakarta, Indonesia", lat: -6.208, lng: 106.846, loveCount: 113,
    headline: "Clothes repaired in company.", sectionHeading: "The mending circle",
    quote: "We kept choosing one another.", portrait: "elena",
    paragraphs: [
      "Lina hosts a monthly mending circle where nobody is especially expert. People bring torn pockets, loose buttons, and the shirts they have been meaning to fix for a year.",
      "The repairs are sometimes uneven. That is part of the appeal. Each visible stitch records an evening when someone shared thread, held fabric steady, or stayed until the last sleeve was finished.",
    ],
    closingNote: "A visible repair can be evidence that something was worth keeping.",
  },
  {
    name: "Mara", location: "Sydney, Australia", lat: -33.869, lng: 151.209, loveCount: 94,
    headline: "The courtyard keeps its own time.", sectionHeading: "Between the apartments",
    quote: "The distance felt smaller after we spoke.", portrait: "mara",
    paragraphs: [
      "Mara grows herbs in mismatched pots along the shared walkway of her apartment building. Neighbors began asking for rosemary, then leaving seedlings, then stopping long enough to exchange more than ingredients.",
      "The courtyard is still mostly concrete. But at dusk, when doors open and someone waters the basil, it feels like a small commons built from ordinary repetition.",
    ],
    closingNote: "Start with one pot where everybody passes.",
  },
  {
    name: "Finn", location: "Auckland, New Zealand", lat: -36.85, lng: 174.764, loveCount: 46,
    headline: "The boat leaves when everyone is ready.", sectionHeading: "Early water",
    quote: "Someone showed up before I knew how to ask.", portrait: "miguel",
    paragraphs: [
      "Finn helps with a weekend rowing group that measures success differently. The boat does not leave the dock until every life jacket is fitted and every new person knows where to place their hands.",
      "Some mornings they cover distance. Other mornings they drift, practice turning, and return early for hot drinks. Finn says the point is not speed—it is learning how a group moves when nobody is left behind.",
    ],
    closingNote: "A crew is only together if it adjusts to the slowest oar.",
  },
  {
    name: "Ari", location: "Toronto, Canada", lat: 43.653, lng: -79.383, loveCount: 139,
    headline: "Coats waiting by the door.", sectionHeading: "The first cold week",
    quote: "There was room for the honest answer.", portrait: "avery",
    paragraphs: [
      "Ari keeps a clothing rack in the vestibule of a neighborhood studio. In winter, clean coats appear without announcement, organized by size but never by who donated them.",
      "Anyone can take one. Anyone can add one. The arrangement is intentionally ordinary: no desk, no application, no moment when a person has to prove they are cold.",
    ],
    closingNote: "Warmth should not require an explanation.",
  },
  {
    name: "Leah", location: "Vancouver, Canada", lat: 49.283, lng: -123.121, loveCount: 72,
    headline: "A walk measured in conversations.", sectionHeading: "The long way around",
    quote: "For a moment, I knew I was not alone.", portrait: "jonah",
    paragraphs: [
      "Leah meets a friend at the seawall every Friday, regardless of weather. They walk slowly enough that cyclists ring their bells and fast enough that difficult sentences eventually find their way out.",
      "There are weeks when one person does nearly all the talking. The balance returns over time. Leah trusts the route because it asks only that they keep moving beside each other.",
    ],
    closingNote: "You can tell the story in pieces. I will keep walking.",
  },
];
