// Edit dates, copy, and FAQ answers here as rush details are announced.
// FAQ answers and descriptions use template literals (`) so you can press Enter for new lines.

export const RUSH_EVENTS = [
  {
    id: 'info-1',
    title: 'Info Session #1',
    date: 'August 31, 2026',
    time: '7:00-8:00 PM',
    location: 'Boyd 328',
    description: `Get to know KTP better and interact with current members!`,
  },
  {
    id: 'info-2',
    title: 'Info Session #2',
    date: 'September 2, 2026',
    time: '7:00-8:00 PM',
    location: 'Boyd 328',
    description: `Get to know KTP better and interact with current members!`,
  },
  {
    id: 'info-3',
    title: 'Info Session #3',
    date: 'September 4, 2026',
    time: '7:00-8:00 PM',
    location: 'Boyd 328',
    description: `Get to know KTP better and interact with current members!`,
  },
  {
    id: 'game_night',
    title: 'Game Night',
    date: 'September 8, 2026',
    time: '7:00-8:00 PM',
    location: 'Boyd 328',
    description: `Play a game, meet the members, and have fun!`,
  },
  {
    id: 'shark_tank',
    title: 'Shark Tank',
    date: 'September 9, 2026',
    time: '7:00-8:00 PM',
    location: 'Boyd 328',
    description: `Get an interesting product idea and pitch it to the members!`,
  },
  {
    id: 'artsNcrafts',
    title: 'Arts and Crafts',
    date: 'September 10, 2026',
    time: '7:00-8:00 PM',
    location: 'Boyd 328',
    description: `Get creative and make something fun with the members!`,
  },
  {
    id: 'speed_dating',
    title: 'Speed Dating',
    date: 'September 15, 2026',
    time: '7:00-8:00 PM',
    location: 'Boyd 328',
    description: `Get to know the members better in a fun, fast-paced setting!`,
  },
  {
    id: 'interviews',
    title: 'Interviews',
    date: 'September 16-18, 2026',
    time: 'Pick a time in the portal',
    location: 'Will be posted in the portal',
    description: `Sign up for a short interview with the members to show your interest and get to know us better!`,
  },
  {
    id: 'bid_night',
    title: 'Invite Only Event',
    date: 'September 25, 2026',
    description: `After interviews, check back on your portal for an update!`,
  },
]

export const RUSH_FAQ = [
  {
    id: 'what-is-ktp',
    question: 'What is Kappa Theta Pi?',
    answer: `Kappa Theta Pi is the University of Georgia's only professional technology fraternity.
We focus on career development, technical growth, and building a tight-knit community of builders at the University of Georgia.`,
  },
  {
    id: 'who-can-rush',
    question: 'Who can participate in fall rush?',
    answer: `Any University of Georgia student interested in technology, regardless of major or experience level, is welcome to attend rush events. To be eligible to rush KTP, you must have at least three semesters remaining at UGA, including the semester in which you are rushing.`,
  },
  {
    id: 'when-is-rush',
    question: 'When does rush happen?',
    answer: `Fall rush typically happens around the beginning of the semester and spans about two weeks. Exact dates, times, and locations will be posted here once the timeline is finalized.`,
  },
  {
    id: 'cost',
    question: 'Does rush cost anything?',
    answer: `Rush events are free and open to everybody. Membership dues apply only if you are offered and accept a bid after the rush process.`,
  },
  {
    id: 'commitment',
    question: 'How much of a time commitment is membership?',
    answer: `Members participate in weekly meetings, professional events, and chapter activities. The exact schedule varies by semester, more information will be provided at an info session.`,
  },
  {
    id: 'poker-night',
    question: 'Do I need to know how to play poker?',
    answer: `Nope. Poker will not be actually played.`,
  },
  {
    id: 'miss-event',
    question: 'What if I cannot make every event?',
    answer: `We recommend attending as many events as you can, as you are
    required to attend at least one info session. If you have a conflict, reach out on Instagram and we will help you figure out next steps.`,
  },
]

// The four steps shown on /rush/how-it-works. Kept here with the rest of the
// rush copy so it can be reworded each semester without touching the layout.
//
// Step 4 is deliberately worded as an update you'll see in the portal rather
// than promising an automatic bid notification — bids are sent by leadership as
// a direct message. There is no separate bid system, and the page shouldn't
// imply one.
//
// Step 3 says where interview signup will be announced rather than linking it.
// There is no interview-signup feature in the portal yet; the details go out as
// a rush announcement.
export const RUSH_STEPS = [
  {
    id: 'account',
    label: 'Make an Account with Us',
    body: `Click the button at the bottom of this page, or scan the QR code at any info session, and create an account. It takes about a minute.

Then come back to the main page and sign in to the portal. You can look around before the first event. Have a read through what's posted and see what's coming up.`,
    detail: 'Takes ~1 minute',
  },
  {
    id: 'events',
    label: 'Come to Events and Talk to Members',
    body: `We want to get to know you, and showing up is the biggest thing that helps your chances of getting a bid. Every rush event is on your calendar in the portal with the time and place.`,
    detail: 'Every rush event',
  },
  {
    id: 'interviews',
    label: 'Sign Up for Interviews',
    body: `Towards the end of rush, we hold short interviews. Signup details get posted as an announcement in your portal, so keep an eye on it around then.`,
    detail: 'Towards the end of rush',
  },
  {
    id: 'update',
    label: 'Check Back for an Update',
    body: `Once interviews wrap up, leadership reviews everyone who took part. Check back in on your portal to see where you stand.

If you're offered a bid, you'll get a message from us, plus a notification on your phone, so you don't have to keep refreshing. You'll hear either way.`,
    detail: 'After interviews',
  },
];
