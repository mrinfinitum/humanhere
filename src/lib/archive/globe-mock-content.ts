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
    headline: "I'm tired of pretending I'm not lonely.", sectionHeading: "What I need tonight",
    quote: "I'm James from Tulsa. I could use a little encouragement tonight.", portrait: "james",
    paragraphs: [
      "I spend most days talking with customers at my bike shop, but the room gets painfully quiet after I lock the door. I have gotten good at telling everyone that I am fine, even when I go home wishing somebody would ask twice.",
      "I'm here because I do not want to keep carrying that feeling by myself. I would appreciate a note, a prayer, or honest advice from anyone who has learned how to build a life that does not feel so isolated.",
    ],
    closingNote: "I do not need a perfect answer. I just want to know someone heard me.",
  },
  {
    name: "Avery", location: "Los Angeles, California", lat: 34.052, lng: -118.244, loveCount: 84,
    headline: "I'm new here and having a hard time finding my people.", sectionHeading: "Why I'm reaching out",
    quote: "I'm Avery from Los Angeles. I feel invisible in a city full of people.", portrait: "avery",
    paragraphs: [
      "I moved to Los Angeles six months ago for work and thought friendship would happen naturally. I know plenty of names now, but I still eat most dinners alone and spend weekends wondering whether anyone would notice if I stayed home.",
      "I'm posting because I need courage to keep reaching out without feeling embarrassed. I would love advice from someone who has started over in a new city, or a simple note reminding me that belonging can take time.",
    ],
    closingNote: "I am trying not to give up on finding real friendship here.",
  },
  {
    name: "Noah", location: "New York, New York", lat: 40.713, lng: -74.006, loveCount: 146,
    headline: "I'm awake when everyone I know is sleeping.", sectionHeading: "What nights feel like",
    quote: "I'm Noah from New York. Working nights has made my world feel very small.", portrait: "miguel",
    paragraphs: [
      "I drive a late bus route and sleep while most of my friends are living their day. I see hundreds of faces, but I rarely have a conversation that lasts longer than one stop, and the loneliness follows me home after sunrise.",
      "I'm asking for advice from anyone who has made night work feel less isolating. I would also welcome a prayer for rest, because my mind stays loud even after I close the curtains and turn off my phone.",
    ],
    closingNote: "I want to feel connected to a life beyond my route again.",
  },
  {
    name: "Elena", location: "Mexico City, Mexico", lat: 19.433, lng: -99.133, loveCount: 59,
    headline: "I'm caring for my mother and I feel overwhelmed.", sectionHeading: "What I cannot say at home",
    quote: "I'm Elena from Mexico City. I love my family, but I am running out of strength.", portrait: "elena",
    paragraphs: [
      "I care for my mother before work and again when I come home. I am grateful for every day together, but I feel guilty admitting how exhausted and frightened I have become, so I keep smiling and say I can handle it.",
      "I'm here because I need prayer for patience and enough rest to keep going. I would be grateful for a note from another caregiver who understands how love and exhaustion can exist in the same heart.",
    ],
    closingNote: "I need permission to be tired without believing that I have failed.",
  },
  {
    name: "Micah", location: "São Paulo, Brazil", lat: -23.555, lng: -46.633, loveCount: 211,
    headline: "I'm afraid one setback will undo everything.", sectionHeading: "What I need help believing",
    quote: "My name is Micah. I live in São Paulo and I am scared about what comes next.", portrait: "lena",
    paragraphs: [
      "I have worked hard to build a steady life, but a rent increase and a slow month have made everything feel fragile. I wake up calculating numbers and go to bed wondering whether one bad week can erase years of effort.",
      "I'm posting because fear is making every decision feel impossible. I need practical advice about taking the next step, and I would appreciate encouragement from someone who has rebuilt after losing stability.",
    ],
    closingNote: "I want to believe that asking for guidance is a form of courage.",
  },
  {
    name: "Nadia", location: "Buenos Aires, Argentina", lat: -34.604, lng: -58.382, loveCount: 43,
    headline: "I'm grieving and I do not know how to move forward.", sectionHeading: "Why I am saying this here",
    quote: "I'm Nadia from Buenos Aires. Grief has made ordinary days feel unfamiliar.", portrait: "maya",
    paragraphs: [
      "I lost someone important to me this year, and I still reach for my phone before remembering there will be no answer. I can complete the tasks in front of me, but I do not recognize the quiet person I have become.",
      "I'm here because I need to hear from people who have survived a season like this. I am not looking for a way around grief; I need advice for carrying it without disappearing from everyone I love.",
    ],
    closingNote: "I would be grateful for a few words from someone further down this road.",
  },
  {
    name: "Theo", location: "London, United Kingdom", lat: 51.507, lng: -0.128, loveCount: 132,
    headline: "I'm doubting whether the work I do matters.", sectionHeading: "What has been weighing on me",
    quote: "I'm Theo from London. I could use encouragement to keep showing up.", portrait: "james",
    paragraphs: [
      "I spend my evenings helping people make sense of difficult forms, and lately every unfinished problem comes home with me. I know I cannot fix every situation, but knowing that has started to feel more like failure than humility.",
      "I'm asking for perspective from anyone who works in service and has learned where responsibility should end. I need a reminder that small help can still matter even when the larger problem remains.",
    ],
    closingNote: "I want to keep caring without being crushed by everything I cannot change.",
  },
  {
    name: "June", location: "Paris, France", lat: 48.857, lng: 2.352, loveCount: 91,
    headline: "I'm learning how to live alone after twenty years.", sectionHeading: "What evenings feel like now",
    quote: "I'm June from Paris. My home became quiet very suddenly.", portrait: "mara",
    paragraphs: [
      "I recently began living alone after sharing everyday life for two decades. I can manage the practical parts, but dinner and Sunday mornings still feel like rooms that are much larger than they used to be.",
      "I'm here because I need advice about becoming a whole person again instead of waiting for my old life to return. I would welcome a kind note from anyone who has learned to enjoy company without fearing solitude.",
    ],
    closingNote: "I am trying to believe that a different life can still be a meaningful one.",
  },
  {
    name: "Amara", location: "Berlin, Germany", lat: 52.52, lng: 13.405, loveCount: 118,
    headline: "I'm starting over and my confidence is gone.", sectionHeading: "What I am afraid to admit",
    quote: "I'm Amara from Berlin. I need help believing I still have something to offer.", portrait: "ren",
    paragraphs: [
      "I left a job that had become unhealthy, but now I question whether I was brave or simply foolish. I open applications, reread every sentence, and close the page because the confident version of me feels very far away.",
      "I'm asking for advice from anyone who has rebuilt confidence after a difficult workplace. I need encouragement to take one honest next step without requiring myself to know the entire path.",
    ],
    closingNote: "I am ready to begin again, but I do not want to begin alone.",
  },
  {
    name: "Jonah", location: "Lagos, Nigeria", lat: 6.524, lng: 3.379, loveCount: 76,
    headline: "I'm asking for prayer because the music has stopped.", sectionHeading: "What I hope returns",
    quote: "I'm Jonah from Lagos. I have not felt like myself for a while.", portrait: "jonah",
    paragraphs: [
      "I used to reach for music whenever life became difficult, but lately I sit beside my instrument and feel nothing. I am still going to work and answering messages, yet the part of me that made songs feels closed behind a door.",
      "I'm here to ask for prayer and patience while I find my way back. I would appreciate hearing from anyone who lost joy for a season and discovered that it was not gone forever.",
    ],
    closingNote: "I am hoping this quiet season is not the end of my voice.",
  },
  {
    name: "Mae", location: "Nairobi, Kenya", lat: -1.286, lng: 36.818, loveCount: 64,
    headline: "I'm scared I am not good enough for the future I want.", sectionHeading: "What I need to hear",
    quote: "I'm Mae from Nairobi. I am studying hard and still feel afraid.", portrait: "lena",
    paragraphs: [
      "I am preparing for exams that could change what becomes possible for me, and the pressure has started following me into every part of the day. I study until I cannot focus, then feel guilty whenever I rest.",
      "I'm posting because I need advice about working hard without measuring my worth by one result. I would be grateful for a note or prayer that reminds me my future is larger than a score.",
    ],
    closingNote: "I want to do my best without being afraid of myself every morning.",
  },
  {
    name: "Elias", location: "Cape Town, South Africa", lat: -33.925, lng: 18.424, loveCount: 153,
    headline: "I'm asking for someone to walk beside me.", sectionHeading: "Why company matters right now",
    quote: "I'm Elias from Cape Town. I have been spending too much time alone.", portrait: "miguel",
    paragraphs: [
      "I have been withdrawing from people because explaining how I feel takes more energy than staying quiet. I know the isolation is making everything heavier, but sending the first message has started to feel like an impossible task.",
      "I'm here because I could use a walking companion in a public place and a conversation with no pressure to perform. I am not asking anyone to fix me; I am asking for an hour of ordinary human company.",
    ],
    closingNote: "I am ready to leave the house if someone is willing to meet me halfway.",
  },
  {
    name: "Iris", location: "Cairo, Egypt", lat: 30.044, lng: 31.236, loveCount: 37,
    headline: "I'm anxious all the time and I need prayer.", sectionHeading: "What my mind has been doing",
    quote: "I'm Iris from Cairo. I need a quiet moment and someone to pray for me.", portrait: "elena",
    paragraphs: [
      "I wake up with my body already braced for something bad, even on days when nothing is wrong. I can calm down for a few minutes, but my thoughts begin circling again as soon as the room becomes quiet.",
      "I'm posting because I need prayer for peace and wisdom about asking for more support. I would also welcome a gentle note from anyone who understands that anxiety can be exhausting even when life looks normal from outside.",
    ],
    closingNote: "I want one evening when fear is not the loudest voice in the room.",
  },
  {
    name: "Caleb", location: "Mumbai, India", lat: 19.076, lng: 72.878, loveCount: 184,
    headline: "I'm discouraged after another job rejection.", sectionHeading: "What I need before trying again",
    quote: "I'm Caleb from Mumbai. I could use some honest encouragement today.", portrait: "jonah",
    paragraphs: [
      "I received another rejection this morning after weeks of interviews and preparation. I know one email should not define me, but each attempt makes it harder to open the next application without expecting the same answer.",
      "I'm here because I need practical advice about staying hopeful while looking for work. I would appreciate a note from someone who remembers this season and can tell me what helped with the next morning.",
    ],
    closingNote: "I am going to try again, but I need help finding my courage first.",
  },
  {
    name: "Sofia", location: "Delhi, India", lat: 28.614, lng: 77.209, loveCount: 102,
    headline: "I'm carrying too much and I do not know what to put down.", sectionHeading: "Why I need perspective",
    quote: "I'm Sofia from Delhi. Everyone needs something from me, and I feel empty.", portrait: "mara",
    paragraphs: [
      "I have become the person everyone calls when something goes wrong, and I am proud that people trust me. I also feel resentment growing beneath that pride, which makes me ashamed and even less willing to admit that I need help.",
      "I'm asking for advice about setting boundaries without becoming cold or unreliable. I need someone to remind me that rest is not abandonment and that love does not require saying yes every time.",
    ],
    closingNote: "I want to care for people without losing myself in the process.",
  },
  {
    name: "Rowan", location: "Bangkok, Thailand", lat: 13.756, lng: 100.502, loveCount: 69,
    headline: "I'm surrounded by people and still feel alone.", sectionHeading: "What I wish I could say out loud",
    quote: "I'm Rowan from Bangkok. I talk all day and still miss being known.", portrait: "avery",
    paragraphs: [
      "I work in a busy café and spend every shift remembering names, orders, and small details about regular customers. I enjoy the work, but most conversations belong to my role, and very few people know anything real about me.",
      "I'm here because I need the courage to let friendship become more than friendly service. I would value advice from anyone who has learned how to be known after years of being the person who listens.",
    ],
    closingNote: "I am ready for a conversation where I do not have to stand behind a counter.",
  },
  {
    name: "Mina", location: "Manila, Philippines", lat: 14.6, lng: 120.984, loveCount: 125,
    headline: "I'm exhausted from caring for everyone else.", sectionHeading: "What I need after this shift",
    quote: "I'm Mina from Manila. I need prayer for strength and a little hope.", portrait: "maya",
    paragraphs: [
      "I work overnight in a hospital and have spent months telling people that difficult moments will pass. I mean those words when I say them, but lately I cannot find the same reassurance for myself when I leave work.",
      "I'm asking for prayer for rest, compassion, and the ability to keep my heart open without breaking it. I would appreciate a note that speaks to me as a person, not only as someone expected to remain strong.",
    ],
    closingNote: "I need to remember that the person doing the caring is human too.",
  },
  {
    name: "Ren", location: "Tokyo, Japan", lat: 35.677, lng: 139.65, loveCount: 198,
    headline: "I'm afraid to make the decision in front of me.", sectionHeading: "What I need help sorting out",
    quote: "I'm Ren from Tokyo. I need advice because fear is making every option look wrong.", portrait: "ren",
    paragraphs: [
      "I have an opportunity to change careers, but accepting it would mean leaving the work and routines that have made me feel safe. I keep making lists, and every list ends with the same uncertainty instead of an answer.",
      "I'm here because I need advice about knowing the difference between wisdom and fear. I would be grateful for a note from someone who made a major change without feeling completely ready.",
    ],
    closingNote: "I want to choose a life instead of only protecting myself from regret.",
  },
  {
    name: "Hana", location: "Seoul, South Korea", lat: 37.566, lng: 126.978, loveCount: 87,
    headline: "I'm homesick and embarrassed to admit it.", sectionHeading: "What I miss",
    quote: "I'm Hana from Seoul. I thought I would adjust faster than this.", portrait: "lena",
    paragraphs: [
      "I moved away from the place where I grew up and expected independence to feel exciting. I am grateful for my new opportunities, but certain meals, sounds, and ordinary family routines can make the distance feel enormous.",
      "I'm posting because I need advice about honoring where I came from while building a life where I am now. I would love a note from anyone who knows that homesickness is not the same thing as ingratitude.",
    ],
    closingNote: "I want to belong here without pretending I do not miss home.",
  },
  {
    name: "Sam", location: "Singapore", lat: 1.352, lng: 103.82, loveCount: 51,
    headline: "I'm eating breakfast alone again.", sectionHeading: "The small thing I am asking for",
    quote: "I'm Sam from Singapore. I would like someone to sit with me.", portrait: "table",
    paragraphs: [
      "I eat at the same corner table before work and usually place my bag on the chair across from me. I tell myself that I enjoy the quiet, but lately I have noticed how carefully I avoid looking at groups laughing nearby.",
      "I'm here because I want to try one simple act of connection instead of waiting to feel less lonely. I would like someone nearby to share breakfast and an ordinary conversation with me.",
    ],
    closingNote: "I will move my bag and keep the chair open Tuesday morning.",
  },
  {
    name: "Lina", location: "Jakarta, Indonesia", lat: -6.208, lng: 106.846, loveCount: 113,
    headline: "I'm trying to be strong for my family, but I am scared.", sectionHeading: "What I need to hear",
    quote: "I'm Lina from Jakarta. I need encouragement while my family goes through a hard month.", portrait: "elena",
    paragraphs: [
      "I have been holding our household together through an uncertain month, and I do not want my fear to become another burden for anyone. I wait until the room is quiet before letting myself admit how worried I am.",
      "I'm posting because I need prayer for provision and wisdom, but I also need emotional support. I would appreciate a note reminding me that strength can include asking other people to stand with me.",
    ],
    closingNote: "I am doing what I can today and asking for help with the part I cannot carry.",
  },
  {
    name: "Mara", location: "Sydney, Australia", lat: -33.869, lng: 151.209, loveCount: 94,
    headline: "I'm ashamed of how far behind I feel.", sectionHeading: "Why I need practical kindness",
    quote: "I'm Mara from Sydney. Money stress is taking over my thoughts.", portrait: "mara",
    paragraphs: [
      "I fell behind on several bills after an unexpected expense, and the shame has made me avoid opening messages or asking anyone for guidance. I know avoiding the numbers is making the fear worse, but I feel frozen whenever I try to begin.",
      "I'm asking for calm, practical advice about taking the first step without being judged. I do not expect anyone to solve this for me; I need help believing that a mistake does not make me hopeless.",
    ],
    closingNote: "I am ready to face what I owe if someone can help me start without shame.",
  },
  {
    name: "Finn", location: "Auckland, New Zealand", lat: -36.85, lng: 174.764, loveCount: 46,
    headline: "I'm trying to stay sober through a difficult week.", sectionHeading: "What would help today",
    quote: "I'm Finn from Auckland. I need encouragement to make it through today.", portrait: "miguel",
    paragraphs: [
      "I have worked hard for my sobriety, but this week has brought back the urge to disappear into old habits. I have already contacted the support people in my life, and I am choosing to be honest instead of hiding how difficult today feels.",
      "I'm here because a few words of encouragement can help me stay focused on the next hour. I would appreciate prayer, hope, or a reminder from someone who understands that asking for support is part of staying well.",
    ],
    closingNote: "I am choosing today, one hour at a time.",
  },
  {
    name: "Ari", location: "Toronto, Canada", lat: 43.653, lng: -79.383, loveCount: 139,
    headline: "I'm wondering whether anyone really knows me.", sectionHeading: "What I am hoping for",
    quote: "I'm Ari from Toronto. I want to feel seen without having to earn it.", portrait: "avery",
    paragraphs: [
      "I am dependable, productive, and usually the person who remembers what everyone else needs. I am grateful to be trusted, but I sometimes wonder whether people value me or only the useful version of me.",
      "I'm posting because I need a reminder that my worth is not measured by what I provide. I would welcome a note from anyone who has learned how to receive care without first proving that it is deserved.",
    ],
    closingNote: "I want to practice being known before I have everything together.",
  },
  {
    name: "Leah", location: "Vancouver, Canada", lat: 49.283, lng: -123.121, loveCount: 72,
    headline: "I'm looking for someone who will listen without fixing me.", sectionHeading: "What I need from a conversation",
    quote: "I'm Leah from Vancouver. I need an honest conversation and a steady friend.", portrait: "jonah",
    paragraphs: [
      "I have learned that I can say difficult things more easily while walking. I do not need an immediate solution; I need enough silence to finish a sentence and enough trust to admit when I am not doing well.",
      "I'm here because the friendship that gave me that space has changed, and I do not want to retreat into isolation. I would appreciate a kind note now and hope to find someone nearby for a weekly public walk.",
    ],
    closingNote: "I am ready to listen too. I just need someone willing to begin.",
  },
];
