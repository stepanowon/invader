/**
 * 점수 관리 시스템
 * localStorage를 사용하여 최근 점수와 최고 점수를 저장
 */

const STORAGE_KEY_RECENT = 'spaceInvaders_recentScore';
const STORAGE_KEY_TOP = 'spaceInvaders_topScores';
const MAX_TOP_SCORES = 5;

class ScoreManagerClass {
  private static instance: ScoreManagerClass;
  private recentScore: number = 0;
  private topScores: number[] = [];

  private constructor() {
    this.loadScores();
  }

  static getInstance(): ScoreManagerClass {
    if (!ScoreManagerClass.instance) {
      ScoreManagerClass.instance = new ScoreManagerClass();
    }
    return ScoreManagerClass.instance;
  }

  private loadScores(): void {
    try {
      const recentStr = localStorage.getItem(STORAGE_KEY_RECENT);
      if (recentStr) {
        this.recentScore = parseInt(recentStr, 10) || 0;
      }

      const topStr = localStorage.getItem(STORAGE_KEY_TOP);
      if (topStr) {
        this.topScores = JSON.parse(topStr) || [];
      }
    } catch (e) {
      console.warn('Failed to load scores from localStorage');
      this.recentScore = 0;
      this.topScores = [];
    }
  }

  private saveScores(): void {
    try {
      localStorage.setItem(STORAGE_KEY_RECENT, this.recentScore.toString());
      localStorage.setItem(STORAGE_KEY_TOP, JSON.stringify(this.topScores));
    } catch (e) {
      console.warn('Failed to save scores to localStorage');
    }
  }

  /**
   * 게임 종료 시 점수 기록
   */
  recordScore(score: number): void {
    console.log('[ScoreManager] Recording score:', score);
    this.recentScore = score;

    // TOP 5에 추가
    this.topScores.push(score);
    this.topScores.sort((a, b) => b - a); // 내림차순 정렬
    this.topScores = this.topScores.slice(0, MAX_TOP_SCORES); // 상위 5개만 유지

    this.saveScores();
    console.log('[ScoreManager] Saved scores. Recent:', this.recentScore, 'Top:', this.topScores);
  }

  /**
   * 최근 점수 반환
   */
  getRecentScore(): number {
    return this.recentScore;
  }

  /**
   * TOP 5 점수 반환
   */
  getTopScores(): number[] {
    return [...this.topScores];
  }

  /**
   * 최고 점수 반환
   */
  getHighScore(): number {
    return this.topScores.length > 0 ? this.topScores[0] : 0;
  }
}

export const ScoreManager = ScoreManagerClass.getInstance();
