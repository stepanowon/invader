/**
 * 컬러 테마 매니저
 * 다양한 색상 테마 지원
 */

export interface ColorTheme {
  name: string;
  background: string;
  // 스프라이트 색상 (hex number)
  player: number;
  enemy1: number;      // 오징어
  enemy2: number;      // 게
  enemy3: number;      // 문어
  ufo: number;
  bullet: number;
  enemyBullet: number;
  shelter: number;
  explosion: number;
  // UI 색상 (CSS hex string)
  textPrimary: string;
  textSecondary: string;
  textHighlight: string;
  textWarning: string;
  textScore: string;
  textStage: string;
}

const THEMES: { [key: string]: ColorTheme } = {
  classic: {
    name: 'Classic',
    background: '#000000',
    player: 0x00FF00,
    enemy1: 0xFFFFFF,
    enemy2: 0xFFFFFF,
    enemy3: 0x00FF00,
    ufo: 0xFF0000,
    bullet: 0xFFFFFF,
    enemyBullet: 0xFFFFFF,
    shelter: 0x00FF00,
    explosion: 0xFFFFFF,
    textPrimary: '#FFFFFF',
    textSecondary: '#888888',
    textHighlight: '#FFFF00',
    textWarning: '#FF0000',
    textScore: '#00FF00',
    textStage: '#FFFF00'
  },
  neon: {
    name: 'Neon',
    background: '#0a0a1a',
    player: 0x00FFFF,
    enemy1: 0xFF00FF,
    enemy2: 0xFFFF00,
    enemy3: 0x00FF00,
    ufo: 0xFF0080,
    bullet: 0x00FFFF,
    enemyBullet: 0xFF00FF,
    shelter: 0x00FFFF,
    explosion: 0xFFFFFF,
    textPrimary: '#FFFFFF',
    textSecondary: '#8080FF',
    textHighlight: '#00FFFF',
    textWarning: '#FF0080',
    textScore: '#00FF00',
    textStage: '#FF00FF'
  },
  retro: {
    name: 'Retro',
    background: '#1a0a00',
    player: 0xFFAA00,
    enemy1: 0xFF6600,
    enemy2: 0xFFCC00,
    enemy3: 0xFF8800,
    ufo: 0xFF0000,
    bullet: 0xFFFF00,
    enemyBullet: 0xFF6600,
    shelter: 0xFFAA00,
    explosion: 0xFFFFFF,
    textPrimary: '#FFCC88',
    textSecondary: '#996644',
    textHighlight: '#FFFF00',
    textWarning: '#FF4400',
    textScore: '#FFAA00',
    textStage: '#FF6600'
  },
  ocean: {
    name: 'Ocean',
    background: '#000820',
    player: 0x00AAFF,
    enemy1: 0x0088CC,
    enemy2: 0x00CCFF,
    enemy3: 0x0066AA,
    ufo: 0xFF6600,
    bullet: 0x00FFFF,
    enemyBullet: 0x00AAFF,
    shelter: 0x0088CC,
    explosion: 0xFFFFFF,
    textPrimary: '#88CCFF',
    textSecondary: '#446688',
    textHighlight: '#00FFFF',
    textWarning: '#FF6600',
    textScore: '#00AAFF',
    textStage: '#00CCFF'
  },
  sunset: {
    name: 'Sunset',
    background: '#1a0010',
    player: 0xFF6688,
    enemy1: 0xFF4466,
    enemy2: 0xFF8844,
    enemy3: 0xFFAA66,
    ufo: 0xFFFF00,
    bullet: 0xFFCCDD,
    enemyBullet: 0xFF8866,
    shelter: 0xFF6688,
    explosion: 0xFFFFFF,
    textPrimary: '#FFCCDD',
    textSecondary: '#AA6688',
    textHighlight: '#FFFF88',
    textWarning: '#FF4444',
    textScore: '#FF8888',
    textStage: '#FF6688'
  },
  matrix: {
    name: 'Matrix',
    background: '#000800',
    player: 0x00FF00,
    enemy1: 0x00CC00,
    enemy2: 0x00FF00,
    enemy3: 0x00AA00,
    ufo: 0x00FF00,
    bullet: 0x00FF00,
    enemyBullet: 0x00CC00,
    shelter: 0x008800,
    explosion: 0x00FF00,
    textPrimary: '#00FF00',
    textSecondary: '#006600',
    textHighlight: '#00FF00',
    textWarning: '#00FF00',
    textScore: '#00FF00',
    textStage: '#00FF00'
  }
};

const STORAGE_KEY = 'spaceInvaders_theme';
const DEFAULT_THEME = 'classic';

class ThemeManagerClass {
  private static instance: ThemeManagerClass;
  private currentTheme: string;
  private listeners: (() => void)[] = [];

  private constructor() {
    this.currentTheme = this.loadTheme();
  }

  static getInstance(): ThemeManagerClass {
    if (!ThemeManagerClass.instance) {
      ThemeManagerClass.instance = new ThemeManagerClass();
    }
    return ThemeManagerClass.instance;
  }

  private loadTheme(): string {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES[saved]) {
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load theme');
    }
    return DEFAULT_THEME;
  }

  private saveTheme(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.currentTheme);
    } catch (e) {
      console.warn('Failed to save theme');
    }
  }

  getTheme(): ColorTheme {
    return THEMES[this.currentTheme];
  }

  getThemeName(): string {
    return this.currentTheme;
  }

  getThemeDisplayName(): string {
    return THEMES[this.currentTheme].name;
  }

  setTheme(themeName: string): void {
    if (THEMES[themeName]) {
      this.currentTheme = themeName;
      this.saveTheme();
      this.notifyListeners();
    }
  }

  getAvailableThemes(): string[] {
    return Object.keys(THEMES);
  }

  getThemeNames(): { id: string; name: string }[] {
    return Object.entries(THEMES).map(([id, theme]) => ({
      id,
      name: theme.name
    }));
  }

  nextTheme(): string {
    const themes = this.getAvailableThemes();
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
    return themes[nextIndex];
  }

  prevTheme(): string {
    const themes = this.getAvailableThemes();
    const currentIndex = themes.indexOf(this.currentTheme);
    const prevIndex = (currentIndex - 1 + themes.length) % themes.length;
    this.setTheme(themes[prevIndex]);
    return themes[prevIndex];
  }

  onChange(callback: () => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: () => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export const ThemeManager = ThemeManagerClass.getInstance();
