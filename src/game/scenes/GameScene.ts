import Phaser from 'phaser';
import { PixelSpriteGenerator, EnemyType, EnemyConfig } from '../sprites/PixelSprites';
import { Shelter } from '../sprites/Shelter';
import { SoundManager } from '../audio/SoundManager';
import { i18n } from '../i18n/Localization';
import { ScoreManager } from '../score/ScoreManager';

interface Enemy extends Phaser.Physics.Arcade.Sprite {
  enemyType?: EnemyType;
  animFrame?: number;
}

export class GameScene extends Phaser.Scene {
  // 플레이어
  private player!: Phaser.Physics.Arcade.Sprite;
  private lives: number = 3;
  private canShoot: boolean = true;
  private isInvincible: boolean = false;
  private isRespawning: boolean = false;
  private respawnTimer: number = 0;
  private invincibleTimer: number = 0;
  private explosionSprite?: Phaser.GameObjects.Sprite;

  // 입력
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // 적
  private invaders!: Phaser.Physics.Arcade.Group;
  private invaderDirection: number = 1;
  private invaderSpeed: number = 10;
  private baseSpeed: number = 10;
  private invaderMoveTimer: number = 0;
  private invaderMoveDelay: number = 1000; // ms
  private animationTimer: number = 0;
  private currentFrame: number = 0;

  // UFO
  private ufo?: Phaser.Physics.Arcade.Sprite;
  private ufoTimer: number = 0;
  private ufoSpawnDelay: number = 25000; // 25초마다

  // 총알
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemyShootTimer: number = 0;

  // 방어막
  private shelters: Shelter[] = [];

  // UI
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private gameOverText?: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;

  // 사운드
  private soundManager!: SoundManager;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // 사운드 매니저 초기화
    this.soundManager = SoundManager.getInstance();

    // 게임 상태 초기화 (씬 재시작 시 필수!)
    this.lives = 3;
    this.score = 0;
    this.isGameOver = false;
    this.isRespawning = false;
    this.isInvincible = false;
    this.respawnTimer = 0;
    this.invincibleTimer = 0;
    this.canShoot = true;
    this.invaderDirection = 1;
    this.invaderSpeed = 10;
    this.invaderMoveTimer = 0;
    this.animationTimer = 0;
    this.currentFrame = 0;
    this.ufoTimer = 0;
    this.enemyShootTimer = 0;
    this.shelters = [];
    this.explosionSprite = undefined;
    this.ufo = undefined;

    // 배경색
    this.cameras.main.setBackgroundColor('#000000');

    // 스프라이트 생성
    PixelSpriteGenerator.generateAllSprites(this);

    // 플레이어 생성
    this.createPlayer();

    // 적 생성
    this.createInvaders();

    // 방어막 생성
    this.createShelters();

    // 총알 그룹 생성
    this.playerBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    });

    this.enemyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    });

    // 입력 설정
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // UI 생성
    this.createUI();

    // 충돌 설정
    this.setupCollisions();
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(400, 550, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(100);
  }

  private createInvaders(): void {
    this.invaders = this.physics.add.group();

    const cols = 11;
    const startX = 150;
    const startY = 80;
    const spacingX = 48;
    const spacingY = 40;

    // 원작 배치: 1행 오징어, 2-3행 게, 4-5행 문어
    const layout = [
      { rows: 1, type: EnemyType.SQUID },
      { rows: 2, type: EnemyType.CRAB },
      { rows: 2, type: EnemyType.OCTOPUS }
    ];

    let currentRow = 0;
    layout.forEach(({ rows, type }) => {
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + col * spacingX;
          const y = startY + currentRow * spacingY;

          const enemy = this.invaders.create(x, y, `${type}1`) as Enemy;
          enemy.enemyType = type;
          enemy.animFrame = 0;
          enemy.setData('col', col);
          enemy.setData('row', currentRow);
        }
        currentRow++;
      }
    });
  }

  private createShelters(): void {
    const shelterY = 460;
    // 화면 중앙(400) 기준 좌우 대칭 배치 (간격 200)
    const positions = [100, 300, 500, 700];

    positions.forEach(x => {
      const shelter = new Shelter(this, x, shelterY);
      this.shelters.push(shelter);
    });
  }

  private createUI(): void {
    // 점수 표시 (상단 좌측)
    this.add.text(16, 16, i18n.get('score'), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#FFFFFF'
    });

    this.scoreText = this.add.text(16, 36, `${this.score}`.padStart(4, '0'), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#FFFFFF'
    });

    // 생명 표시 (하단 좌측)
    this.add.text(16, 570, i18n.get('lives'), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00FF00'
    });

    // 생명 아이콘 표시
    this.updateLivesDisplay();
  }

  private updateLivesDisplay(): void {
    // 기존 생명 아이콘 제거
    const existingIcons = this.children.getAll().filter((child: any) =>
      child.getData && child.getData('lifeIcon')
    );
    existingIcons.forEach(icon => icon.destroy());

    // 생명 아이콘 그리기
    for (let i = 0; i < this.lives; i++) {
      const icon = this.add.sprite(100 + i * 35, 575, 'life');
      icon.setData('lifeIcon', true);
    }
  }

  private setupCollisions(): void {
    // 플레이어 총알 vs 적
    this.physics.add.overlap(
      this.playerBullets,
      this.invaders,
      this.hitInvader as any,
      undefined,
      this
    );

    // 적 총알 vs 플레이어: checkEnemyBulletCollision()에서 수동 체크

    // 플레이어 총알 vs UFO: spawnUFO()에서 UFO 생성 시 설정
  }

  update(time: number, delta: number): void {
    if (this.isGameOver) return;

    // 리스폰 처리
    if (this.isRespawning) {
      this.respawnTimer += delta;

      // 1초 후 리스폰
      if (this.respawnTimer >= 1000) {
        // 폭발 효과 제거
        if (this.explosionSprite) {
          this.explosionSprite.destroy();
          this.explosionSprite = undefined;
        }

        // 기존 플레이어 제거 후 새로 생성
        if (this.player) {
          this.player.destroy();
        }
        this.player = this.physics.add.sprite(400, 550, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(100);

        // 적 총알 충돌은 checkEnemyBulletCollision()에서 수동 체크

        // 무적 시간 시작
        this.isInvincible = true;
        this.invincibleTimer = 0;
        this.isRespawning = false;
      }
    }

    // 무적 시간 처리
    if (this.isInvincible && this.player) {
      this.invincibleTimer += delta;

      // 깜빡임 효과
      const blinkInterval = 200;
      const shouldShow = Math.floor(this.invincibleTimer / blinkInterval) % 2 === 0;
      this.player.setAlpha(shouldShow ? 1 : 0.3);

      // 2초 후 무적 해제
      if (this.invincibleTimer >= 2000) {
        this.isInvincible = false;
        this.player.setAlpha(1);
      }
    }

    // 플레이어 이동 (리스폰 중이 아닐 때만)
    if (!this.isRespawning) {
      this.handlePlayerInput();
    }

    // 적 폭탄-플레이어 충돌 체크 (매 프레임)
    this.checkEnemyBulletCollision();

    // 적 이동 (항상 실행)
    this.updateInvaders(time, delta);

    // 적 애니메이션 (항상 실행)
    this.updateInvaderAnimation(time);

    // 적 발사 (항상 실행)
    this.updateEnemyShooting(time);

    // UFO 업데이트 (항상 실행)
    this.updateUFO(time);

    // UFO 충돌 체크 (항상 실행)
    this.checkUFOCollision();

    // 방어막 충돌 체크 (항상 실행)
    this.checkShelterCollisions();

    // 총알 정리 (항상 실행)
    this.cleanupBullets();

    // 게임 오버 체크 (항상 실행)
    this.checkGameOver();
  }

  private handlePlayerInput(): void {
    // 플레이어나 body가 없으면 무시
    if (!this.player || !this.player.body) return;

    // 리스폰 중이거나 게임 오버 상태면 입력 무시
    if (this.isRespawning || this.isGameOver) {
      return;
    }

    // body가 활성화되어 있을 때만 이동
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body.enable) return;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    // 발사 (한 번에 한 발만)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.canShoot) {
      this.shootPlayerBullet();
    }
  }

  private shootPlayerBullet(): void {
    // 플레이어 체크
    if (!this.player || !this.player.active) return;

    const activeBullets = this.playerBullets.getChildren().filter(
      (b: any) => b.active
    );

    if (activeBullets.length === 0) {
      const bullet = this.playerBullets.create(
        this.player.x,
        this.player.y - 20,
        'bullet'
      ) as Phaser.Physics.Arcade.Sprite;

      bullet.setVelocityY(-300);
      this.canShoot = false;
      this.soundManager.playShoot();

      this.time.delayedCall(500, () => {
        this.canShoot = true;
      });
    }
  }

  private updateInvaders(time: number, delta: number): void {
    this.invaderMoveTimer += delta;

    // 속도 계산: 적이 적을수록 빨라짐
    const totalInvaders = 55; // 5행 x 11열
    const remaining = this.invaders.getLength();
    const speedMultiplier = 1 + (totalInvaders - remaining) * 0.05;
    const currentDelay = this.invaderMoveDelay / speedMultiplier;

    if (this.invaderMoveTimer >= currentDelay) {
      this.moveInvaders();
      this.invaderMoveTimer = 0;
    }
  }

  private moveInvaders(): void {
    let shouldMoveDown = false;
    let changeDirection = false;

    const children = this.invaders.getChildren() as Enemy[];

    // 경계 체크
    children.forEach(invader => {
      if (!invader || !invader.active) return;
      const nextX = invader.x + (this.invaderSpeed * this.invaderDirection);
      if (nextX > 750 || nextX < 50) {
        shouldMoveDown = true;
        changeDirection = true;
      }
    });

    if (changeDirection) {
      this.invaderDirection *= -1;
    }

    // 이동
    children.forEach(invader => {
      if (!invader || !invader.active) return;
      invader.x += this.invaderSpeed * this.invaderDirection;
      if (shouldMoveDown) {
        invader.y += 16;
      }
    });

    // 적 이동 사운드
    this.soundManager.playInvaderMove();
  }

  private updateInvaderAnimation(time: number): void {
    this.animationTimer += this.game.loop.delta;

    if (this.animationTimer >= 500) {
      this.currentFrame = 1 - this.currentFrame;

      const children = this.invaders.getChildren() as Enemy[];
      children.forEach(invader => {
        if (invader && invader.active && invader.enemyType) {
          const frames = EnemyConfig[invader.enemyType].frames;
          invader.setTexture(frames[this.currentFrame]);
        }
      });

      this.animationTimer = 0;
    }
  }

  private updateEnemyShooting(time: number): void {
    this.enemyShootTimer += this.game.loop.delta;

    if (this.enemyShootTimer >= 1000) {
      this.shootEnemyBullet();
      this.enemyShootTimer = 0;
    }
  }

  private shootEnemyBullet(): void {
    const children = this.invaders.getChildren() as Enemy[];
    if (children.length === 0) return;

    // 각 열에서 가장 아래 있는 적 찾기
    const columns: { [key: number]: Enemy } = {};
    children.forEach(invader => {
      if (!invader || !invader.active) return;
      const col = invader.getData('col');
      if (!columns[col] || invader.y > columns[col].y) {
        columns[col] = invader;
      }
    });

    // 랜덤하게 선택해서 발사
    const shooters = Object.values(columns);
    if (shooters.length > 0) {
      const shooter = Phaser.Utils.Array.GetRandom(shooters);
      const bulletType = Phaser.Math.Between(1, 3);

      const bullet = this.enemyBullets.create(
        shooter.x,
        shooter.y + 20,
        `enemyBullet${bulletType}`
      ) as Phaser.Physics.Arcade.Sprite;

      bullet.setVelocityY(150);
    }
  }

  private updateUFO(time: number): void {
    this.ufoTimer += this.game.loop.delta;

    if (!this.ufo && this.ufoTimer >= this.ufoSpawnDelay) {
      this.spawnUFO();
      this.ufoTimer = 0;
    }

    if (this.ufo && this.ufo.active) {
      if (this.ufo.x > 850 || this.ufo.x < -50) {
        this.ufo.destroy();
        this.ufo = undefined;
        // UFO 비행 사운드 중지
        this.soundManager.stopUFOSound();
      }
    }
  }

  private spawnUFO(): void {
    const direction = Phaser.Math.Between(0, 1) ? 1 : -1;
    const x = direction > 0 ? -50 : 850;

    this.ufo = this.physics.add.sprite(x, 50, 'ufo');
    this.ufo.setVelocityX(100 * direction);

    // UFO 비행 사운드 시작
    this.soundManager.startUFOSound();
  }

  private checkUFOCollision(): void {
    if (!this.ufo || !this.ufo.active) return;

    const ufoX = this.ufo.x;
    const ufoY = this.ufo.y;

    [...this.playerBullets.getChildren()].forEach((bullet: any) => {
      if (!bullet || !bullet.active) return;
      if (!this.ufo || !this.ufo.active) return;

      const bulletX = bullet.x;
      const bulletY = bullet.y;

      // 거리 기반 충돌 체크 (더 관대한 판정)
      const dx = Math.abs(bulletX - ufoX);
      const dy = Math.abs(bulletY - ufoY);

      // UFO 크기: 약 42x10 (1.5배), 총알 크기: 약 4x8
      // x 거리 25 이내, y 거리 15 이내면 충돌
      if (dx < 25 && dy < 15) {
        // 총알 제거
        bullet.setPosition(-1000, -1000);
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.destroy();

        // UFO 점수 (50-300)
        const points = Phaser.Utils.Array.GetRandom([50, 100, 150, 200, 250, 300]);
        this.score += points;
        this.scoreText.setText(`${this.score}`.padStart(4, '0'));

        // 점수 표시
        const scorePopup = this.add.text(this.ufo!.x, this.ufo!.y, `${points}`, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#FF0000'
        });

        this.time.delayedCall(1000, () => {
          if (scorePopup && scorePopup.active) scorePopup.destroy();
        });

        // UFO 폭발 사운드
        this.soundManager.playUFOExplosion();

        // UFO 제거
        this.ufo!.destroy();
        this.ufo = undefined;
      }
    });
  }

  private checkShelterCollisions(): void {
    // 모든 방어막에 대해 충돌 체크
    // 배열 복사본을 사용하여 반복 중 파괴 문제 방지
    const sheltersCopy = [...this.shelters];

    sheltersCopy.forEach(shelter => {
      if (shelter.isDestroyed()) return;

      const hitbox = shelter.getHitbox();
      if (!hitbox || !hitbox.active) return;

      // 플레이어 총알과 충돌 체크 (작은 반경)
      // 위로 빠르게 이동하므로 여러 지점 체크
      const playerBulletsCopy = [...this.playerBullets.getChildren()];
      playerBulletsCopy.forEach((bullet: any) => {
        if (bullet && bullet.active && this.physics.overlap(bullet, hitbox)) {
          // 총알 경로를 따라 여러 지점 체크 (위로 이동하므로)
          for (let offsetY = 0; offsetY <= 10; offsetY += 2) {
            if (shelter.hasPixelAt(bullet.x, bullet.y + offsetY)) {
              this.hitShelter(bullet, shelter, 3);
              return; // 한 번 충돌하면 종료
            }
          }
        }
      });

      // 적 총알과 충돌 체크 (큰 반경 - 더 강한 파괴력)
      // 아래로 이동하므로 여러 지점 체크
      const enemyBulletsCopy = [...this.enemyBullets.getChildren()];
      enemyBulletsCopy.forEach((bullet: any) => {
        if (bullet && bullet.active && this.physics.overlap(bullet, hitbox)) {
          // 총알 경로를 따라 여러 지점 체크 (아래로 이동하므로)
          for (let offsetY = 0; offsetY >= -10; offsetY -= 2) {
            if (shelter.hasPixelAt(bullet.x, bullet.y + offsetY)) {
              this.hitShelter(bullet, shelter, 6);
              return; // 한 번 충돌하면 종료
            }
          }
        }
      });
    });
  }

  private checkEnemyBulletCollision(): void {
    if (!this.player || !this.player.active) return;

    const playerBounds = this.player.getBounds();

    [...this.enemyBullets.getChildren()].forEach((bullet: any) => {
      if (!bullet || !bullet.active) return;

      const bulletBounds = bullet.getBounds();

      // 충돌 체크
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, bulletBounds)) {
        // 폭탄 즉시 제거
        bullet.setPosition(-1000, -1000);
        bullet.setActive(false);
        bullet.setVisible(false);
        if (bullet.body) {
          bullet.body.enable = false;
        }
        bullet.destroy();

        // 무적이 아닐 때만 데미지
        if (!this.isInvincible && !this.isRespawning && !this.isGameOver) {
          this.isRespawning = true;
          this.loseLife();
        }
      }
    });
  }

  private cleanupBullets(): void {
    // 배열 복사본 사용하여 반복 중 파괴 문제 방지
    [...this.playerBullets.getChildren()].forEach((bullet: any) => {
      if (bullet && bullet.active && bullet.y < 0) {
        bullet.destroy();
      }
    });

    [...this.enemyBullets.getChildren()].forEach((bullet: any) => {
      if (bullet && bullet.active && bullet.y > 600) {
        bullet.destroy();
      }
    });
  }

  private hitInvader(
    bullet: Phaser.Physics.Arcade.Sprite,
    invader: Enemy
  ): void {
    // 안전 체크
    if (!bullet || !bullet.active) return;
    if (!invader || !invader.active) return;

    bullet.destroy();

    // 폭발 효과
    const explosion = this.add.sprite(invader.x, invader.y, 'explosion');
    this.time.delayedCall(100, () => {
      if (explosion && explosion.active) explosion.destroy();
    });

    // 적 폭발 사운드
    this.soundManager.playEnemyExplosion();

    // 점수 추가
    if (invader.enemyType) {
      this.score += EnemyConfig[invader.enemyType].points;
      this.scoreText.setText(`${this.score}`.padStart(4, '0'));
    }

    invader.destroy();

    // 모든 적 제거 시 다음 웨이브
    if (this.invaders.getLength() === 0) {
      this.nextWave();
    }
  }

  private hitUFO(
    bullet: Phaser.Physics.Arcade.Sprite,
    ufo: Phaser.Physics.Arcade.Sprite
  ): void {
    // 안전 체크
    if (!bullet || !bullet.active) return;
    if (!ufo || !ufo.active) return;

    bullet.destroy();

    // UFO 점수 (50-300)
    const points = Phaser.Utils.Array.GetRandom([50, 100, 150, 200, 250, 300]);
    this.score += points;
    this.scoreText.setText(`${this.score}`.padStart(4, '0'));

    // 점수 표시
    const scorePopup = this.add.text(ufo.x, ufo.y, `${points}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#FF0000'
    });

    this.time.delayedCall(1000, () => {
      if (scorePopup && scorePopup.active) scorePopup.destroy();
    });

    ufo.destroy();
    this.ufo = undefined;
  }

  private hitShelter(
    bullet: Phaser.Physics.Arcade.Sprite,
    shelter: Shelter,
    radius: number = 3
  ): void {
    // 안전 체크
    if (!bullet || !bullet.active) return;
    if (!shelter || shelter.isDestroyed()) return;

    shelter.hit(bullet.x, bullet.y, radius);
    bullet.destroy();

    if (shelter.isDestroyed()) {
      shelter.destroy();
      const index = this.shelters.indexOf(shelter);
      if (index > -1) {
        this.shelters.splice(index, 1);
      }
    }
  }

  private hitPlayer(
    bullet: Phaser.Physics.Arcade.Sprite,
    player: Phaser.Physics.Arcade.Sprite
  ): void {
    // 안전 체크: 총알이 유효한지 확인
    if (!bullet || !bullet.active) return;

    // 플레이어 체크
    if (!this.player) return;

    // 폭탄 즉시 완전 제거! (화면 밖으로 이동 + 숨김 + 파괴)
    bullet.setPosition(-1000, -1000); // 화면 밖으로
    bullet.setActive(false);
    bullet.setVisible(false);
    if (bullet.body) {
      (bullet.body as Phaser.Physics.Arcade.Body).enable = false;
    }
    bullet.destroy();

    // 무적, 리스폰 중, 게임 오버면 데미지만 무시
    if (this.isInvincible || this.isRespawning || this.isGameOver) return;

    // 먼저 리스폰 상태로 설정하여 추가 피격 방지!
    this.isRespawning = true;

    this.loseLife();
  }

  private loseLife(): void {
    // 이미 게임오버거나 플레이어가 없으면 무시
    if (this.isGameOver || !this.player) return;

    this.lives--;
    this.updateLivesDisplay();

    if (this.lives <= 0) {
      this.isRespawning = false;
      this.gameOver();
    } else {
      // 리스폰 시작
      this.isRespawning = true;
      this.respawnTimer = 0;

      // 플레이어 폭발 효과
      this.explosionSprite = this.add.sprite(this.player.x, this.player.y, 'explosion');

      // 플레이어 폭발 사운드
      this.soundManager.playPlayerExplosion();

      // 플레이어 숨기기
      this.player.visible = false;

      // 플레이어 물리 바디 비활성화
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.velocity.x = 0;
        body.velocity.y = 0;
        body.enable = false;
      }
    }
  }

  private checkGameOver(): void {
    if (this.isGameOver || !this.player) return;

    const children = this.invaders.getChildren() as Enemy[];

    for (const invader of children) {
      if (invader && invader.active && invader.y >= this.player.y - 20) {
        this.gameOver();
        break; // 한 번만 호출
      }
    }
  }

  private gameOver(): void {
    if (this.isGameOver) return; // 중복 호출 방지

    this.isGameOver = true;

    // 점수 기록
    ScoreManager.recordScore(this.score);

    // 모든 사운드 중지
    this.soundManager.stopUFOSound();

    // 플레이어 폭발 사운드
    this.soundManager.playPlayerExplosion();

    // 플레이어 숨기기 및 물리 비활성화
    if (this.player) {
      this.player.setVisible(false);
      if (this.player.body) {
        this.player.setVelocityX(0);
        (this.player.body as Phaser.Physics.Arcade.Body).enable = false;
      }
    }

    // 폭발 스프라이트가 있으면 정리
    if (this.explosionSprite) {
      this.explosionSprite.destroy();
      this.explosionSprite = undefined;
    }

    this.gameOverText = this.add.text(400, 300, i18n.get('gameOver'), {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#FF0000',
      align: 'center'
    });
    this.gameOverText.setOrigin(0.5);

    // 3초 후 자동으로 타이틀 화면으로
    this.time.delayedCall(3000, () => {
      this.scene.start('TitleScene');
    });
  }

  private nextWave(): void {
    this.time.delayedCall(2000, () => {
      this.createInvaders();
      this.invaderSpeed += 2; // 다음 웨이브는 더 빠름
    });
  }
}
