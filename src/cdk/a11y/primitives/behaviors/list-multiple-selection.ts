import {Signal, WritableSignal, computed} from '@angular/core';
import {Behavior, BehaviorEventTarget} from './base';
import {ListSingleSelectionItemState} from './list-single-selection';

export interface ListMultipleSelectionItemState<I> {
  readonly identity: I;
  readonly disabled?: Signal<boolean>;
}

export interface ListMultipleSelectionState<I> {
  readonly selected: WritableSignal<I[]>;
  readonly items: Signal<readonly ListSingleSelectionItemState<I>[]>;
  readonly active: Signal<I | undefined>;
  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;

  readonly disabled?: Signal<boolean>;
}

export class ListMultipleSelectionBehavior<I> extends Behavior {
  private readonly canSelectActiveItem: Signal<boolean>;

  constructor(private list: ListMultipleSelectionState<I>) {
    super();

    const activeItem = computed(() => list.items().find(item => item.identity === list.active()));

    this.canSelectActiveItem = computed(
      () => !(this.list.disabled?.() || activeItem()?.disabled?.()),
    );

    this.listeners.push(list.keydownEvents.listen(event => this.handleKeydown(event)));
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.list.disabled?.()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        const active = this.list.active();
        if (active && this.canSelectActiveItem()) {
          this.list.selected.update(selected => {
            const i = selected.indexOf(active);
            if (i >= 0) {
              return [...selected.slice(0, i), ...selected.slice(i + 1)];
            } else {
              return [...selected, active];
            }
          });
        }
        break;
    }
  }
}
