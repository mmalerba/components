import {Directionality} from '@angular/cdk/bidi';
import {
  afterNextRender,
  computed,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActiveDescendantFocusBehavior} from '../behaviors/active-descendant-focus';
import {derivedSignal, EventDispatcher} from '../behaviors/base';
import {ListExplicitSelectionBehavior} from '../behaviors/list-explicit-selection';
import {ListFollowFocusSelectionBehavior} from '../behaviors/list-follow-focus-selection';
import {ListNavigationBehavior} from '../behaviors/list-navigation';
import {RovingTabindexFocusBehavior} from '../behaviors/roving-tabindex-focus';

export interface ListboxOptions {
  wrapKeyNavigation: boolean;
  useActiveDescendant: boolean;
  selectionFollowsFocus: boolean;
  multiple: boolean;
}

export const DEFAULT_LISTBOX_OPTIONS: ListboxOptions = {
  wrapKeyNavigation: false,
  useActiveDescendant: true,
  selectionFollowsFocus: true,
  multiple: false,
};

let nextId = 0;

@Directive({
  selector: '[tbd-listbox-option]',
  standalone: true,
  exportAs: 'ListboxOption',
  host: {
    'role': 'option',
    '[id]': 'uiState.id()',
    '[attr.disabled]': 'uiState.disabled()',
    '[attr.tabindex]': 'uiState.tabindex()',
    '[attr.aria-selected]': 'uiState.selected()',
    '[class.active]': 'uiState.active()',
  },
})
export class ListboxOption {
  private readonly listbox = inject(Listbox);

  // Declare our inputs.
  protected readonly disabled = input(false);
  protected readonly id = input<string>(`tbd-listbox-option-${nextId++}`);

  // Set up our internal state.
  readonly uiState = {
    identity: this as ListboxOption,
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    disabled: this.disabled,
    tabindex: signal<number | undefined>(undefined),
    id: this.id,
    active: computed((): boolean => this.listbox.uiState.active() === this),
    selected: computed((): boolean => this.listbox.uiState.selected() === this),
  };
}

@Directive({
  selector: '[tbd-listbox]',
  standalone: true,
  exportAs: 'Listbox',
  host: {
    'role': 'listbox',
    '[tabindex]': 'uiState.tabindex()',
    '[attr.disabled]': 'uiState.disabled()',
    '[attr.aria-orientation]': 'uiState.orientation()',
    '[attr.aria-activedescendant]': 'uiState.activeDescendantId()',
    '(keydown)': 'uiState.keydownEvents.dispatch($event)',
    '(focusin)': 'uiState.focusinEvents.dispatch($event)',
    '(focusout)': 'uiState.focusoutEvents.dispatch($event)',
  },
})
export class Listbox {
  private readonly injector = inject(Injector);
  private readonly directionality = inject(Directionality);

  // Declare our inputs.
  protected readonly options = input<Partial<ListboxOptions>>({});
  protected readonly disabled = input(false);
  protected readonly active = input<ListboxOption | undefined>(undefined);
  protected readonly selected = input<ListboxOption | undefined>(undefined);
  protected readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly items = contentChildren(ListboxOption);

  // Set up our internal state.
  private readonly disabledByState = signal(false);
  readonly uiState = {
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    disabledByState: this.disabledByState,
    disabled: computed(() => this.disabled() || this.disabledByState()),
    tabindex: signal<number | undefined>(undefined),
    active: derivedSignal<ListboxOption | undefined>(() => this.active()),
    selected: derivedSignal<ListboxOption | undefined>(() => this.selected()),
    activeDescendantId: signal<string | undefined>(undefined),
    orientation: this.orientation,
    direction: toSignal(this.directionality.change, {
      initialValue: this.directionality.value,
    }),
    items: computed(() => this.items().map(item => item.uiState)),
    keydownEvents: new EventDispatcher<KeyboardEvent>(),
    focusinEvents: new EventDispatcher<FocusEvent>(),
    focusoutEvents: new EventDispatcher<FocusEvent>(),
  };

  // Attach behaviors to the state.
  private readonly navigationBehavior = computed(
    () => new ListNavigationBehavior(this.uiState, {wrap: this.options().wrapKeyNavigation}),
  );
  private readonly focusBehavior = computed(() =>
    this.options().useActiveDescendant
      ? new ActiveDescendantFocusBehavior(this.uiState)
      : new RovingTabindexFocusBehavior(this.uiState),
  );
  private readonly selectionBehavior = computed(() =>
    this.options().selectionFollowsFocus
      ? new ListFollowFocusSelectionBehavior(this.uiState)
      : new ListExplicitSelectionBehavior(this.uiState),
  );

  constructor() {
    // Sync our behavior state back to our internal state.
    effect(
      () => {
        const {active} = this.navigationBehavior().state();
        this.uiState.active.set(active);
      },
      {allowSignalWrites: true},
    );
    effect(
      () => {
        const {tabindex, active, activeDescendantId, items, focused} = this.focusBehavior().state();
        this.uiState.tabindex.set(tabindex);
        this.uiState.active.set(active);
        this.uiState.activeDescendantId.set(activeDescendantId);
        for (const [item, {tabindex}] of items) {
          item.uiState.tabindex.set(tabindex);
        }
        afterNextRender(() => focused?.focus(), {injector: this.injector});
      },
      {allowSignalWrites: true},
    );
    effect(
      () => {
        const {selected, disabledByState} = this.selectionBehavior().state();
        this.uiState.selected.set(selected);
        this.uiState.disabledByState.set(disabledByState);
      },
      {allowSignalWrites: true},
    );

    // Clean up our behaviors when they change.
    effect(onCleanup => {
      const behavior = this.navigationBehavior();
      onCleanup(() => behavior.remove());
    });
    effect(onCleanup => {
      const behavior = this.focusBehavior();
      onCleanup(() => behavior.remove());
    });
    effect(onCleanup => {
      const behavior = this.selectionBehavior();
      onCleanup(() => behavior.remove());
    });
  }
}
