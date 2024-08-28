import {Signal, WritableSignal} from '@angular/core';
import {Behavior, BehaviorEventTarget} from './base';

export interface ListKeyNavigationOptions {
  readonly wrap: boolean;
}

export interface ListKeyNavigationItemState<I> {
  readonly identity: I;

  readonly disabled?: Signal<boolean>;
}

export type ListKeyNavigationOrientationState =
  | {
      readonly orientation: Signal<'vertical' | 'horizontal'>;
      readonly direction: Signal<'ltr' | 'rtl'>;
    }
  | {
      readonly orientation?: Signal<'vertical'>;
      readonly direction?: Signal<'ltr' | 'rtl'>;
    };

export type ListKeyNavigationState<I> = {
  readonly active: WritableSignal<I | undefined>;
  readonly items: Signal<readonly ListKeyNavigationItemState<I>[]>;
  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;

  readonly disabled?: Signal<boolean>;
} & ListKeyNavigationOrientationState;

export const DEFAULT_LIST_KEY_NAVIGATION_OPTIONS: ListKeyNavigationOptions = {
  wrap: false,
};

export class ListKeyNavigationBehavior<I> extends Behavior {
  private options: ListKeyNavigationOptions;

  constructor(
    private list: ListKeyNavigationState<I>,
    options?: Partial<ListKeyNavigationOptions>,
  ) {
    super();

    this.options = {...DEFAULT_LIST_KEY_NAVIGATION_OPTIONS, ...options};
    this.listeners.push(list.keydownEvents.listen(event => this.handleKeydown(event)));
  }

  private handleKeydown(event: KeyboardEvent) {
    const orientation = this.list.orientation?.() ?? 'vertical';
    const direction = this.list.direction?.() ?? 'ltr';

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
    const currentIndex = this.list.items().findIndex(i => i.identity === this.list.active());
    let nextIndex = currentIndex;
    do {
      nextIndex = this.clampIndex(nextIndex + 1);
    } while (
      !this.canActivate(nextIndex) &&
      (this.options.wrap ? nextIndex !== currentIndex : nextIndex < this.list.items().length - 1)
    );
    if (this.canActivate(nextIndex)) {
      this.list.active.set(this.list.items()[nextIndex].identity);
    }
  }

  private activatePreviousItem() {
    const currentIndex = this.list.items().findIndex(i => i.identity === this.list.active());
    let nextIndex = currentIndex;
    do {
      nextIndex = this.clampIndex(nextIndex - 1);
    } while (
      !this.canActivate(nextIndex) &&
      (this.options.wrap ? nextIndex !== currentIndex : nextIndex > 0)
    );
    if (this.canActivate(nextIndex)) {
      this.list.active.set(this.list.items()[nextIndex].identity);
    }
  }

  private clampIndex(index: number) {
    const itemCount = this.list.items().length;
    return this.options.wrap
      ? (index + itemCount) % itemCount
      : Math.min(Math.max(index, 0), itemCount - 1);
  }

  private canActivate(index: number) {
    if (this.list.disabled?.() || this.list.items()[index].disabled?.()) {
      return false;
    }
    return true;
  }
}
