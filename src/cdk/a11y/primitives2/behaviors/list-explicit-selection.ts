import {computed, Signal, WritableSignal} from '@angular/core';
import {Behavior, BehaviorEventTarget, derivedSignal} from './base';

export interface ListExplicitSelectionItemInputs<T> {
  readonly identity: T;
  readonly disabled?: Signal<boolean>;
}

export interface ListExplicitSelectionInputs<T> {
  readonly element: HTMLElement;
  readonly selected: Signal<T | undefined>;
  readonly items: Signal<readonly ListExplicitSelectionItemInputs<T>[]>;
  readonly active: Signal<T | undefined>;
  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;
  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;

  readonly disabled?: Signal<boolean>;
}

export interface ListExplicitSelectionState<T> {
  selected: T | undefined;
  disabledByState: boolean;
}

export class ListExplicitSelectionBehavior<T> extends Behavior<ListExplicitSelectionState<T>> {
  readonly state: Signal<ListExplicitSelectionState<T>>;

  private canSelectActiveItem: Signal<boolean>;
  private selected: WritableSignal<T | undefined>;

  constructor(private control: ListExplicitSelectionInputs<T>) {
    super();

    const activeItem = computed(() =>
      control.items().find(item => item.identity === control.active()),
    );

    const selectedItem = computed(() =>
      control.items().find(item => item.identity === control.selected()),
    );

    this.selected = derivedSignal(() => selectedItem()?.identity);

    this.canSelectActiveItem = computed(
      () => !(control.disabled?.() || selectedItem()?.disabled?.() || activeItem()?.disabled?.()),
    );

    this.state = computed(() => ({
      selected: this.selected(),
      disabledByState: selectedItem()?.disabled?.() || false,
    }));

    this.listeners.push(control.keydownEvents.listen(event => this.handleKeydown(event)));
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.control.disabled?.()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (this.canSelectActiveItem()) {
          this.selected.set(this.control.active());
        }
        break;
    }
  }
}
