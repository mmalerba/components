import {computed, Signal, WritableSignal} from '@angular/core';
import {Behavior, BehaviorEventTarget, derivedSignal} from './base';

export interface ListFollowFocusSelectionItemInputs<T> {
  readonly identity: T;
  readonly disabled?: Signal<boolean>;
}

export interface ListFollowFocusSelectionInputs<T> {
  readonly element: HTMLElement;
  readonly selected: Signal<T | undefined>;
  readonly items: Signal<readonly ListFollowFocusSelectionItemInputs<T>[]>;
  readonly active: Signal<T | undefined>;
  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;
  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;

  readonly disabled?: Signal<boolean>;
}

export interface ListFollowFocusSelectionState<T> {
  selected: T | undefined;
  disabledByState: boolean;
}

export class ListFollowFocusSelectionBehavior<T> extends Behavior<
  ListFollowFocusSelectionState<T>
> {
  readonly state: Signal<ListFollowFocusSelectionState<T>>;

  private readonly selected: WritableSignal<T | undefined>;

  constructor(private control: ListFollowFocusSelectionInputs<T>) {
    super();

    const activeItem = computed(() =>
      control.items().find(item => item.identity === control.active()),
    );

    const selectedItem = computed(() =>
      control.items().find(item => item.identity === control.selected()),
    );

    const canSelectActiveItem = computed(
      () => !(control.disabled?.() || selectedItem()?.disabled?.() || activeItem()?.disabled?.()),
    );

    this.selected = derivedSignal(() => {
      const canSelect = canSelectActiveItem();
      const active = control.active();
      const selected = selectedItem();
      return canSelect && this.hasFocus() ? active : selected?.identity;
    });

    this.state = computed(() => ({
      selected: this.selected(),
      disabledByState: selectedItem()?.disabled?.() || false,
    }));

    this.listeners.push(control.focusinEvents.listen(() => this.handleFocusin()));
  }

  private hasFocus() {
    return this.control.element.contains(document.activeElement);
  }

  private handleFocusin() {
    if (this.control.disabled?.()) {
      return;
    }
    this.selected.set(this.control.active());
  }
}
