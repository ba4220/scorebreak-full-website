// Homepage "Trusted by programs nationwide" marquee, in display order. className adds per-logo size tweaks (index.astro styles).
export interface SchoolLogo {
  src: string;
  alt: string;
  className?: string;
}

export const schoolLogos: SchoolLogo[] = [
  { src: '/ncaa-d1/denver2.png', alt: 'Denver', className: 'logo-denver2' },
  { src: '/ncaa-d1/duke2.png', alt: 'Duke' },
  { src: '/ncaa-d1/yale.png', alt: 'Yale' },
  { src: '/ncaa-d1/notre-dame.png', alt: 'Notre Dame' },
  { src: '/ncaa-d1/unc.png', alt: 'UNC' },
  { src: '/ncaa-d1/stanford.png', alt: 'Stanford', className: 'logo-stanford' },
  { src: '/ncaa-d1/army.png', alt: 'Army' },
  { src: '/ncaa-d1/alabama.png', alt: 'Alabama' },
  { src: '/ncaa-d1/cornell.png', alt: 'Cornell', className: 'logo-cornell' },
  { src: '/ncaa-d1/marquette.png', alt: 'Marquette' },
  { src: '/ncaa-d1/first-class.png', alt: 'First Class Lacrosse', className: 'logo-first-class' },
  { src: '/ncaa-d1/princeton.png', alt: 'Princeton' },
  { src: '/ncaa-d1/brown.png', alt: 'Brown' },
  { src: '/ncaa-d1/rutgers.png', alt: 'Rutgers' },
  { src: '/ncaa-d1/northwestern.png', alt: 'Northwestern' },
  { src: '/ncaa-d1/syracuse.png', alt: 'Syracuse' },
  { src: '/ncaa-d1/new-towson.png', alt: 'Towson', className: 'logo-new-towson' },
  { src: '/ncaa-d1/umd.png', alt: 'Maryland' },
  { src: '/ncaa-d1/culver.png', alt: 'Culver', className: 'logo-culver' },
  { src: '/ncaa-d1/salisbury.png', alt: 'Salisbury' },
  { src: '/ncaa-d1/saint-josephs.png', alt: 'Saint Joseph\'s' },
  { src: '/ncaa-d1/mercer.png', alt: 'Mercer' },
  { src: '/ncaa-d1/osu-best.png', alt: 'Ohio State' },
  { src: '/ncaa-d1/nba-academy-logo.png', alt: 'NBA Academy' },
];
