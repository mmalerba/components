import {EffectRef} from '@angular/core';

export class Behavior {
  protected readonly listeners: VoidFunction[] = [];
  protected readonly effects: EffectRef[] = [];

  remove() {
    for (const ref of this.effects) {
      ref.destroy();
    }
    for (const unlisten of this.listeners) {
      unlisten();
    }
  }
}

export interface BehaviorEventTarget<T extends Event> {
  listen(listener: (event: T) => void): () => void;
}

export class EventDispatcher<T extends Event> implements BehaviorEventTarget<T> {
  private listeners = new Set<(event: T) => void>();

  listen(listener: (event: T) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(event: T) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
