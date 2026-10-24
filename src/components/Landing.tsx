import { ART, EVENTS, GAMES } from '../games';
import { CHARACTERS, saveCharacterId } from '../characters';

const playable = GAMES.filter((g) => g.status === 'playable');
const upcoming = GAMES.filter((g) => g.status === 'soon');
const playHref = `#/jogar/${playable[0].id}`;

const HOW_TO = [
  { icon: '↔️', title: 'Troque de pista', text: 'Setas ← → ou deslize para os lados.' },
  { icon: '⬆️', title: 'Pule', text: 'Seta ↑, espaço ou deslize para cima.' },
  { icon: '⬇️', title: 'Deslize', text: 'Seta ↓ ou deslize para baixo.' },
  { icon: '🦖', title: 'Fuja do dino', text: 'Tropeçou? Ele vem atrás. Tropeçou de novo, ele te pega!' },
];

const OBSTACLES = [
  { icon: '🚧', name: 'Barreira', tip: 'Pule por cima' },
  { icon: '🪵', name: 'Viga', tip: 'Deslize por baixo' },
  { icon: '📦', name: 'Caixa', tip: 'Desvie ou pule alto' },
  { icon: '🚆', name: 'Trem', tip: 'Troque de pista!' },
  { icon: '🕳️', name: 'Buraco', tip: 'Pule ou você cai!' },
];

const POWERS = [
  { icon: '🧲', name: 'Ímã', text: 'Atrai todas as moedas por perto.', color: '#ff4f6d' },
  { icon: '🛡️', name: 'Escudo', text: 'Protege de 1 impacto.', color: '#3d8bff' },
  { icon: '✖2', name: 'Multiplicador', text: 'Pontos em dobro por 10s.', color: '#9b5cff' },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="nav">
        <a className="logo" href="#/">
          <span className="logo-star">★</span> BeaRunner
        </a>
        <nav>
          <a href="#jogos">Jogos</a>
          <a href="#personagens">Personagens</a>
          <a href="#como-jogar">Como jogar</a>
        </nav>
        <a className="btn btn-primary small" href={`#/jogar/${playable[0].id}`}>Jogar</a>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="badge">✨ Novo · protótipo jogável</span>
          <h1>
            Corra, pule e <span className="grad">brilhe</span> no Mamel!
          </h1>
          <p>
            BeaRunner é uma plataforma de jogos de corrida infinita no estilo chibi: mundos mágicos,
            obstáculos divertidos, um dinossauro faminto na sua cola e muita fofura. Direto no navegador, no PC ou no celular.
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary big" href={`#/jogar/${playable[0].id}`}>▶ Jogar agora</a>
            <a className="btn btn-ghost big" href="#jogos">Ver jogos</a>
          </div>
          <div className="hero-stats">
            <div><b>1</b><span>jogo disponível</span></div>
            <div><b>4</b><span>personagens</span></div>
            <div><b>4</b><span>mundos chegando</span></div>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-frame">
            <img src={ART.hero} alt="Corrida pela ponte do Castelo Celeste" />
          </div>
          <img className="hero-mamel" src={ART.mamel} alt="" />
          <span className="float-coin c1">⭐</span>
          <span className="float-coin c2">💎</span>
          <span className="float-coin c3">⭐</span>
        </div>
      </section>

      <section id="jogos" className="section">
        <div className="section-head">
          <h2>Jogos</h2>
          <p>Escolha sua aventura. Novos mundos chegam em breve!</p>
        </div>

        {playable.map((g) => (
          <article key={g.id} className="featured" style={{ ['--accent' as string]: g.accent }}>
            <a className="featured-cover" href={`#/jogar/${g.id}`}>
              <img src={g.cover} alt={g.subtitle} />
              <span className="play-chip">▶ Jogar</span>
            </a>
            <div className="featured-body">
              <span className="badge live">● Disponível</span>
              <h3>
                {g.title} <small>{g.subtitle}</small>
              </h3>
              <p>{g.description}</p>
              <div className="tags">
                {g.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <a className="btn btn-primary" href={`#/jogar/${g.id}`}>Jogar agora</a>
            </div>
          </article>
        ))}

        <div className="grid">
          {upcoming.map((g) => (
            <article key={g.id} className="game-card" style={{ ['--accent' as string]: g.accent }}>
              <div className="game-cover">
                <img src={g.cover} alt={g.subtitle} loading="lazy" />
                <span className="soon">Em breve</span>
              </div>
              <div className="game-body">
                <h3>{g.subtitle}</h3>
                <p>{g.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="personagens" className="section">
        <div className="section-head">
          <h2>Escolha sua personagem</h2>
          <p>Quatro amigos, cada um com seu estilo. Quem vai correr com você?</p>
        </div>
        <div className="characters">
          {CHARACTERS.map((c) => (
            <article key={c.id} className="char-card" style={{ ['--accent' as string]: c.accent }}>
              <img src={c.portrait} alt={c.name} loading="lazy" />
              <div className="char-body">
                <h3>{c.name}</h3>
                <p>{c.tagline}</p>
                <a className="btn btn-primary small" href={playHref} onClick={() => saveCharacterId(c.id)}>
                  Correr com {c.name}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="como-jogar" className="section">
        <div className="section-head">
          <h2>Como jogar</h2>
          <p>Fácil de aprender, difícil de parar.</p>
        </div>
        <div className="howto">
          {HOW_TO.map((h) => (
            <div key={h.title} className="howto-card">
              <span className="howto-icon">{h.icon}</span>
              <h4>{h.title}</h4>
              <p>{h.text}</p>
            </div>
          ))}
        </div>

        <div className="two-col">
          <div className="panel">
            <h3>Obstáculos</h3>
            <ul className="chips">
              {OBSTACLES.map((o) => (
                <li key={o.name}>
                  <span className="chip-icon">{o.icon}</span>
                  <div>
                    <b>{o.name}</b>
                    <small>{o.tip}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3>Power-ups</h3>
            <ul className="chips">
              {POWERS.map((p) => (
                <li key={p.name}>
                  <span className="chip-icon" style={{ background: p.color }}>{p.icon}</span>
                  <div>
                    <b>{p.name}</b>
                    <small>{p.text}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Vem aí</h2>
          <p>Portais secretos, missões e eventos especiais.</p>
        </div>
        <div className="events">
          {EVENTS.map((e) => (
            <article key={e.title} className="event-card">
              <img src={e.cover} alt="" loading="lazy" />
              <div>
                <h4>{e.title}</h4>
                <p>{e.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>Uma nova aventura te espera!</h2>
        <a className="btn btn-light big" href={`#/jogar/${playable[0].id}`}>▶ Começar a correr</a>
      </section>

      <footer className="footer">
        <span>★ BeaRunner</span>
        <span>Navegador (PC e celular) · Phaser 3 + TypeScript + React + Vite</span>
      </footer>
    </div>
  );
}
