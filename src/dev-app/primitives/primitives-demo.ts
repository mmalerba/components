import {Listbox, ListboxOption} from '@angular/cdk/a11y';
import {ChangeDetectionStrategy, Component, computed, signal, viewChild} from '@angular/core';

let nextItem = 0;

@Component({
  selector: 'primitives-demo',
  templateUrl: 'primitives-demo.html',
  styleUrl: 'primitives-demo.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Listbox, ListboxOption],
  host: {
    '(document:keydown)': 'handleKeydown($event)',
  },
})
export class PrimitivesDemo {
  wrap = signal(false);
  useActiveDescendant = signal(true);
  options = computed(() => ({
    wrapKeyNavigation: this.wrap(),
    useActiveDescendant: this.useActiveDescendant(),
  }));
  items = signal(Array.from({length: 10}, (_, i) => `item-${i}`));
  listbox = viewChild.required(Listbox);
  disabled = signal<ListboxOption[]>([]);

  handleKeydown(event: KeyboardEvent) {
    const active = this.listbox().active();
    switch (event.key) {
      case 'f':
        this.useActiveDescendant.update(useActiveDescendant => !useActiveDescendant);
        break;
      case 'w':
        this.wrap.update(wrap => !wrap);
        break;
      case 'r':
        if (active) {
          this.items.update(items => {
            items.splice(this.listbox().items().indexOf(active), 1);
            return [...items];
          });
        }
        break;
      case 'd':
        if (active) {
          this.disabled.update(disabled => [...disabled, active]);
        }
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        if (event.ctrlKey) {
          this.items.update(items => {
            items.splice(Number(event.key), 1);
            return [...items];
          });
        } else {
          this.items.update(items => {
            items.splice(Number(event.key), 0, `added-item-${nextItem++}`);
            return [...items];
          });
        }
        break;
    }
  }
}
