// Coach and athlete quotes, shared by every page that shows them.
// quote and role are HTML (<strong> highlights, <br> line breaks); logo is a site-root path (public/).
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  logo: string;
  logoAlt: string;
  // Logo needs a backdrop tile to stay visible on dark cards.
  tile?: boolean;
}

export const testimonials = {
  'mikey-thompson': {
    quote: 'ScoreBreak was a pleasure for our staff and athletes this season... <strong>by far the best platform I\'ve ever used.</strong> I loved being able to tag and organize clips however I liked to be able to tell a story to our players. My favorite part about the platform is the chat feature.',
    name: 'Mikey Thompson',
    role: 'Head Coach, Christopher Newport Men\'s Lacrosse',
    logo: '/ncaa-d1/cnu.png',
    logoAlt: 'Christopher Newport',
  },
  'jana-drummond': {
    quote: 'Our best film sessions happen when we can pause, split into groups, and review in real time. Offense goes with one coach, defense with another, and <strong>we pull up the play on our iPads to say, \'This is the change we need to make.\'</strong>',
    name: 'Jana Drummond',
    role: 'Head Coach, Oregon Women\'s Lacrosse',
    logo: '/ncaa-d1/oregon.png',
    logoAlt: 'Oregon',
  },
  'jon-torpey': {
    quote: '<strong>ScoreBreak has been a total game changer for our staff and players.</strong> If I told you we used ScoreBreak 10,000x a day we would probably be underestimating. We are completely obsessed with it and it seems like every year the product has gotten better.',
    name: 'Jon Torpey',
    role: 'Head Coach, Brown Men\'s Lacrosse',
    logo: '/ncaa-d1/brown.png',
    logoAlt: 'Brown',
  },
  'liza-kelly': {
    quote: '<strong>ScoreBreak is like having another coach in the office and on the field at all times.</strong> The in-game adjustments we\'ve made with film access have been incredible.',
    name: 'Liza Kelly',
    role: 'Denver Women\'s Lacrosse',
    logo: '/ncaa-d1/denver.png',
    logoAlt: 'Denver',
  },
  'dean-curtis': {
    quote: 'We\'ve tried other platforms  -  including the most well-known  -  but I still choose ScoreBreak because <strong>the breakdown interface is simply better.</strong> ScoreBreak makes it easy to analyze clips, and it\'s the best platform we\'ve found for film study.',
    name: 'Dean Curtis',
    role: 'Head Coach, Pennsbury HS Boys Lacrosse',
    logo: '/ncaa-d1/pennsbury.png',
    logoAlt: 'Pennsbury',
  },
  'tatum-lewis': {
    quote: 'One of the coolest features is being able to write directly over clips. <strong>It\'s a quick, clear way to express what the play is about before we even hit play.</strong>',
    name: 'Tatum Lewis',
    role: 'UVM Men\'s Lacrosse athlete',
    logo: '/ncaa-d1/vermont-catamounts-logo.png',
    logoAlt: 'Vermont Catamounts',
  },
  'ryan-danehy': {
    quote: 'ScoreBreak Recruiting Network offers an unmatched experience, giving us <strong>unprecedented access to watch club film when we\'re unable to attend tournaments.</strong>',
    name: 'Ryan Danehy',
    role: 'Assistant Coach, Ohio State Men\'s Lacrosse',
    logo: '/ncaa-d1/osu-best.png',
    logoAlt: 'Ohio State',
  },
  'mike-hungerford': {
    quote: 'The expansion of ScoreBreak into club lacrosse with ScoreBreak Recruiting Network is a game-changer for us at Mad Dog. <strong>The additional exposure our players gain by having their film available for NCAA coaches to view is tremendous.</strong> Plus, being able to review game film with our teams is another invaluable tool in our player-development toolbox.',
    name: 'Mike Hungerford',
    role: 'Director, Mad Dog Lacrosse',
    logo: '/ncaa-d1/mad-dog.png',
    logoAlt: 'Mad Dog Lacrosse',
    tile: true,
  },
  'josh-arruda': {
    quote: 'Coming from the Nerd Ball tree of John Andrzejek and the Kyle Smith family, there\'s a version of the game I see analytically. ScoreBreak allows me to tag, record, and clip in the same facets as HUDL Sportscode — everything I need for post-game film, scouting, and live film review. The best part is I can host my analytical database in the same app and use its AI features to formulate reports based off the data I\'m collecting. <strong>One stop shop for film review, analysis, and interpretation.</strong> High-level teaching tool.',
    name: 'Josh Arruda',
    role: 'Assistant Coach, Connecticut College<br>Former Director of Analytics, Campbell University',
    logo: '/ncaa-d1/cc.png',
    logoAlt: 'Connecticut College',
  },
} satisfies Record<string, Testimonial>;

export type TestimonialId = keyof typeof testimonials;
