import {computed, Signal, signal, untracked, WritableSignal} from '@angular/core';
import {SIGNAL} from '@angular/core/primitives/signals';

export function derivedSignal<T>(fn: () => T): WritableSignal<T> {
  const c = computed(() => signal(fn()));
  const s = (() => c()()) as WritableSignal<T>;
  s.set = (value: T) => untracked(c).set(value);
  s.update = (fn: (value: T) => T) => untracked(c).update(fn);
  s.asReadonly = () => s;
  s[SIGNAL] = c[SIGNAL];
  return s;
}

export abstract class Behavior<T> {
  abstract readonly state: Signal<T>;

  protected readonly listeners: VoidFunction[] = [];

  remove() {
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
