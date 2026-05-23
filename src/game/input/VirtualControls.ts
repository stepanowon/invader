class VirtualControls {
  private leftDown = false;
  private rightDown = false;
  private fireQueued = false;
  private coinQueued = false;
  private startQueued = false;
  private initialsInputActive = false;
  private initialsInputQueue: string[] = [];

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

  setInitialsInputActive(active: boolean): void {
    this.initialsInputActive = active;
    if (!active) {
      this.initialsInputQueue = [];
    }
  }

  isInitialsInputActive(): boolean {
    return this.initialsInputActive;
  }

  queueInitialLetter(letter: string): void {
    const normalized = letter.toUpperCase();
    if (/^[A-Z]$/.test(normalized)) {
      this.initialsInputQueue.push(normalized);
    }
  }

  queueInitialBackspace(): void {
    this.initialsInputQueue.push('BACKSPACE');
  }

  queueInitialSubmit(): void {
    this.initialsInputQueue.push('ENTER');
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

  consumeInitialInput(): string | null {
    return this.initialsInputQueue.shift() ?? null;
  }

  reset(): void {
    this.leftDown = false;
    this.rightDown = false;
    this.fireQueued = false;
    this.coinQueued = false;
    this.startQueued = false;
    this.initialsInputQueue = [];
  }
}

export const virtualControls = new VirtualControls();
