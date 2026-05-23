/**
 * 점수 관리 시스템
 * Supabase를 사용할 수 있으면 전역 TOP 10을, 없거나 실패하면 localStorage를 사용합니다.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_RECENT = 'spaceInvaders_recentScore';
const STORAGE_KEY_TOP = 'spaceInvaders_topScores';
const MAX_TOP_SCORES = 10;
export const MAX_INITIALS_LENGTH = 10;
const DEFAULT_INITIALS = '-'.repeat(MAX_INITIALS_LENGTH);
const SCORE_TABLE = import.meta.env.VITE_SUPABASE_SCORE_TABLE || 'high_scores';

export interface ScoreEntry {
  initials: string;
  score: number;
}

interface ScoreRow {
  initials: string | null;
  score: number | null;
}

class ScoreManagerClass {
  private static instance: ScoreManagerClass;
  private recentScore: number = 0;
  private topScores: ScoreEntry[] = [];
  private supabase: SupabaseClient | null = null;

  private constructor() {
    this.supabase = this.createSupabaseClient();
    this.loadScores();
  }

  static getInstance(): ScoreManagerClass {
    if (!ScoreManagerClass.instance) {
      ScoreManagerClass.instance = new ScoreManagerClass();
    }
    return ScoreManagerClass.instance;
  }

  private createSupabaseClient(): SupabaseClient | null {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return null;
    }

    return createClient(url, anonKey);
  }

  private loadScores(): void {
    try {
      const recentStr = localStorage.getItem(STORAGE_KEY_RECENT);
      if (recentStr) {
        this.recentScore = parseInt(recentStr, 10) || 0;
      }

      const topStr = localStorage.getItem(STORAGE_KEY_TOP);
      if (topStr) {
        const parsed = JSON.parse(topStr) || [];
        this.topScores = this.normalizeEntries(parsed);
      }
    } catch {
      console.warn('Failed to load scores from localStorage');
      this.recentScore = 0;
      this.topScores = [];
    }
  }

  private normalizeEntries(value: unknown): ScoreEntry[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map(item => {
        if (typeof item === 'number') {
          return { initials: DEFAULT_INITIALS, score: item };
        }

        if (item && typeof item === 'object') {
          const record = item as Partial<ScoreEntry>;
          return {
            initials: this.normalizeInitials(record.initials),
            score: Number(record.score) || 0
          };
        }

        return null;
      })
      .filter((entry): entry is ScoreEntry => entry !== null && entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_TOP_SCORES);
  }

  private saveScores(): void {
    try {
      localStorage.setItem(STORAGE_KEY_RECENT, this.recentScore.toString());
      localStorage.setItem(STORAGE_KEY_TOP, JSON.stringify(this.topScores));
    } catch {
      console.warn('Failed to save scores to localStorage');
    }
  }

  private normalizeInitials(initials: unknown): string {
    if (typeof initials !== 'string') {
      return DEFAULT_INITIALS;
    }

    const normalized = initials.toUpperCase().replace(/[^A-Z]/g, '').slice(0, MAX_INITIALS_LENGTH);
    return normalized.padEnd(MAX_INITIALS_LENGTH, '-');
  }

  private cacheTopScores(scores: ScoreEntry[]): void {
    this.topScores = this.normalizeEntries(scores);
    this.saveScores();
  }

  private addLocalScore(score: number, initials: string): void {
    this.topScores.push({ initials: this.normalizeInitials(initials), score });
    this.cacheTopScores(this.topScores);
  }

  async refreshTopScores(): Promise<ScoreEntry[]> {
    if (!this.supabase) {
      return this.getTopScores();
    }

    const { data, error } = await this.supabase
      .from(SCORE_TABLE)
      .select('initials, score')
      .order('score', { ascending: false })
      .limit(MAX_TOP_SCORES);

    if (error) {
      console.warn('Failed to load scores from Supabase', error.message);
      return this.getTopScores();
    }

    const entries = (data as ScoreRow[] | null || []).map(row => ({
      initials: this.normalizeInitials(row.initials),
      score: Number(row.score) || 0
    }));

    this.cacheTopScores(entries);
    return this.getTopScores();
  }

  /**
   * 게임 종료 시 최근 점수만 먼저 기록합니다.
   */
  recordRecentScore(score: number): void {
    this.recentScore = score;
    this.saveScores();
  }

  /**
   * 하이스코어 이니셜과 점수를 기록합니다.
   */
  async submitHighScore(score: number, initials: string): Promise<void> {
    const normalizedInitials = this.normalizeInitials(initials);
    this.recentScore = score;

    if (this.supabase) {
      const { error } = await this.supabase
        .from(SCORE_TABLE)
        .insert({ initials: normalizedInitials, score });

      if (error) {
        console.warn('Failed to save score to Supabase', error.message);
      } else {
        await this.refreshTopScores();
        return;
      }
    }

    this.addLocalScore(score, normalizedInitials);
  }

  qualifiesForTopScore(score: number): boolean {
    if (score <= 0) {
      return false;
    }

    if (this.topScores.length < MAX_TOP_SCORES) {
      return true;
    }

    return score > this.topScores[this.topScores.length - 1].score;
  }

  async qualifiesForTopScoreAfterRefresh(score: number): Promise<boolean> {
    await this.refreshTopScores();
    return this.qualifiesForTopScore(score);
  }

  /**
   * 최근 점수 반환
   */
  getRecentScore(): number {
    return this.recentScore;
  }

  /**
   * TOP 10 점수 반환
   */
  getTopScores(): ScoreEntry[] {
    return [...this.topScores];
  }

  /**
   * 최고 점수 반환
   */
  getHighScore(): number {
    return this.topScores.length > 0 ? this.topScores[0].score : 0;
  }
}

export const ScoreManager = ScoreManagerClass.getInstance();
