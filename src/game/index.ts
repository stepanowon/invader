import Phaser from 'phaser';
import { gameConfig } from './config';

export function startGame(parent: string): Phaser.Game {
  return new Phaser.Game({ ...gameConfig, parent });
}

export function destroyGame(game: Phaser.Game) {
  game.destroy(true);
}
