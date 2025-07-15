import type { PlayerInfo } from '../../shared/types';
import { getAnimations } from './animations'; // адаптация from allAnimations.js

export class PlayerElement {
  id: string;
  name: string;
  element: HTMLDivElement;
  sprite: HTMLImageElement;
  info: PlayerInfo;
  facing: 'left' | 'right' = 'right';
  animations: any;
  animationState: 'idle' | 'run' = 'idle';
  prevAnim: string | null = null;

  constructor(info: PlayerInfo) {
    this.id = info.id;
    this.name = info.name;
    this.info = info;

    // Создание контейнера игрока
    this.element = document.createElement('div');
    this.element.classList.add('player');
    this.element.style.position = 'absolute';
    this.element.style.width = '35px';
    this.element.style.height = '50px';
    this.element.style.zIndex = '10';

    // Спрайт
    this.sprite = document.createElement('img');
    this.sprite.style.position = 'absolute';
    this.sprite.style.width = '64px';
    this.sprite.style.height = '64px';
    this.sprite.style.objectFit = 'none';
    this.sprite.style.left = '-15px';
    this.sprite.style.top = '-14px';
    this.element.appendChild(this.sprite);

    // Установка начальной позиции
    this.updatePosition();
    document.getElementById('game-container')?.appendChild(this.element);
  }

  async initAnimations(playerNum: number) {
    this.animations = await getAnimations(playerNum);
  }

  update(info: PlayerInfo) {
    this.info = info;
    this.updatePosition();
    this.updateDirection();
    this.updateAnimation();
  }

  updatePosition() {
    this.element.style.left = `${this.info.x}px`;
    this.element.style.top = `${this.info.y}px`;
  }

  updateDirection() {
    if (this.info.x > this.element.offsetLeft) {
      this.facing = 'right';
      this.element.style.transform = 'scaleX(1)';
    } else if (this.info.x < this.element.offsetLeft) {
      this.facing = 'left';
      this.element.style.transform = 'scaleX(-1)';
    }
  }

  updateAnimation() {
    if (!this.animations) return;
    const anim = this.info.alive && this.info.score > 0 ? 'run' : 'idle';
    if (this.animationState !== anim) {
      this.animationState = anim;
    }

    const currentAnim = this.animations[this.animationState];
    if (this.prevAnim !== this.animationState) {
      this.sprite.src = currentAnim.getSpriteSheet().src;
      currentAnim.reset();
      this.prevAnim = this.animationState;
    }

    currentAnim.update(16); // 60fps
    const frame = currentAnim.getFrame();
    this.sprite.style.objectPosition = `-${frame.x}px -${frame.y}px`;
  }

  collectNearbyResources(resourceElements: HTMLDivElement[]): string[] {
    const collectedIds: string[] = [];
    const playerBox = this.element.getBoundingClientRect();
  
    for (const el of resourceElements) {
      const resBox = el.getBoundingClientRect();
  
      const isOverlap =
        playerBox.left < resBox.right &&
        playerBox.right > resBox.left &&
        playerBox.top < resBox.bottom &&
        playerBox.bottom > resBox.top;
  
      if (isOverlap) {
        const id = el.dataset.id;
        if (id) collectedIds.push(id);
      }
    }  
    return collectedIds;
  }
}