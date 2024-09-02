import {computed, signal, Signal} from '@angular/core';
import {Behavior, BehaviorEventTarget} from './base';

export interface ActiveDescendantFocusItemInputs<T> {
  readonly identity: T;
  readonly id: Signal<string>;

  readonly disabled?: Signal<boolean>;
}

export interface ActiveDescendantFocusInputs<T> {
  readonly element: HTMLElement;
  readonly items: Signal<readonly ActiveDescendantFocusItemInputs<T>[]>;
  readonly active: Signal<T | undefined>;
  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;

  readonly disabled?: Signal<boolean>;
}

export interface ActiveDescendantFocusState<T> {
  readonly tabindex: number;
  readonly active: T | undefined;
  readonly activeDescendantId: string | undefined;
  readonly focused: HTMLElement | undefined;
  readonly items: [T, {tabindex: number}][];
}

export class ActiveDescendantFocusBehavior<T> extends Behavior<ActiveDescendantFocusState<T>> {
  readonly state: Signal<ActiveDescendantFocusState<T>>;

  private readonly focused = signal<HTMLElement | undefined>(undefined);

  constructor(private control: ActiveDescendantFocusInputs<T>) {
    super();

    const activeItem = computed(() => {
      const activeItem = control.items().find(item => item.identity === control.active());
      return control.disabled?.() || activeItem?.disabled?.() ? undefined : activeItem;
    });

    this.focused = signal(this.hasFocus() ? control.element : undefined);

    this.state = computed(() => ({
      tabindex: control.disabled?.() ? -1 : 0,
      active: activeItem()?.identity,
      activeDescendantId: activeItem()?.id(),
      focused: this.focused(),
      items: control.items().map(item => [item.identity, {tabindex: -1}]),
    }));

    if (this.hasFocus()) {
      control.element.focus();
    }
    this.listeners.push(control.focusinEvents.listen(() => this.handleFocusin()));
  }

  private hasFocus() {
    return this.control.element.contains(document.activeElement);
  }

  private handleFocusin() {
    if (this.control.disabled?.()) {
      return;
    }
    this.focused.set(this.control.element);
  }
}
