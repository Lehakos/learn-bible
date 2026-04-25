import danielImage from '../assets/avatar/daniel.png';
import davidImage from '../assets/avatar/david.png';
import estherImage from '../assets/avatar/esther.png';
import lydiaImage from '../assets/avatar/lydia.png';
import maryImage from '../assets/avatar/mary.png';
import mosesImage from '../assets/avatar/moses.png';
import paulImage from '../assets/avatar/paul.png';
import ruthImage from '../assets/avatar/ruth.png';
import samsonImage from '../assets/avatar/samson.png';
import type { AvatarCharacter } from '../types';

export const DEFAULT_AVATAR_ID = 'david';

export const avatarCharacters: AvatarCharacter[] = [
  {
    id: 'david',
    name: 'Давид',
    description: 'Юный пастух с пращой',
    unlockLevel: 1,
    image: davidImage,
  },
  {
    id: 'ruth',
    name: 'Руфь',
    description: 'Верная труженица с колосьями',
    unlockLevel: 2,
    image: ruthImage,
  },
  {
    id: 'daniel',
    name: 'Даниил',
    description: 'Мудрый юноша со свитком',
    unlockLevel: 3,
    image: danielImage,
  },
  {
    id: 'esther',
    name: 'Есфирь',
    description: 'Царица в царской одежде',
    unlockLevel: 4,
    image: estherImage,
  },
  {
    id: 'mary',
    name: 'Мария',
    description: 'Кроткий образ в синей накидке',
    unlockLevel: 5,
    image: maryImage,
  },
  {
    id: 'moses',
    name: 'Моисей',
    description: 'Пророк со скрижалями и посохом',
    unlockLevel: 6,
    image: mosesImage,
  },
  {
    id: 'paul',
    name: 'Павел',
    description: 'Апостол-путешественник со свитком',
    unlockLevel: 7,
    image: paulImage,
  },
  {
    id: 'samson',
    name: 'Самсон',
    description: 'Силач с семью косами',
    unlockLevel: 8,
    image: samsonImage,
  },
  {
    id: 'lydia',
    name: 'Лидия',
    description: 'Торговка пурпурной тканью',
    unlockLevel: 9,
    image: lydiaImage,
  },
];

const avatarsById = new Map(avatarCharacters.map((avatar) => [avatar.id, avatar]));

export function getAvatarCharacter(id: string | undefined): AvatarCharacter {
  return avatarsById.get(id ?? '') ?? avatarCharacters[0];
}

export function isAvatarUnlocked(id: string | undefined, level: number): boolean {
  const avatar = avatarsById.get(id ?? '');
  return !!avatar && avatar.unlockLevel <= level;
}

export function resolveAvatarId(id: string | undefined, level: number): string {
  return isAvatarUnlocked(id, level) ? id! : DEFAULT_AVATAR_ID;
}

export function getNewAvatarCharacters(previousLevel: number, nextLevel: number): AvatarCharacter[] {
  return avatarCharacters.filter(
    (avatar) =>
      avatar.id !== DEFAULT_AVATAR_ID &&
      avatar.unlockLevel > previousLevel &&
      avatar.unlockLevel <= nextLevel,
  );
}
