class VirtualControls {
  private leftDown = false;
  private rightDown = false;
  private fireQueued = false;
  private coinQueued = false;
  private startQueued = false;

  setLeft(down: boolean): void {
    this.leftDown = down;
  }

  setRight(down: boolean): void {
    this.rightDown = down;
  }

  queueFire(): void {
    this.fireQueued = true;
  }

  queueCoin(): void {
    this.coinQueued = true;
  }

  queueStart(): void {
    this.startQueued = true;
  }

  isLeftDown(): boolean {
    return this.leftDown;
  }

  isRightDown(): boolean {
    return this.rightDown;
  }

  consumeFire(): boolean {
    if (!this.fireQueued) return false;
    this.fireQueued = false;
    return true;
  }

  consumeCoin(): boolean {
    if (!this.coinQueued) return false;
    this.coinQueued = false;
    return true;
  }

  consumeStart(): boolean {
    if (!this.startQueued) return false;
    this.startQueued = false;
    return true;
  }

  reset(): void {
    this.leftDown = false;
    this.rightDown = false;
    this.fireQueued = false;
    this.coinQueued = false;
    this.startQueued = false;
  }
}

export const virtualControls = new VirtualControls();
