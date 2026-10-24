import { lazy, Suspense, useEffect, useState } from 'react';
import Landing from './components/Landing';

// Phaser is heavy; only load it when a game is opened.
const GameScreen = lazy(() => import('./components/GameScreen'));

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  const match = hash.match(/^#\/jogar\/([\w-]+)/);

  if (match) {
    return (
      <Suspense fallback={<div className="loading">Carregando aventura…</div>}>
        <GameScreen gameId={match[1]} />
      </Suspense>
    );
  }
  return <Landing />;
}
