import type { ImageMetadata } from 'astro';
import alabamaImg from '../assets/ncaa-d1/alabama.png';
import armyImg from '../assets/ncaa-d1/army.png';
import brownImg from '../assets/ncaa-d1/brown.png';
import cornellImg from '../assets/ncaa-d1/cornell.png';
import culverImg from '../assets/ncaa-d1/culver.png';
import denver2Img from '../assets/ncaa-d1/denver2.png';
import duke2Img from '../assets/ncaa-d1/duke2.png';
import firstClassImg from '../assets/ncaa-d1/first-class.png';
import marquetteImg from '../assets/ncaa-d1/marquette.png';
import mercerImg from '../assets/ncaa-d1/mercer.png';
import nbaAcademyLogoImg from '../assets/ncaa-d1/nba-academy-logo.png';
import newTowsonImg from '../assets/ncaa-d1/new-towson.png';
import northwesternImg from '../assets/ncaa-d1/northwestern.png';
import notreDameImg from '../assets/ncaa-d1/notre-dame.png';
import osuBestImg from '../assets/ncaa-d1/osu-best.png';
import princetonImg from '../assets/ncaa-d1/princeton.png';
import rutgersImg from '../assets/ncaa-d1/rutgers.png';
import saintJosephsImg from '../assets/ncaa-d1/saint-josephs.png';
import salisburyImg from '../assets/ncaa-d1/salisbury.png';
import stanfordImg from '../assets/ncaa-d1/stanford.png';
import syracuseImg from '../assets/ncaa-d1/syracuse.png';
import umdImg from '../assets/ncaa-d1/umd.png';
import uncImg from '../assets/ncaa-d1/unc.png';
import yaleImg from '../assets/ncaa-d1/yale.png';

// Homepage "Trusted by elite organizations worldwide" marquee, in display order. className adds per-logo size tweaks (index.astro styles).
export interface SchoolLogo {
  src: ImageMetadata;
  alt: string;
  className?: string;
}

export const schoolLogos: SchoolLogo[] = [
  { src: denver2Img, alt: 'Denver', className: 'logo-denver2' },
  { src: duke2Img, alt: 'Duke' },
  { src: yaleImg, alt: 'Yale' },
  { src: notreDameImg, alt: 'Notre Dame' },
  { src: uncImg, alt: 'UNC' },
  { src: stanfordImg, alt: 'Stanford', className: 'logo-stanford' },
  { src: armyImg, alt: 'Army' },
  { src: alabamaImg, alt: 'Alabama' },
  { src: cornellImg, alt: 'Cornell', className: 'logo-cornell' },
  { src: marquetteImg, alt: 'Marquette' },
  { src: firstClassImg, alt: 'First Class Lacrosse', className: 'logo-first-class' },
  { src: princetonImg, alt: 'Princeton' },
  { src: brownImg, alt: 'Brown' },
  { src: rutgersImg, alt: 'Rutgers' },
  { src: northwesternImg, alt: 'Northwestern' },
  { src: syracuseImg, alt: 'Syracuse' },
  { src: newTowsonImg, alt: 'Towson', className: 'logo-new-towson' },
  { src: umdImg, alt: 'Maryland' },
  { src: culverImg, alt: 'Culver', className: 'logo-culver' },
  { src: salisburyImg, alt: 'Salisbury' },
  { src: saintJosephsImg, alt: 'Saint Joseph\'s' },
  { src: mercerImg, alt: 'Mercer' },
  { src: osuBestImg, alt: 'Ohio State' },
  { src: nbaAcademyLogoImg, alt: 'NBA Academy' },
];
