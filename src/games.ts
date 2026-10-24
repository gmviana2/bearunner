export interface GameInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cover: string;
  status: 'playable' | 'soon';
  tags: string[];
  accent: string;
}

const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.jpg`;

export const GAMES: GameInfo[] = [
  {
    id: 'mamel',
    title: 'Mamel',
    subtitle: 'Castelo Celeste',
    description: 'Fuja do dinossauro pelas pontes flutuantes do Castelo Celeste: desvie de trens, pule barreiras e buracos e colete estrelas!',
    cover: art('castelo'),
    status: 'playable',
    tags: ['Corrida infinita', 'Fuja do dinossauro', 'Power-ups'],
    accent: '#9b6cff',
  },
  {
    id: 'floresta',
    title: 'Mamel',
    subtitle: 'Floresta Encantada',
    description: 'Natureza, pontes de madeira e criaturas mágicas.',
    cover: art('floresta'),
    status: 'soon',
    tags: ['Novo mundo'],
    accent: '#3fbf7f',
  },
  {
    id: 'deserto',
    title: 'Mamel',
    subtitle: 'Deserto Dourado',
    description: 'Ruínas antigas, areia e plataformas móveis.',
    cover: art('deserto'),
    status: 'soon',
    tags: ['Novo mundo'],
    accent: '#f2a03a',
  },
  {
    id: 'gelo',
    title: 'Mamel',
    subtitle: 'Reino de Gelo',
    description: 'Pisos escorregadios, cristais e pontes de gelo.',
    cover: art('gelo'),
    status: 'soon',
    tags: ['Novo mundo'],
    accent: '#3d9bff',
  },
  {
    id: 'vulcao',
    title: 'Mamel',
    subtitle: 'Vulcão Adormecido',
    description: 'Lava, pedras caindo e desafios de tempo.',
    cover: art('vulcao'),
    status: 'soon',
    tags: ['Novo mundo'],
    accent: '#ff5d4a',
  },
];

export const EVENTS = [
  { title: 'Portais', text: 'Atalhos para mundos secretos.', cover: art('portais') },
  { title: 'Missões especiais', text: 'Colete todos os fragmentos!', cover: art('missoes') },
  { title: 'Eventos', text: 'Desafios por tempo limitado.', cover: art('eventos') },
];

export const ART = {
  hero: art('hero'),
  mamel: art('mamel'),
};
