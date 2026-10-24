export type Accessory = 'cap' | 'catHood' | 'headphones';
export type HairStyle = 'long' | 'ponytail' | 'short';

/** Colors and style used to draw the runner (seen from behind) in the game. */
export interface Look {
  hair: string;
  hairDark: string;
  hairLight: string;
  streak: string;
  top: string;
  topDark: string;
  shorts: string;
  shoeAccent: string;
  accessory: Accessory;
  accColor: string;
  accDark: string;
  hairStyle: HairStyle;
}

export interface Character {
  id: string;
  name: string;
  tagline: string;
  portrait: string;
  accent: string;
  look: Look;
}

const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.jpg`;

export const CHARACTERS: Character[] = [
  {
    id: 'manu',
    name: 'Manu',
    tagline: 'Gamer de coração, corre no ritmo da música.',
    portrait: art('char-manu'),
    accent: '#7b3fe4',
    look: {
      hair: '#5b3a9e', hairDark: '#3e2475', hairLight: '#8a63d6', streak: '#41e0ff',
      top: '#6a3fd6', topDark: '#2d1b57', shorts: '#2d1b57', shoeAccent: '#9b6cff',
      accessory: 'headphones', accColor: '#3a2a6e', accDark: '#41e0ff', hairStyle: 'long',
    },
  },
  {
    id: 'mel',
    name: 'Mel',
    tagline: 'Estilosa e corajosa, nunca tira o boné da sorte.',
    portrait: art('char-mel'),
    accent: '#ff4f9a',
    look: {
      hair: '#6b3a26', hairDark: '#4f2a1b', hairLight: '#9a5a3a', streak: '#ff4f9a',
      top: '#ec4a86', topDark: '#bf2f63', shorts: '#2b2238', shoeAccent: '#ff4f8b',
      accessory: 'cap', accColor: '#2b2238', accDark: '#ff4f9a', hairStyle: 'long',
    },
  },
  {
    id: 'sara',
    name: 'Sara',
    tagline: 'Fofa como um gatinho e cheia de energia.',
    portrait: art('char-sara'),
    accent: '#f2a03a',
    look: {
      hair: '#6b3a26', hairDark: '#4f2a1b', hairLight: '#9a5a3a', streak: '#ffcf3a',
      top: '#ffc233', topDark: '#e09a12', shorts: '#2b2238', shoeAccent: '#f2a03a',
      accessory: 'catHood', accColor: '#ffc233', accDark: '#e09a12', hairStyle: 'long',
    },
  },
  {
    id: 'gilmar',
    name: 'Gilmar',
    tagline: 'Aventureiro e brincalhão, sempre pronto para a próxima corrida.',
    portrait: art('char-gilmar'),
    accent: '#2f6fe0',
    look: {
      hair: '#6b3a26', hairDark: '#4f2a1b', hairLight: '#9a5a3a', streak: '#6b3a26',
      top: '#3d8bff', topDark: '#2459c7', shorts: '#26315e', shoeAccent: '#2f6fe0',
      accessory: 'cap', accColor: '#2f6fe0', accDark: '#ffcf3a', hairStyle: 'short',
    },
  },
];

const KEY = 'bearunner:character';

export function getCharacter(id: string | null | undefined): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

export function loadCharacterId(): string {
  try {
    return getCharacter(localStorage.getItem(KEY)).id;
  } catch {
    return CHARACTERS[0].id;
  }
}

export function saveCharacterId(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
}
