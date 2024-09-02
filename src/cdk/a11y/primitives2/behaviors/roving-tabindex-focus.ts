import {computed, Signal, WritableSignal} from '@angular/core';
import {Behavior, BehaviorEventTarget, derivedSignal} from './base';

export interface RovingTabindexFocusItemInputs<T> {
  readonly identity: T;
  readonly element: HTMLElement;

  readonly disabled?: Signal<boolean>;
}

export interface RovingTabindexFocusInputs<T> {
  readonly element: HTMLElement;
  readonly items: Signal<readonly RovingTabindexFocusItemInputs<T>[]>;
  readonly active: Signal<T | undefined>;
  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;
  readonly focusoutEvents: BehaviorEventTarget<FocusEvent>;

  readonly disabled?: Signal<boolean>;
}

export interface RovingTabindexFocusState<T> {
  readonly active: T | undefined;
  readonly tabindex: number;
  readonly activeDescendantId: string | undefined;
  readonly focused: HTMLElement | undefined;
  readonly items: [T, {tabindex: number}][];
}

export class RovingTabindexFocusBehavior<T> extends Behavior<RovingTabindexFocusState<T>> {
  readonly state: Signal<RovingTabindexFocusState<T>>;

  private readonly focused: WritableSignal<HTMLElement | undefined>;
  private activeItem: Signal<RovingTabindexFocusItemInputs<T> | undefined>;

  constructor(private control: RovingTabindexFocusInputs<T>) {
    super();

    this.activeItem = computed(() => {
      let activeItem = control.items().find(item => item.identity === control.active());
      activeItem =
        !activeItem || activeItem.disabled?.() ? this.getFirstActivatableItem() : activeItem;
      return activeItem;
    });

    this.focused = derivedSignal(() => {
      const item = this.activeItem();
      return this.hasFocus() ? item?.element : undefined;
    });

    this.state = computed(() => ({
      active: control.disabled?.() ? control.active() : this.activeItem()?.identity,
      tabindex: -1,
      activeDescendantId: undefined,
      focused: this.focused(),
      items: control
        .items()
        .map(item => [
          item.identity,
          {tabindex: item.identity === this.activeItem()?.identity ? 0 : -1},
        ]),
    }));

    this.listeners.push(
      control.focusinEvents.listen(() => this.handleFocusin()),
      control.focusoutEvents.listen(e => this.handleFocusout(e)),
    );
  }

  private hasFocus() {
    return this.control.element.contains(document.activeElement);
  }

  private getFirstActivatableItem() {
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

  private handleFocusin() {
    if (this.control.disabled?.()) {
      return;
    }
    this.focused.set(this.activeItem()?.element);
  }

  private handleFocusout(e: FocusEvent) {
    const targetRemoved = !this.control.items().some(item => item.element === e.target);
    if (targetRemoved) {
      this.focused.set(this.getFirstActivatableItem()?.element);
    }
  }
}
