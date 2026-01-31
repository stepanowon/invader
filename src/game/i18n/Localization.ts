/**
 * 다국어 지원 시스템
 */

export type Language = 'en' | 'ko';

interface LocaleStrings {
  // 타이틀 화면
  title: string;
  controls: string;
  scoreAdvanceTable: string;
  mystery: string;
  points: string;
  insertCoin: string;
  pressSpace: string;

  // 게임 화면
  score: string;
  hiScore: string;
  lives: string;
  gameOver: string;

  // 점수 표시
  score1: string;
  score2: string;

  // 헤더 (App.tsx)
  headerTitle: string;
  move: string;
  fire: string;
  insertCoinKey: string;

  // 타이틀 화면 점수
  recentScore: string;
  topScores: string;
}

const locales: Record<Language, LocaleStrings> = {
  en: {
    // Title screen
    title: 'Space Invaders',
    controls: '← → : MOVE    SPACE : FIRE',
    scoreAdvanceTable: '*SCORE ADVANCE TABLE*',
    mystery: '= ? MYSTERY',
    points: 'POINTS',
    insertCoin: 'INSERT COIN',
    pressSpace: 'PRESS SPACE TO START',

    // Game screen
    score: 'SCORE',
    hiScore: 'HI-SCORE',
    lives: 'LIVES',
    gameOver: 'GAME OVER',

    // Score display
    score1: 'SCORE<1>',
    score2: 'SCORE<2>',

    // Header (App.tsx)
    headerTitle: 'Space Invaders',
    move: 'MOVE',
    fire: 'FIRE',
    insertCoinKey: 'INSERT COIN',

    // Title screen scores
    recentScore: 'LAST SCORE',
    topScores: 'TOP 5',
  },
  ko: {
    // 타이틀 화면
    title: '스페이스 인베이더',
    controls: '← → : 이동    SPACE : 발사',
    scoreAdvanceTable: '*점수표*',
    mystery: '= ? 미스터리',
    points: '점',
    insertCoin: '코인을 넣어주세요',
    pressSpace: 'SPACE를 눌러 시작',

    // 게임 화면
    score: '점수',
    hiScore: '최고점수',
    lives: '목숨',
    gameOver: '게임 오버',

    // 점수 표시
    score1: '점수<1>',
    score2: '점수<2>',

    // 헤더 (App.tsx)
    headerTitle: '스페이스 인베이더',
    move: '이동',
    fire: '발사',
    insertCoinKey: '코인 투입',

    // 타이틀 화면 점수
    recentScore: '최근 점수',
    topScores: 'TOP 5',
  }
};

class LocalizationManager {
  private static instance: LocalizationManager;
  private currentLanguage: Language = 'en';
  private listeners: (() => void)[] = [];

  private constructor() {
    // 브라우저 언어 감지
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ko')) {
      this.currentLanguage = 'ko';
    }
  }

  static getInstance(): LocalizationManager {
    if (!LocalizationManager.instance) {
      LocalizationManager.instance = new LocalizationManager();
    }
    return LocalizationManager.instance;
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(lang: Language): void {
    if (this.currentLanguage !== lang) {
      this.currentLanguage = lang;
      this.notifyListeners();
    }
  }

  toggleLanguage(): Language {
    this.currentLanguage = this.currentLanguage === 'en' ? 'ko' : 'en';
    this.notifyListeners();
    return this.currentLanguage;
  }

  get(key: keyof LocaleStrings): string {
    return locales[this.currentLanguage][key];
  }

  getPointsText(points: number): string {
    if (this.currentLanguage === 'ko') {
      return `= ${points}${this.get('points')}`;
    }
    return `= ${points} ${this.get('points')}`;
  }

  // 언어 변경 시 콜백 등록
  onLanguageChange(callback: () => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: () => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export const i18n = LocalizationManager.getInstance();
