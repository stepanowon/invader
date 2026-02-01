import Phaser from 'phaser';
import { ThemeManager } from '../settings/ThemeManager';

/**
 * 방어막 (쉘터) 클래스
 * 총알에 맞으면 픽셀 단위로 파괴됨
 */
export class Shelter {
  private x: number;
  private y: number;
  private graphics: Phaser.GameObjects.Graphics;
  private hitbox: Phaser.Physics.Arcade.Sprite;
  private pixelSize: number = 4.05; // 1.35배 크기 (1.5 * 0.9)
  private pixels: boolean[][] = [];
  private width: number = 22;
  private height: number = 16;

  // 방어막 모양 (1 = 블록 있음, 0 = 없음)
  private shelterShape = [
    '0001111111111111110000',
    '0011111111111111111000',
    '0111111111111111111100',
    '1111111111111111111110',
    '1111111111111111111111',
    '1111111111111111111111',
    '1111111111111111111111',
    '1111111111111111111111',
    '1111111111111111111111',
    '1111111111111111111111',
    '1111110000000001111111',
    '1111100000000000111111',
    '1111000000000000011111',
    '1110000000000000001111',
    '1110000000000000001111',
    '1110000000000000001111'
  ];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // x는 진지의 중앙 기준으로 받음, 실제 그리기는 좌측 상단부터
    const shelterWidth = this.width * this.pixelSize;
    this.x = x - shelterWidth / 2;
    this.y = y;

    // 픽셀 배열 초기화
    this.initializePixels();

    // 그래픽 객체 생성
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);

    // 충돌 감지용 스프라이트 (투명)
    this.hitbox = scene.physics.add.sprite(this.x, y, '');
    this.hitbox.setDisplaySize(
      this.width * this.pixelSize,
      this.height * this.pixelSize
    );
    this.hitbox.setOrigin(0, 0);
    if (this.hitbox.body) {
      (this.hitbox.body as Phaser.Physics.Arcade.Body).immovable = true;
    }
    this.hitbox.setAlpha(0); // 완전히 투명하게

    this.draw();
  }

  private initializePixels(): void {
    for (let y = 0; y < this.height; y++) {
      this.pixels[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.pixels[y][x] = this.shelterShape[y][x] === '1';
      }
    }
  }

  private draw(): void {
    this.graphics.clear();
    const theme = ThemeManager.getTheme();
    this.graphics.fillStyle(theme.shelter, 1);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.pixels[y][x]) {
          this.graphics.fillRect(
            this.x + x * this.pixelSize,
            this.y + y * this.pixelSize,
            this.pixelSize,
            this.pixelSize
          );
        }
      }
    }
  }

  /**
   * 해당 위치에 픽셀이 있는지 확인
   */
  hasPixelAt(bulletX: number, bulletY: number): boolean {
    const localX = Math.floor((bulletX - this.x) / this.pixelSize);
    const localY = Math.floor((bulletY - this.y) / this.pixelSize);

    // 범위 체크
    if (localX < 0 || localX >= this.width || localY < 0 || localY >= this.height) {
      return false;
    }

    // 해당 위치 또는 주변에 픽셀이 있는지 확인
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const px = localX + dx;
        const py = localY + dy;
        if (
          px >= 0 && px < this.width &&
          py >= 0 && py < this.height &&
          this.pixels[py][px]
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 총알이 맞았을 때 픽셀 파괴
   */
  hit(bulletX: number, bulletY: number, radius: number = 4): boolean {
    const localX = Math.floor((bulletX - this.x) / this.pixelSize);
    const localY = Math.floor((bulletY - this.y) / this.pixelSize);

    let destroyed = false;

    // 반경 내의 픽셀 파괴
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = localX + dx;
        const py = localY + dy;

        if (
          px >= 0 &&
          px < this.width &&
          py >= 0 &&
          py < this.height &&
          dx * dx + dy * dy <= radius * radius
        ) {
          if (this.pixels[py][px]) {
            this.pixels[py][px] = false;
            destroyed = true;
          }
        }
      }
    }

    if (destroyed) {
      this.draw();
    }
    return destroyed;
  }

  /**
   * 방어막이 완전히 파괴되었는지 확인
   */
  isDestroyed(): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.pixels[y][x]) {
          return false;
        }
      }
    }
    return true;
  }

  getHitbox(): Phaser.Physics.Arcade.Sprite {
    return this.hitbox;
  }

  destroy(): void {
    this.graphics.destroy();
    this.hitbox.destroy();
  }
}
