import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { RunnerScene } from '../game/RunnerScene';
import { bus, type GameCommand, type GameOverInfo, type GamePhase, type HudState, type PowerKind } from '../game/bus';
import { GAMES } from '../games';
import { CHARACTERS, getCharacter, loadCharacterId, saveCharacterId } from '../characters';

const BEST_KEY = 'bearunner:best:';
const POWER_LABEL: Record<PowerKind, { icon: string; name: string }> = {
  magnet: { icon: '🧲', name: 'Ímã' },
  shield: { icon: '🛡️', name: 'Escudo' },
  double: { icon: '✖2', name: 'Multiplicador' },
};

function readBest(id: string) {
  try {
    return Number(localStorage.getItem(BEST_KEY + id)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(id: string, value: number) {
  try {
    localStorage.setItem(BEST_KEY + id, String(value));
  } catch {
    /* storage unavailable: best score just won't persist */
  }
}

const send = (cmd: GameCommand) => bus.emit('cmd', cmd);

export default function GameScreen({ gameId }: { gameId: string }) {
  const host = useRef<HTMLDivElement>(null);
  const game = GAMES.find((g) => g.id === gameId);
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [hud, setHud] = useState<HudState>({ score: 0, coins: 0, lives: 3, mult: 1, powers: [] });
  const [result, setResult] = useState<(GameOverInfo & { best: number; record: boolean }) | null>(null);
  const [hurt, setHurt] = useState(false);
  const [best, setBest] = useState(() => readBest(gameId));
  const [charId, setCharId] = useState(loadCharacterId);
  const hero = getCharacter(charId);

  const chooseCharacter = (id: string) => {
    setCharId(id);
    saveCharacterId(id);
    bus.emit('character', id);
  };

  useEffect(() => {
    if (!host.current || game?.status !== 'playable') return;
    const onPhase = (p: GamePhase) => {
      setPhase(p);
      if (p !== 'over') setResult(null);
    };
    const onHud = (h: HudState) => setHud(h);
    const onHit = () => {
      setHurt(true);
      window.setTimeout(() => setHurt(false), 350);
    };
    const onOver = (info: GameOverInfo) => {
      const prev = readBest(gameId);
      const record = info.score > prev;
      if (record) writeBest(gameId, info.score);
      setBest(Math.max(prev, info.score));
      setResult({ ...info, best: Math.max(prev, info.score), record });
    };
    bus.on('phase', onPhase);
    bus.on('hud', onHud);
    bus.on('hit', onHit);
    bus.on('gameover', onOver);

    const g = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      backgroundColor: '#cfe6ff',
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      render: { antialias: true },
      scene: [RunnerScene],
    });

    const onVisibility = () => document.hidden && send('pause');
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      bus.off('phase', onPhase);
      bus.off('hud', onHud);
      bus.off('hit', onHit);
      bus.off('gameover', onOver);
      g.destroy(true);
    };
  }, [gameId, game?.status]);

  if (!game || game.status !== 'playable') {
    return (
      <div className="soon-screen">
        <h1>Em breve! ✨</h1>
        <p>Esse mundo ainda está sendo construído.</p>
        <a className="btn btn-primary" href="#/">Voltar</a>
      </div>
    );
  }

  return (
    <div className={`game-screen ${hurt ? 'hurt' : ''}`}>
      <div ref={host} className="game-host" />

      <div className="hud">
        <div className="hud-left">
          <img className="hud-avatar" src={hero.portrait} alt={hero.name} />
          <div className="hud-stats">
            <div className="hud-pill score">
              {hud.score.toLocaleString('pt-BR')}
              {hud.mult > 1 && <span className="mult">x{hud.mult}</span>}
            </div>
            <div className="hud-pill coins">
              <span className="coin-dot" /> {hud.coins}
            </div>
            <div className="hearts" aria-label={`${hud.lives} vidas`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={i < hud.lives ? 'heart' : 'heart lost'}>❤</span>
              ))}
            </div>
          </div>
        </div>
        {phase === 'running' && (
          <button className="hud-btn" onClick={() => send('pause')} aria-label="Pausar">❚❚</button>
        )}
      </div>

      <div className="powers">
        {hud.powers.map((p) => (
          <div key={p.kind} className={`power power-${p.kind}`} title={POWER_LABEL[p.kind].name}>
            <svg viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" className="track" />
              <circle
                cx="20"
                cy="20"
                r="17"
                className="ring"
                strokeDasharray={`${(p.left / p.total) * 106.8} 106.8`}
              />
            </svg>
            <span>{POWER_LABEL[p.kind].icon}</span>
          </div>
        ))}
      </div>

      {phase === 'ready' && (
        <div className="overlay">
          <div className="card">
            <h2>{game.title}</h2>
            <p className="muted">{game.subtitle} · escolha quem vai correr</p>
            <div className="picker" role="radiogroup" aria-label="Personagem">
              {CHARACTERS.map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={c.id === charId}
                  className={c.id === charId ? 'pick active' : 'pick'}
                  style={{ ['--accent' as string]: c.accent }}
                  onClick={() => chooseCharacter(c.id)}
                >
                  <img src={c.portrait} alt="" />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
            <p className="muted small">{hero.tagline}</p>
            <ul className="controls">
              <li><b>← →</b> ou deslize para os lados: trocar de pista</li>
              <li><b>↑ / espaço</b> ou deslize p/ cima: pular barreiras</li>
              <li><b>↓</b> ou deslize p/ baixo: deslizar sob as vigas</li>
            </ul>
            <button className="btn btn-primary big" onClick={() => send('start')}>Correr com {hero.name} ▶</button>
            {best > 0 && <p className="muted small">Seu recorde: {best.toLocaleString('pt-BR')}</p>}
            <a className="link" href="#/">← Voltar à plataforma</a>
          </div>
        </div>
      )}

      {phase === 'paused' && (
        <div className="overlay">
          <div className="card">
            <h2>Pausado</h2>
            <button className="btn btn-primary big" onClick={() => send('resume')}>Continuar</button>
            <button className="btn btn-ghost" onClick={() => send('restart')}>Recomeçar</button>
            <a className="link" href="#/">Sair do jogo</a>
          </div>
        </div>
      )}

      {phase === 'over' && result && (
        <div className="overlay">
          <div className="card">
            <h2>{result.record ? 'Novo recorde! 🏆' : 'Fim de corrida!'}</h2>
            <div className="result-grid">
              <div><span>Pontos</span><b>{result.score.toLocaleString('pt-BR')}</b></div>
              <div><span>Moedas</span><b>{result.coins}</b></div>
              <div><span>Distância</span><b>{result.distance} m</b></div>
              <div><span>Recorde</span><b>{result.best.toLocaleString('pt-BR')}</b></div>
            </div>
            <button className="btn btn-primary big" onClick={() => send('restart')}>Jogar de novo ↻</button>
            <a className="link" href="#/">← Voltar à plataforma</a>
          </div>
        </div>
      )}
    </div>
  );
}
