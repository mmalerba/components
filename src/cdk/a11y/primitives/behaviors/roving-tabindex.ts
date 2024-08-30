import {computed, effect, Signal, WritableSignal} from '@angular/core';
import {Behavior, BehaviorEventTarget} from './base';

export interface RovingTabIndexItemState<I> {
  readonly identity: I;
  readonly element: HTMLElement;
  readonly tabindex: WritableSignal<number | undefined>;

  readonly disabled?: Signal<boolean>;
}

export interface RovingTabIndexState<I> {
  readonly element: HTMLElement;
  readonly active: WritableSignal<I | undefined>;
  readonly tabindex: WritableSignal<number | undefined>;
  readonly items: Signal<readonly RovingTabIndexItemState<I>[]>;
  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;
  readonly focusoutEvents: BehaviorEventTarget<FocusEvent>;

  readonly disabled?: Signal<boolean>;
}

export class RovingTabindexBehavior<I> extends Behavior {
  constructor(private control: RovingTabIndexState<I>) {
    super();

    control.tabindex.set(-1);

    const activeItem = computed(() =>
      control.items().find(item => item.identity === control.active()),
    );

    const active = computed(() =>
      activeItem() && (control.disabled?.() || !activeItem()?.disabled?.())
        ? control.active()
        : this.getFirstEnabledItem()?.identity,
    );

    this.effects.push(
      effect(() => control.active.set(active()), {allowSignalWrites: true}),
      effect(
        () => {
          for (const item of control.items()) {
            item.tabindex.set(
              !control.disabled?.() && !activeItem()?.disabled?.() && item === activeItem()
                ? 0
                : -1,
            );
          }
        },
        {allowSignalWrites: true},
      ),
      effect(() => {
        const activeElement = activeItem()?.element;
        if (activeElement && this.hasFocus()) {
          activeElement.focus();
        }
      }),
    );

    this.listeners.push(
      control.focusinEvents.listen(() => activeItem()?.element.focus()),
      control.focusoutEvents.listen(() => {
        if (!activeItem()) {
          this.getFirstEnabledItem()?.element.focus();
        }
      }),
    );
  }

  private hasFocus() {
    return this.control.element.contains(document.activeElement);
  }

  private getFirstEnabledItem() {
    if (this.control.disabled?.()) {
      return undefined;
    }
    for (const item of this.control.items()) {
      if (!item.disabled?.()) {
        return item;
      }
    }
    return undefined;
  }
}
