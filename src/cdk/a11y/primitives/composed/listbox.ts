import {Directionality} from '@angular/cdk/bidi';
import {
  computed,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {AriaActiveDescendantBehavior} from '../behaviors/aria-active-descendant';
import {EventDispatcher} from '../behaviors/base';
import {ListKeyNavigationBehavior} from '../behaviors/list-key-navigation';
import {RovingTabindexBehavior} from '../behaviors/roving-tabindex';

export interface ListboxOptions {
  wrapKeyNavigation: boolean;
  useActiveDescendant: boolean;
}

export const DEFAULT_LISTBOX_OPTIONS: ListboxOptions = {
  wrapKeyNavigation: false,
  useActiveDescendant: true,
};

let nextId = 0;

@Directive({
  selector: '[tbd-listbox-option]',
  standalone: true,
  exportAs: 'ListboxOption',
  host: {
    'role': 'option',
    '[id]': 'id()',
    '[attr.disabled]': 'disabled()',
    '[attr.tabindex]': 'tabindex()',
    '[class.active]': 'active()',
  },
})
export class ListboxOption {
  private readonly listbox = inject(Listbox);

  readonly identity = this;
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly disabled = input(false);
  readonly tabindex = signal<number | undefined>(undefined);
  readonly id = signal<string>(`tbd-listbox-option-${nextId++}`);
  readonly active = computed(() => this.listbox.active()?.identity === this.identity);
}

@Directive({
  selector: '[tbd-listbox]',
  standalone: true,
  exportAs: 'Listbox',
  host: {
    'role': 'listbox',
    '[tabindex]': 'tabindex()',
    '[attr.disabled]': 'disabled()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-activedescendant]': 'activeDescendantId()',
    '(keydown)': 'keydownEvents.dispatch($event)',
    '(focusin)': 'focusinEvents.dispatch($event)',
    '(focusout)': 'focusoutEvents.dispatch($event)',
  },
})
export class Listbox {
  private readonly directionality = inject(Directionality);
  private readonly injector = inject(Injector);

  readonly options = input<Partial<ListboxOptions>>({});

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly disabled = input(false);
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly activeDescendantId = signal<string | undefined>(undefined);
  readonly tabindex = signal<number | undefined>(undefined);
  readonly active = model<ListboxOption | undefined>();
  readonly selected = model<ListboxOption | undefined>();
  readonly direction = toSignal(this.directionality.change, {
    initialValue: this.directionality.value,
  });
  readonly items = contentChildren(ListboxOption);
  readonly focusinEvents = new EventDispatcher<FocusEvent>();
  readonly focusoutEvents = new EventDispatcher<FocusEvent>();
  readonly keydownEvents = new EventDispatcher<KeyboardEvent>();

  protected navigationBehavior: ListKeyNavigationBehavior<ListboxOption> | undefined;
  protected focusBehavior:
    | AriaActiveDescendantBehavior<ListboxOption>
    | RovingTabindexBehavior<ListboxOption>
    | undefined;

  constructor() {
    effect(onCleanup => {
      const options = {...DEFAULT_LISTBOX_OPTIONS, ...this.options()};

      untracked(() => {
        runInInjectionContext(this.injector, () => {
          this.navigationBehavior = new ListKeyNavigationBehavior(this, {
            wrap: options.wrapKeyNavigation,
          });
          this.focusBehavior = options.useActiveDescendant
            ? new AriaActiveDescendantBehavior(this)
            : new RovingTabindexBehavior(this);
        });
      });

      onCleanup(() => {
        this.navigationBehavior?.remove();
        this.focusBehavior?.remove();
      });
    });
  }
}
