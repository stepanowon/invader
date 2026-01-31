import Phaser from 'phaser';

// 원작 스페이스 인베이더의 정확한 픽셀 아트 정의 (좌우 대칭)
export const SpritePixels = {
  // 오징어 (Squid) - 30점 - 프레임 1
  squid1: [
    '    ████    ',
    '  ████████  ',
    ' ██████████ ',
    '███  ██  ███',
    '████████████',
    '  ██    ██  ',
    ' ██  ██  ██ ',
    '  ██    ██  '
  ],
  // 오징어 (Squid) - 프레임 2
  squid2: [
    '    ████    ',
    '  ████████  ',
    ' ██████████ ',
    '███  ██  ███',
    '████████████',
    '   ██  ██   ',
    ' ██      ██ ',
    '██        ██'
  ],

  // 게 (Crab) - 20점 - 프레임 1
  crab1: [
    '  ██    ██  ',
    '   ██  ██   ',
    ' ██████████ ',
    '███  ██  ███',
    '████████████',
    '██  ████  ██',
    '██        ██',
    '  ██    ██  '
  ],
  // 게 (Crab) - 프레임 2
  crab2: [
    '  ██    ██  ',
    '   ██  ██   ',
    ' ██████████ ',
    '███  ██  ███',
    '████████████',
    ' ██ ████ ██ ',
    ' ██      ██ ',
    '██        ██'
  ],

  // 문어 (Octopus) - 10점 - 프레임 1
  octopus1: [
    '    ████    ',
    ' ██████████ ',
    '████████████',
    '███  ██  ███',
    '████████████',
    '  ████████  ',
    ' ██  ██  ██ ',
    '██        ██'
  ],
  // 문어 (Octopus) - 프레임 2
  octopus2: [
    '    ████    ',
    ' ██████████ ',
    '████████████',
    '███  ██  ███',
    '████████████',
    '  ████████  ',
    '  ██    ██  ',
    '  ██    ██  '
  ],

  // 플레이어 대포
  player: [
    '     ██     ',
    '    ████    ',
    '    ████    ',
    '  ████████  ',
    '████████████',
    '████████████',
    '████████████'
  ],

  // UFO (Mystery Ship) - 1.5배 크기
  ufo: [
    '      █████████      ',
    '   ███████████████   ',
    '  ███████████████████',
    '███  ████  ████  ████',
    '   ██████████████    '
  ],

  // 총알 (플레이어)
  bullet: [
    '██',
    '██',
    '██',
    '██'
  ],

  // 총알 (적) - 타입 1 (지그재그)
  enemyBullet1: [
    ' ██ ',
    '████',
    ' ██ ',
    '████'
  ],
  // 총알 (적) - 타입 2 (번개)
  enemyBullet2: [
    '██  ',
    '  ██',
    '██  ',
    '  ██'
  ],
  // 총알 (적) - 타입 3 (십자)
  enemyBullet3: [
    ' ██ ',
    '████',
    '████',
    ' ██ '
  ],

  // 생명 아이콘 (플레이어와 동일)
  life: [
    '     ██     ',
    '    ████    ',
    '    ████    ',
    '  ████████  ',
    '████████████',
    '████████████',
    '████████████'
  ]
};

export class PixelSpriteGenerator {
  /**
   * 픽셀 배열로부터 텍스처 생성
   */
  static generateTexture(
    scene: Phaser.Scene,
    key: string,
    pixels: string[],
    color: number = 0xFFFFFF,
    pixelSize: number = 2
  ): void {
    const height = pixels.length;
    const width = Math.max(...pixels.map(row => row.length));

    const graphics = scene.add.graphics();
    graphics.fillStyle(color, 1);

    for (let y = 0; y < height; y++) {
      const row = pixels[y];
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== ' ') {
          graphics.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    graphics.generateTexture(key, width * pixelSize, height * pixelSize);
    graphics.destroy();
  }

  /**
   * 모든 게임 스프라이트 생성
   */
  static generateAllSprites(scene: Phaser.Scene): void {
    const GREEN = 0x00FF00; // 원작 아케이드 모니터 색상
    const WHITE = 0xFFFFFF;

    // 오징어 애니메이션 프레임 (흰색)
    this.generateTexture(scene, 'squid1', SpritePixels.squid1, WHITE);
    this.generateTexture(scene, 'squid2', SpritePixels.squid2, WHITE);

    // 게 애니메이션 프레임 (흰색)
    this.generateTexture(scene, 'crab1', SpritePixels.crab1, WHITE);
    this.generateTexture(scene, 'crab2', SpritePixels.crab2, WHITE);

    // 문어 애니메이션 프레임 (녹색 - 이미지에서 녹색)
    this.generateTexture(scene, 'octopus1', SpritePixels.octopus1, GREEN);
    this.generateTexture(scene, 'octopus2', SpritePixels.octopus2, GREEN);

    // 플레이어 (1.3배 크기)
    this.generateTexture(scene, 'player', SpritePixels.player, GREEN, 2.6);

    // 생명 아이콘 (플레이어와 동일 크기)
    this.generateTexture(scene, 'life', SpritePixels.life, GREEN, 2.6);

    // UFO (1.3배 크기)
    this.generateTexture(scene, 'ufo', SpritePixels.ufo, 0xFF0000, 2.6); // 빨간색

    // 총알
    this.generateTexture(scene, 'bullet', SpritePixels.bullet, WHITE);
    this.generateTexture(scene, 'enemyBullet1', SpritePixels.enemyBullet1, WHITE);
    this.generateTexture(scene, 'enemyBullet2', SpritePixels.enemyBullet2, WHITE);
    this.generateTexture(scene, 'enemyBullet3', SpritePixels.enemyBullet3, WHITE);

    // 폭발 효과
    scene.add.graphics().fillStyle(0xFFFFFF, 1).fillCircle(8, 8, 8)
      .generateTexture('explosion', 16, 16).destroy();
  }
}

// 적 타입 정의
export enum EnemyType {
  SQUID = 'squid',
  CRAB = 'crab',
  OCTOPUS = 'octopus'
}

export const EnemyConfig = {
  [EnemyType.SQUID]: {
    points: 30,
    frames: ['squid1', 'squid2']
  },
  [EnemyType.CRAB]: {
    points: 20,
    frames: ['crab1', 'crab2']
  },
  [EnemyType.OCTOPUS]: {
    points: 10,
    frames: ['octopus1', 'octopus2']
  }
};
