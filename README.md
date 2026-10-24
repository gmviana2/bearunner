# BeaRunner ★

Plataforma de jogos de corrida infinita (estilo Subway Surfers / Temple Run) com visual chibi.

O primeiro jogo é **Lívia Run: Castelo Celeste**: 3 pistas, pular, deslizar, moedas, power-ups (ímã, escudo, x2) e 3 vidas.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (site estático)
```

## Estrutura

- `src/components/Landing.tsx`: landing page com o catálogo de jogos
- `src/components/GameScreen.tsx`: tela do jogo (Phaser + HUD em React)
- `src/game/RunnerScene.ts`: o runner pseudo-3D (projeção em perspectiva, spawn, colisões)
- `src/game/textures.ts`: arte procedural (Lívia, obstáculos, moedas, cenário) desenhada em Canvas
- `src/games.ts`: catálogo de jogos (adicione novos jogos/mundos aqui)
- `public/art/`: artes conceituais usadas na landing

Rotas: `#/` (landing) e `#/jogar/<id>` (jogo).

Controles: ← → / A D trocam de pista, ↑ / W / espaço pulam, ↓ / S deslizam, P / Esc pausam. No celular, deslize o dedo.
