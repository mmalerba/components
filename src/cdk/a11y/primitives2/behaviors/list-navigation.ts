import {computed, Signal, WritableSignal} from '@angular/core';
import {Behavior, BehaviorEventTarget, derivedSignal} from './base';

export interface ListNavigationOptions {
  readonly wrap: boolean;
}

export interface ListNavigationItemInputs<T> {
  readonly identity: T;

  readonly disabled?: Signal<boolean>;
}

export type ListNavigationOrientationInputs =
  | {
      readonly orientation: Signal<'vertical' | 'horizontal'>;
      readonly direction: Signal<'ltr' | 'rtl'>;
    }
  | {
      readonly orientation?: Signal<'vertical'>;
      readonly direction?: Signal<'ltr' | 'rtl'>;
    };

export type ListNavigationInputs<T> = {
  readonly items: Signal<readonly ListNavigationItemInputs<T>[]>;
  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;

  readonly active?: Signal<T | undefined>;
  readonly disabled?: Signal<boolean>;
} & ListNavigationOrientationInputs;

export interface ListNavigationState<T> {
  readonly active: T | undefined;
}

export const DEFAULT_LIST_KEY_NAVIGATION_OPTIONS: ListNavigationOptions = {
  wrap: false,
};

export class ListNavigationBehavior<T> extends Behavior<ListNavigationState<T>> {
  readonly state: Signal<ListNavigationState<T>>;

  private readonly options: ListNavigationOptions;
  private readonly active: WritableSignal<T | undefined>;
  private readonly activeIndex: Signal<number>;

  constructor(
    private control: ListNavigationInputs<T>,
    options?: Partial<ListNavigationOptions>,
  ) {
    super();

    this.options = {...DEFAULT_LIST_KEY_NAVIGATION_OPTIONS, ...options};
    this.active = derivedSignal(() => this.control.active?.());
    this.activeIndex = computed(() => {
      return this.control.items().findIndex(i => i.identity === this.active());
    });

    this.state = computed(() => ({
      active: this.active(),
    }));

    this.listeners.push(control.keydownEvents.listen(event => this.handleKeydown(event)));
  }

  private handleKeydown(event: KeyboardEvent) {
    const orientation = this.control.orientation?.() ?? 'vertical';
    const direction = this.control.direction?.() ?? 'ltr';

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          this.activateNextItem();
          event.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          this.activatePreviousItem();
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          if (direction === 'ltr') {
            this.activateNextItem();
          } else {
            this.activatePreviousItem();
          }
          event.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          if (direction === 'ltr') {
            this.activatePreviousItem();
          } else {
            this.activateNextItem();
          }
          event.preventDefault();
        }
        break;
    }
  }

  private activateNextItem() {
    const currentIndex = this.activeIndex();
    let nextIndex = currentIndex;
    do {
      nextIndex = this.clampIndex(nextIndex + 1);
    } while (
      !this.canActivate(nextIndex) &&
      (this.options.wrap ? nextIndex !== currentIndex : nextIndex < this.control.items().length - 1)
    );
    if (this.canActivate(nextIndex)) {
      this.active.set(this.control.items()[nextIndex].identity);
    }
  }

  private activatePreviousItem() {
    const currentIndex = this.activeIndex();
    let nextIndex = currentIndex;
    do {
      nextIndex = this.clampIndex(nextIndex - 1);
    } while (
      !this.canActivate(nextIndex) &&
      (this.options.wrap ? nextIndex !== currentIndex : nextIndex > 0)
    );
    if (this.canActivate(nextIndex)) {
      this.active.set(this.control.items()[nextIndex].identity);
    }
  }

  private clampIndex(index: number) {
    const itemCount = this.control.items().length;
    return this.options.wrap
      ? (index + itemCount) % itemCount
      : Math.min(Math.max(index, 0), itemCount - 1);
  }

  private canActivate(index: number) {
    if (this.control.disabled?.() || this.control.items()[index].disabled?.()) {
      return false;
    }
    return true;
  }
}
