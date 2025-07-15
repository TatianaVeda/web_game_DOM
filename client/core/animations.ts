export interface FrameData {
    x: number;
    y: number;
    w: number;
    h: number;
  }
  
  export class Animation {
    private frames: FrameData[];
    private frameDuration: number;
    private currentFrame: number = 0;
    private timer: number = 0;
    private loop: boolean;
  
    constructor(
      public spriteSheet: HTMLImageElement,
      frames: FrameData[],
      frameDuration: number,
      loop: boolean = true
    ) {
      this.frames = frames;
      this.frameDuration = frameDuration;
      this.loop = loop;
    }
  
    update(deltaTime: number) {
      this.timer += deltaTime;
      if (this.timer >= this.frameDuration) {
        this.timer = 0;
        this.currentFrame =
          (this.currentFrame + 1) % this.frames.length;
      }
    }
  
    getFrame(): FrameData {
      return this.frames[this.currentFrame];
    }
  
    getSpriteSheet(): HTMLImageElement {
      return this.spriteSheet;
    }
  
    reset() {
      this.currentFrame = 0;
      this.timer = 0;
    }
  }
  
/*   export async function getAnimations(playerNum: number): Promise<Record<string, Animation>> {
    const basePath = `/sprites/${playerNum}`;
  
    function load(src: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    }
  
    const [idle, run] = await Promise.all([
      load(`${basePath}/idle.png`),
      load(`${basePath}/run.png`),
    ]);
  
    const idleFrames: FrameData[] = [
      { x: 0, y: 0, w: 96, h: 84 },
      { x: 96, y: 0, w: 96, h: 84 },
      { x: 192, y: 0, w: 96, h: 84 },
      { x: 288, y: 0, w: 96, h: 84 },
    ];
  
    const runFrames: FrameData[] = [
      { x: 0, y: 0, w: 96, h: 84 },
      { x: 96, y: 0, w: 96, h: 84 },
      { x: 192, y: 0, w: 96, h: 84 },
      { x: 288, y: 0, w: 96, h: 84 },
      { x: 384, y: 0, w: 96, h: 84 },
      { x: 480, y: 0, w: 96, h: 84 },
    ];
  
    return {
      idle: new Animation(idle, idleFrames, 120),
      run: new Animation(run, runFrames, 80),
    };
  } */

  export async function getAnimations(playerNum: number): Promise<Record<string, Animation>> {
    const sheet = await load(`/sprites/${playerNum}/dog.png`);
  
    const frameWidth = 64;
    const frameHeight = 64;
  
    const idleFrames: FrameData[] = [
      { x: 0, y: 0, w: frameWidth, h: frameHeight },
      { x: 64, y: 0, w: frameWidth, h: frameHeight },
      { x: 128, y: 0, w: frameWidth, h: frameHeight },
      { x: 192, y: 0, w: frameWidth, h: frameHeight },
    ];
  
    const runFrames: FrameData[] = [
      { x: 0, y: 64, w: frameWidth, h: frameHeight },
      { x: 64, y: 64, w: frameWidth, h: frameHeight },
      { x: 128, y: 64, w: frameWidth, h: frameHeight },
      { x: 192, y: 64, w: frameWidth, h: frameHeight },
    ];
  
    return {
      idle: new Animation(sheet, idleFrames, 250), // 250ms между кадрами
      run: new Animation(sheet, runFrames, 100),   // быстрее
    };
  }
  
  function load(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }