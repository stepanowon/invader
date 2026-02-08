import { useEffect, useRef, useState } from 'react';
import { startGame, destroyGame } from './game';
import { i18n, type Language } from './game/i18n/Localization';
import { virtualControls } from './game/input/VirtualControls';
import './App.css';

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [language, setLanguage] = useState<Language>(i18n.getLanguage());
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [activeSceneKey, setActiveSceneKey] = useState<string>('');

  useEffect(() => {
    // 게임 시작
    if (!gameRef.current) {
      gameRef.current = startGame('game-container');
    }

    // 언어 변경 리스너 등록
    const handleLanguageChange = () => {
      setLanguage(i18n.getLanguage());
    };
    i18n.onLanguageChange(handleLanguageChange);

    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const updateTouchMode = () => {
      const hasTouchPoints = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
      setShowTouchControls(mediaQuery.matches || hasTouchPoints);
    };

    updateTouchMode();
    mediaQuery.addEventListener('change', updateTouchMode);

    const syncActiveScene = () => {
      const game = gameRef.current;
      if (!game) return;
      const activeScenes = game.scene.getScenes(true);
      const nextKey = activeScenes.length > 0 ? activeScenes[0].scene.key : '';
      setActiveSceneKey(prev => (prev === nextKey ? prev : nextKey));
    };

    syncActiveScene();
    const sceneSyncTimer = window.setInterval(syncActiveScene, 120);

    const handleWindowBlur = () => {
      virtualControls.reset();
    };
    window.addEventListener('blur', handleWindowBlur);

    // 컴포넌트 언마운트 시 정리
    return () => {
      window.clearInterval(sceneSyncTimer);
      mediaQuery.removeEventListener('change', updateTouchMode);
      window.removeEventListener('blur', handleWindowBlur);
      virtualControls.reset();
      i18n.removeListener(handleLanguageChange);
      if (gameRef.current) {
        destroyGame(gameRef.current);
        gameRef.current = null;
      }
    };
  }, []);

  const handleLanguageToggle = (lang: Language) => {
    i18n.setLanguage(lang);
  };

  const createDirectionalHandlers = (direction: 'left' | 'right') => {
    const onDown = () => {
      if (direction === 'left') {
        virtualControls.setLeft(true);
        virtualControls.setRight(false);
      } else {
        virtualControls.setRight(true);
        virtualControls.setLeft(false);
      }
    };
    const onUp = () => {
      if (direction === 'left') {
        virtualControls.setLeft(false);
      } else {
        virtualControls.setRight(false);
      }
    };
    return { onDown, onUp };
  };

  const leftHandlers = createDirectionalHandlers('left');
  const rightHandlers = createDirectionalHandlers('right');

  const handleFireDown = () => {
    virtualControls.queueFire();
  };

  const handleCoinDown = () => {
    virtualControls.queueCoin();
  };

  const handleStartDown = () => {
    virtualControls.queueStart();
  };

  const isTitleScene = activeSceneKey === 'TitleScene';
  const isGameScene = activeSceneKey === 'GameScene';

  return (
    <div className={`app${showTouchControls ? ' mobile' : ''}`}>
      <div className="header">
        <h1>{i18n.get('headerTitle')}</h1>
      </div>
      <div id="game-container" />
      <div className="footer-controls">
        {showTouchControls && isTitleScene && (
          <div className="touch-controls main-controls">
            <button
              type="button"
              className="touch-btn touch-coin"
              onPointerDown={handleCoinDown}
            >
              COIN
            </button>
            <button
              type="button"
              className="touch-btn touch-start"
              onPointerDown={handleStartDown}
            >
              START
            </button>
          </div>
        )}
        {showTouchControls && isGameScene && (
          <div className="touch-controls game-controls">
            <button
              type="button"
              className="touch-btn touch-move"
              onPointerDown={leftHandlers.onDown}
              onPointerUp={leftHandlers.onUp}
              onPointerCancel={leftHandlers.onUp}
              onPointerLeave={leftHandlers.onUp}
            >
              LEFT
            </button>
            <button
              type="button"
              className="touch-btn touch-move"
              onPointerDown={rightHandlers.onDown}
              onPointerUp={rightHandlers.onUp}
              onPointerCancel={rightHandlers.onUp}
              onPointerLeave={rightHandlers.onUp}
            >
              RIGHT
            </button>
            <button
              type="button"
              className="touch-btn touch-fire"
              onPointerDown={handleFireDown}
            >
              FIRE
            </button>
          </div>
        )}
        {!isGameScene && (
          <div className="language-toggle">
            <button
              className={language === 'en' ? 'active' : ''}
              onClick={() => handleLanguageToggle('en')}
            >
              EN
            </button>
            <span className="divider">|</span>
            <button
              className={language === 'ko' ? 'active' : ''}
              onClick={() => handleLanguageToggle('ko')}
            >
              KO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
