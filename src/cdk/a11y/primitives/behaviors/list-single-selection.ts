import {computed, effect, Signal, WritableSignal} from '@angular/core';
import {Behavior, BehaviorEventTarget} from './base';

export interface ListSingleSelectionOptions {
  readonly selectionFollowsFocus: boolean;
}

export interface ListSingleSelectionItemState<I> {
  readonly identity: I;
  readonly disabled?: Signal<boolean>;
}

export interface ListSingleSelectionState<I> {
  readonly selected: WritableSignal<I | undefined>;
  readonly items: Signal<readonly ListSingleSelectionItemState<I>[]>;
  readonly active: Signal<I | undefined>;
  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;

  readonly disabled?: Signal<boolean>;
}

export const DEFAULT_LIST_SINGLE_SELECTION_OPTIONS: ListSingleSelectionOptions = {
  selectionFollowsFocus: true,
};

export class ListSingleSelectionBehavior<I> extends Behavior {
  private readonly canSelectActiveItem: Signal<boolean>;

  constructor(
    private list: ListSingleSelectionState<I>,
    options?: Partial<ListSingleSelectionOptions>,
  ) {
    super();

    const fullOptions = {...DEFAULT_LIST_SINGLE_SELECTION_OPTIONS, ...options};

    const activeItem = computed(() => list.items().find(item => item.identity === list.active()));

    const selectedItem = computed(() =>
      list.items().find(item => item.identity === list.selected()),
    );

    const selected = computed(() =>
      this.canSelectActiveItem() ? list.active() : selectedItem()?.identity,
    );

    this.canSelectActiveItem = computed(
      () => !(this.list.disabled?.() || selectedItem()?.disabled?.() || activeItem()?.disabled?.()),
    );

    if (fullOptions.selectionFollowsFocus) {
      this.effects.push(effect(() => list.selected.set(selected()), {allowSignalWrites: true}));
    } else {
      this.listeners.push(list.keydownEvents.listen(event => this.handleKeydown(event)));
    }
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.list.disabled?.()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (this.canSelectActiveItem()) {
          this.list.selected.set(this.list.active());
        }
        break;
    }
  }
}
