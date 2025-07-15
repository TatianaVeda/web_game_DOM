import type { ResourceInfo } from '../../shared/types';

export class ResourceManager {
  private container: HTMLElement;
  private resources: Map<string, HTMLDivElement> = new Map();

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.container = container;
  }

  syncResources(resourceList: ResourceInfo[]) {
    const existing = new Set(this.resources.keys());

    for (const res of resourceList) {
      if (!this.resources.has(res.id)) {
        const el = this.createResourceElement(res);
        this.container.appendChild(el);
        this.resources.set(res.id, el);
      } else {
        const el = this.resources.get(res.id)!;
        el.style.left = `${res.x}px`;
        el.style.top = `${res.y}px`;
        existing.delete(res.id);
      }
    }

    // удаляем те, которых больше нет
    for (const id of existing) {
      this.resources.get(id)?.remove();
      this.resources.delete(id);
    }
  }

  private createResourceElement(res: ResourceInfo): HTMLDivElement {
    const el = document.createElement('div');
    el.classList.add('resource', res.type);
    el.style.position = 'absolute';
    el.style.left = `${res.x}px`;
    el.style.top = `${res.y}px`;
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.zIndex = '5';
    el.dataset.id = res.id;

    // Заменить на картинку, если хочешь
    el.style.backgroundColor = this.getColorByType(res.type);
    el.title = res.type;

    return el;
  }

  private getColorByType(type: ResourceInfo['type']): string {
    switch (type) {
      case 'food': return 'gold';
      case 'bonus': return 'lightblue';
      case 'slow': return 'gray';
      case 'shield': return 'purple';
    }
  }
}