/**
 * 키보드 커스터마이징 매니저
 * localStorage를 사용하여 키 바인딩 저장
 */

export interface KeyBindings {
  moveLeft: string;
  moveRight: string;
  fire: string;
  insertCoin: string;
}

const STORAGE_KEY = 'spaceInvaders_keyBindings';

const DEFAULT_BINDINGS: KeyBindings = {
  moveLeft: 'LEFT',
  moveRight: 'RIGHT',
  fire: 'SPACE',
  insertCoin: 'C'
};

// Phaser 키 코드 매핑
export const KEY_DISPLAY_NAMES: { [key: string]: string } = {
  'LEFT': '←',
  'RIGHT': '→',
  'UP': '↑',
  'DOWN': '↓',
  'SPACE': 'SPACE',
  'ENTER': 'ENTER',
  'SHIFT': 'SHIFT',
  'CTRL': 'CTRL',
  'ALT': 'ALT',
  'TAB': 'TAB',
  'ESC': 'ESC',
  'BACKSPACE': 'BACK',
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E',
  'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J',
  'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O',
  'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T',
  'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
  'ZERO': '0', 'ONE': '1', 'TWO': '2', 'THREE': '3', 'FOUR': '4',
  'FIVE': '5', 'SIX': '6', 'SEVEN': '7', 'EIGHT': '8', 'NINE': '9',
  'NUMPAD_ZERO': 'NUM0', 'NUMPAD_ONE': 'NUM1', 'NUMPAD_TWO': 'NUM2',
  'NUMPAD_THREE': 'NUM3', 'NUMPAD_FOUR': 'NUM4', 'NUMPAD_FIVE': 'NUM5',
  'NUMPAD_SIX': 'NUM6', 'NUMPAD_SEVEN': 'NUM7', 'NUMPAD_EIGHT': 'NUM8',
  'NUMPAD_NINE': 'NUM9'
};

// 브라우저 키 코드를 Phaser 키 이름으로 변환
export function browserKeyToPhaserKey(event: KeyboardEvent): string | null {
  const { code, key } = event;

  // 특수 키 처리
  if (code === 'ArrowLeft') return 'LEFT';
  if (code === 'ArrowRight') return 'RIGHT';
  if (code === 'ArrowUp') return 'UP';
  if (code === 'ArrowDown') return 'DOWN';
  if (code === 'Space') return 'SPACE';
  if (code === 'Enter') return 'ENTER';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
  if (code === 'ControlLeft' || code === 'ControlRight') return 'CTRL';
  if (code === 'AltLeft' || code === 'AltRight') return 'ALT';
  if (code === 'Tab') return 'TAB';
  if (code === 'Escape') return 'ESC';
  if (code === 'Backspace') return 'BACKSPACE';

  // 알파벳 키
  if (code.startsWith('Key')) {
    return code.replace('Key', '');
  }

  // 숫자 키
  if (code.startsWith('Digit')) {
    const num = code.replace('Digit', '');
    const numNames = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    return numNames[parseInt(num)];
  }

  // 넘패드 키
  if (code.startsWith('Numpad')) {
    const num = code.replace('Numpad', '');
    if (!isNaN(parseInt(num))) {
      const numNames = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
      return 'NUMPAD_' + numNames[parseInt(num)];
    }
  }

  // 기타 키는 대문자로 반환
  if (key.length === 1) {
    return key.toUpperCase();
  }

  return null;
}

class KeyBindingManagerClass {
  private static instance: KeyBindingManagerClass;
  private bindings: KeyBindings;
  private listeners: (() => void)[] = [];

  private constructor() {
    this.bindings = this.loadBindings();
  }

  static getInstance(): KeyBindingManagerClass {
    if (!KeyBindingManagerClass.instance) {
      KeyBindingManagerClass.instance = new KeyBindingManagerClass();
    }
    return KeyBindingManagerClass.instance;
  }

  private loadBindings(): KeyBindings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_BINDINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load key bindings');
    }
    return { ...DEFAULT_BINDINGS };
  }

  private saveBindings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bindings));
    } catch (e) {
      console.warn('Failed to save key bindings');
    }
  }

  getBindings(): KeyBindings {
    return { ...this.bindings };
  }

  getBinding(action: keyof KeyBindings): string {
    return this.bindings[action];
  }

  setBinding(action: keyof KeyBindings, key: string): void {
    this.bindings[action] = key;
    this.saveBindings();
    this.notifyListeners();
  }

  resetToDefaults(): void {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.saveBindings();
    this.notifyListeners();
  }

  getDisplayName(action: keyof KeyBindings): string {
    const key = this.bindings[action];
    return KEY_DISPLAY_NAMES[key] || key;
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

export const KeyBindingManager = KeyBindingManagerClass.getInstance();
