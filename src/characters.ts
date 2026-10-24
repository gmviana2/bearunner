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
    tagline: 'Estilosa e corajosa, nunca tira o boné da sorte.',
    portrait: art('char-manu'),
    accent: '#ff4f9a',
    look: {
      hair: '#6b3a26', hairDark: '#4f2a1b', hairLight: '#9a5a3a', streak: '#ff4f9a',
      top: '#ec4a86', topDark: '#2b2238', shorts: '#2b2238', shoeAccent: '#ff4f8b',
      accessory: 'cap', accColor: '#2b2238', accDark: '#ff4f9a', hairStyle: 'long',
    },
  },
  {
    id: 'mel',
    name: 'Mel',
    tagline: 'Doce e sonhadora, adora pontes de cristal.',
    portrait: art('char-mel'),
    accent: '#3d9bff',
    look: {
      hair: '#2f6fb8', hairDark: '#1f4c85', hairLight: '#5aa3e8', streak: '#9fd8ff',
      top: '#5bb6f2', topDark: '#2f7fc4', shorts: '#2d5a9e', shoeAccent: '#ff6fa8',
      accessory: 'cap', accColor: '#3d7be0', accDark: '#9b6cff', hairStyle: 'ponytail',
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
    id: 'gil',
    name: 'Gil',
    tagline: 'Gamer de coração, corre no ritmo da música.',
    portrait: art('char-gil'),
    accent: '#7b3fe4',
    look: {
      hair: '#5b3a9e', hairDark: '#3e2475', hairLight: '#8a63d6', streak: '#41e0ff',
      top: '#4a2f86', topDark: '#2d1b57', shorts: '#2d1b57', shoeAccent: '#41e0ff',
      accessory: 'headphones', accColor: '#3a2a6e', accDark: '#41e0ff', hairStyle: 'short',
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
