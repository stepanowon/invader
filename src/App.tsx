import { useEffect, useRef, useState } from 'react';
import { startGame, destroyGame } from './game';
import { i18n, type Language } from './game/i18n/Localization';
import './App.css';

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [language, setLanguage] = useState<Language>(i18n.getLanguage());

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

    // 컴포넌트 언마운트 시 정리
    return () => {
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

  return (
    <div className="app">
      <div className="header">
        <h1>{i18n.get('headerTitle')}</h1>
      </div>
      <div id="game-container" />
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
    </div>
  );
}

export default App;
