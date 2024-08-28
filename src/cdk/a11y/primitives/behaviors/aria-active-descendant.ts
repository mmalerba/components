import {computed, effect, Signal, WritableSignal} from '@angular/core';
import {Behavior, BehaviorEventTarget} from './base';

export interface AriaActiveDescendantItemState<I> {
  readonly identity: I;
  readonly tabindex: WritableSignal<number | undefined>;
  readonly id: Signal<string>;

  readonly disabled?: Signal<boolean>;
}

export interface AriaActiveDescendantState<I> {
  readonly element: HTMLElement;
  readonly activeDescendantId: WritableSignal<string | undefined>;
  readonly tabindex: WritableSignal<number | undefined>;
  readonly active: WritableSignal<I | undefined>;
  readonly items: Signal<readonly AriaActiveDescendantItemState<I>[]>;
  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;

  readonly disabled?: Signal<boolean>;
}

export class AriaActiveDescendantBehavior<I> extends Behavior {
  constructor(private control: AriaActiveDescendantState<I>) {
    super();

    if (this.hasFocus()) {
      control.element.focus();
    }

    const tabindex = computed(() => {
      return control.disabled?.() || control.items().every(item => item.disabled?.()) ? -1 : 0;
    });

    const activeDescendantId = computed(() => {
      const active = control.items().find(item => item.identity === control.active());
      return active?.id();
    });

    this.effects.push(
      effect(() => control.tabindex.set(tabindex()), {allowSignalWrites: true}),
      effect(() => control.activeDescendantId.set(activeDescendantId()), {
        allowSignalWrites: true,
      }),
      effect(
        () => {
          const activeItem = control.items().find(item => item.identity === control.active());
          control.active.set(activeItem?.disabled?.() ? undefined : activeItem?.identity);
        },
        {allowSignalWrites: true},
      ),
      effect(
        () => {
          for (const item of control.items()) {
            item.tabindex.set(-1);
          }
        },
        {allowSignalWrites: true},
      ),
    );

    this.listeners.push(control.focusinEvents.listen(() => control.element.focus()));
  }

  private hasFocus() {
    return this.control.element.contains(document.activeElement);
  }
}
