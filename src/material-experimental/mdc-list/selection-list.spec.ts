import {A, D, DOWN_ARROW, END, ENTER, HOME, SPACE, UP_ARROW} from '@angular/cdk/keycodes';
import {
  createKeyboardEvent,
  dispatchEvent,
  dispatchFakeEvent,
  dispatchKeyboardEvent,
  dispatchMouseEvent,
} from '@angular/cdk/testing/private';
import {
  ChangeDetectionStrategy,
  Component,
  DebugElement,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  waitForAsync,
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import {FormControl, FormsModule, NgModel, ReactiveFormsModule} from '@angular/forms';
import {defaultRippleAnimationConfig, ThemePalette} from '@angular/material/core';
import {By} from '@angular/platform-browser';
import {numbers} from '@material/list';
import {MatListModule, MatListOption, MatSelectionList, MatSelectionListChange} from './index';

describe('MDC-based MatSelectionList without forms', () => {
  describe('with list option', () => {
    let fixture: ComponentFixture<SelectionListWithListOptions>;
    let listOptions: DebugElement[];
    let selectionList: DebugElement;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MatListModule],
        declarations: [
          SelectionListWithListOptions,
          SelectionListWithCheckboxPositionAfter,
          SelectionListWithListDisabled,
          SelectionListWithOnlyOneOption,
          SelectionListWithIndirectChildOptions,
          SelectionListWithSelectedOptionAndValue,
          SelectionListWithIndirectDescendantLines,
        ],
      });

      TestBed.compileComponents();
    }));

    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(SelectionListWithListOptions);
      fixture.detectChanges();

      listOptions = fixture.debugElement.queryAll(By.directive(MatListOption));
      selectionList = fixture.debugElement.query(By.directive(MatSelectionList))!;
    }));

    function getFocusIndex() {
      return listOptions.findIndex(o => document.activeElement === o.nativeElement);
    }

    it('should be able to set a value on a list option', () => {
      const optionValues = ['inbox', 'starred', 'sent-mail', 'archive', 'drafts'];

      optionValues.forEach((optionValue, index) => {
        expect(listOptions[index].componentInstance.value).toBe(optionValue);
      });
    });

    it('should not emit a selectionChange event if an option changed programmatically', () => {
      spyOn(fixture.componentInstance, 'onValueChange');

      expect(fixture.componentInstance.onValueChange).toHaveBeenCalledTimes(0);

      listOptions[2].componentInstance.toggle();
      fixture.detectChanges();

      expect(fixture.componentInstance.onValueChange).toHaveBeenCalledTimes(0);
    });

    it('should emit a selectionChange event if an option got clicked', () => {
      spyOn(fixture.componentInstance, 'onValueChange');

      expect(fixture.componentInstance.onValueChange).toHaveBeenCalledTimes(0);

      dispatchMouseEvent(listOptions[2].nativeElement, 'click');
      fixture.detectChanges();

      expect(fixture.componentInstance.onValueChange).toHaveBeenCalledTimes(1);
    });

    it('should be able to dispatch one selected item', () => {
      let testListItem = listOptions[2].injector.get<MatListOption>(MatListOption);
      let selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;

      expect(selectList.selected.length).toBe(0);
      expect(listOptions[2].nativeElement.getAttribute('aria-selected')).toBe('false');

      testListItem.toggle();
      fixture.detectChanges();

      expect(listOptions[2].nativeElement.getAttribute('aria-selected')).toBe('true');
      expect(listOptions[2].nativeElement.getAttribute('aria-disabled')).toBe('false');
      expect(selectList.selected.length).toBe(1);
    });

    it('should be able to dispatch multiple selected items', () => {
      let testListItem = listOptions[2].injector.get<MatListOption>(MatListOption);
      let testListItem2 = listOptions[1].injector.get<MatListOption>(MatListOption);
      let selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;

      expect(selectList.selected.length).toBe(0);
      expect(listOptions[2].nativeElement.getAttribute('aria-selected')).toBe('false');
      expect(listOptions[1].nativeElement.getAttribute('aria-selected')).toBe('false');

      testListItem.toggle();
      fixture.detectChanges();

      testListItem2.toggle();
      fixture.detectChanges();

      expect(selectList.selected.length).toBe(2);
      expect(listOptions[2].nativeElement.getAttribute('aria-selected')).toBe('true');
      expect(listOptions[1].nativeElement.getAttribute('aria-selected')).toBe('true');
      expect(listOptions[1].nativeElement.getAttribute('aria-disabled')).toBe('false');
      expect(listOptions[2].nativeElement.getAttribute('aria-disabled')).toBe('false');
    });

    it('should be able to specify a color for list options', () => {
      const optionNativeElements = listOptions.map(option => option.nativeElement);

      expect(optionNativeElements.every(option => !option.classList.contains('mat-primary')))
        .toBe(true);
      expect(optionNativeElements.every(option => !option.classList.contains('mat-warn')))
        .toBe(true);

      // All options will be set to the "warn" color.
      fixture.componentInstance.selectionListColor = 'warn';
      fixture.detectChanges();

      expect(optionNativeElements.every(option => !option.classList.contains('mat-primary')))
        .toBe(true);
      expect(optionNativeElements.every(option => option.classList.contains('mat-warn')))
        .toBe(true);

      // Color will be set explicitly for an option and should take precedence.
      fixture.componentInstance.firstOptionColor = 'primary';
      fixture.detectChanges();

      expect(optionNativeElements[0].classList).not.toContain('mat-accent');
      expect(optionNativeElements[0].classList).not.toContain('mat-warn');
      expect(optionNativeElements.slice(1).every(option => option.classList.contains('mat-warn')))
        .toBe(true);
    });

    it('should explicitly set the `accent` color', () => {
      const classList = listOptions[0].nativeElement.classList;

      fixture.componentInstance.firstOptionColor = 'primary';
      fixture.detectChanges();

      expect(classList).not.toContain('mat-accent');
      expect(classList).not.toContain('mat-warn');

      fixture.componentInstance.firstOptionColor = 'accent';
      fixture.detectChanges();

      expect(classList).not.toContain('mat-primary');
      expect(classList).toContain('mat-accent');
      expect(classList).not.toContain('mat-warn');
    });

    it('should be able to deselect an option', () => {
      let testListItem = listOptions[2].injector.get<MatListOption>(MatListOption);
      let selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;

      expect(selectList.selected.length).toBe(0);

      testListItem.toggle();
      fixture.detectChanges();

      expect(selectList.selected.length).toBe(1);

      testListItem.toggle();
      fixture.detectChanges();

      expect(selectList.selected.length).toBe(0);
    });

    it('should not add the mdc-list-item--selected class (in multiple mode)', () => {
      let testListItem = listOptions[2].injector.get<MatListOption>(MatListOption);

      dispatchMouseEvent(testListItem._hostElement, 'click');
      fixture.detectChanges();

      expect(listOptions[2].nativeElement.classList.contains('mdc-list-item--selected'))
        .toBe(false);
    });

    it('should not allow selection of disabled items', () => {
      let testListItem = listOptions[0].injector.get<MatListOption>(MatListOption);
      let selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;

      expect(selectList.selected.length).toBe(0);
      expect(listOptions[0].nativeElement.getAttribute('aria-disabled')).toBe('true');

      dispatchMouseEvent(testListItem._hostElement, 'click');
      fixture.detectChanges();

      expect(selectList.selected.length).toBe(0);
    });

    it('should be able to un-disable disabled items', () => {
      let testListItem = listOptions[0].injector.get<MatListOption>(MatListOption);

      expect(listOptions[0].nativeElement.getAttribute('aria-disabled')).toBe('true');

      testListItem.disabled = false;
      fixture.detectChanges();

      expect(listOptions[0].nativeElement.getAttribute('aria-disabled')).toBe('false');
    });

    it('should be able to use keyboard select with SPACE', () => {
      const testListItem = listOptions[1].nativeElement as HTMLElement;
      const selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;
      expect(selectList.selected.length).toBe(0);

      testListItem.focus();
      expect(getFocusIndex()).toBe(1);

      const event = dispatchKeyboardEvent(testListItem, 'keydown', SPACE);
      fixture.detectChanges();

      expect(selectList.selected.length).toBe(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should be able to select an item using ENTER', () => {
      const testListItem = listOptions[1].nativeElement as HTMLElement;
      const selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;
      expect(selectList.selected.length).toBe(0);

      testListItem.focus();
      expect(getFocusIndex()).toBe(1);

      const event = dispatchKeyboardEvent(testListItem, 'keydown', ENTER);
      fixture.detectChanges();

      expect(selectList.selected.length).toBe(1);
      expect(event.defaultPrevented).toBe(true);
    });

    // MDC does not respect modifier keys, so this test always fails currently.
    // Tracked with: https://github.com/material-components/material-components-web/issues/6365.
    // tslint:disable-next-line:ban
    xit('should not be able to toggle an item when pressing a modifier key', () => {
      const testListItem = listOptions[1].nativeElement as HTMLElement;
      const selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;

      expect(selectList.selected.length).toBe(0);

      [ENTER, SPACE].forEach(key => {
        const event = createKeyboardEvent('keydown', key, undefined, {control: true});

        testListItem.focus();
        expect(getFocusIndex()).toBe(1);

        dispatchKeyboardEvent(testListItem, 'keydown', key, undefined, {control: true});
        fixture.detectChanges();

        expect(event.defaultPrevented).toBe(false);
      });

      expect(selectList.selected.length).toBe(0);
    });

    it('should not be able to toggle a disabled option using SPACE', () => {
      const testListItem = listOptions[1].nativeElement as HTMLElement;
      const selectionModel = selectionList.componentInstance.selectedOptions;

      expect(selectionModel.selected.length).toBe(0);

      listOptions[1].componentInstance.disabled = true;
      fixture.detectChanges();

      testListItem.focus();
      expect(getFocusIndex()).toBe(1);

      dispatchKeyboardEvent(testListItem, 'keydown', SPACE);
      fixture.detectChanges();

      expect(selectionModel.selected.length).toBe(0);
    });

    it('should focus the first option when the list takes focus for the first time', () => {
      expect(listOptions[0].nativeElement.tabIndex).toBe(0);
      expect(listOptions.slice(1).every(o => o.nativeElement.tabIndex === -1)).toBe(true);
    });

    it('should focus the previously focused option when the list takes focus a second time',
        fakeAsync(() => {
      expect(listOptions[0].nativeElement.tabIndex).toBe(0);
      expect(listOptions[1].nativeElement.tabIndex).toBe(-1);

      dispatchFakeEvent(listOptions[1].nativeElement, 'focusin', true);
      dispatchFakeEvent(listOptions[1].nativeElement, 'focusout', true);
      tick(1);

      expect(listOptions[0].nativeElement.tabIndex).toBe(-1);
      expect(listOptions[1].nativeElement.tabIndex).toBe(0);
    }));

    it('should focus previous item when press UP ARROW', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toEqual(2);

      dispatchKeyboardEvent(listOptions[2].nativeElement, 'keydown', UP_ARROW);
      fixture.detectChanges();

      expect(getFocusIndex()).toEqual(1);
    });

    // MDC does not support SHIFT + ARROW for item selection. Tracked as feature request:
    // https://github.com/material-components/material-components-web/issues/6364.
    // tslint:disable-next-line:ban
    xit('should focus and toggle the next item when pressing SHIFT + UP_ARROW', () => {
      listOptions[3].nativeElement.focus();
      expect(getFocusIndex()).toBe(3);

      expect(listOptions[1].componentInstance.selected).toBe(false);
      expect(listOptions[2].componentInstance.selected).toBe(false);

      dispatchKeyboardEvent(listOptions[3].nativeElement, 'keydown', UP_ARROW,
          undefined, {shift: true});
      fixture.detectChanges();

      expect(listOptions[1].componentInstance.selected).toBe(false);
      expect(listOptions[2].componentInstance.selected).toBe(true);

      dispatchKeyboardEvent(listOptions[2].nativeElement, 'keydown', UP_ARROW,
        undefined, {shift: true});
      fixture.detectChanges();

      expect(listOptions[1].componentInstance.selected).toBe(true);
      expect(listOptions[2].componentInstance.selected).toBe(true);
    });

    // MDC does not support SHIFT + ARROW for item selection. Tracked as feature request:
    // https://github.com/material-components/material-components-web/issues/6364.
    // tslint:disable-next-line:ban
    xit('should focus and toggle the next item when pressing SHIFT + DOWN_ARROW', () => {
      listOptions[0].nativeElement.focus();
      expect(getFocusIndex()).toBe(0);

      expect(listOptions[1].componentInstance.selected).toBe(false);
      expect(listOptions[2].componentInstance.selected).toBe(false);

      dispatchKeyboardEvent(listOptions[0].nativeElement, 'keydown', DOWN_ARROW,
          undefined, {shift: true});
      fixture.detectChanges();

      expect(listOptions[1].componentInstance.selected).toBe(true);
      expect(listOptions[2].componentInstance.selected).toBe(false);

      dispatchKeyboardEvent(listOptions[1].nativeElement, 'keydown', DOWN_ARROW,
        undefined, {shift: true});
      fixture.detectChanges();

      expect(listOptions[1].componentInstance.selected).toBe(true);
      expect(listOptions[2].componentInstance.selected).toBe(true);
    });

    it('should focus next item when press DOWN ARROW', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toEqual(2);

      dispatchKeyboardEvent(listOptions[2].nativeElement, 'keydown', DOWN_ARROW);
      fixture.detectChanges();

      expect(getFocusIndex()).toEqual(3);
    });

    it('should be able to focus the first item when pressing HOME', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toBe(2);

      const event = dispatchKeyboardEvent(listOptions[2].nativeElement, 'keydown', HOME);
      fixture.detectChanges();

      expect(getFocusIndex()).toBe(0);
      expect(event.defaultPrevented).toBe(true);
    });

    // MDC does not respect the modifier keys. Bug tracked with:
    // https://github.com/material-components/material-components-web/issues/6365.
    // tslint:disable-next-line:ban
    xit('should not change focus when pressing HOME with a modifier key', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toBe(2);

      const event = createKeyboardEvent('keydown', HOME, undefined, {shift: true});

      dispatchEvent(listOptions[2].nativeElement, event);
      fixture.detectChanges();

      expect(getFocusIndex()).toBe(2);
      expect(event.defaultPrevented).toBe(false);
    });

    it('should focus the last item when pressing END', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toBe(2);

      const event = dispatchKeyboardEvent(listOptions[2].nativeElement, 'keydown', END);
      fixture.detectChanges();

      expect(getFocusIndex()).toBe(4);
      expect(event.defaultPrevented).toBe(true);
    });

    // MDC does not respect the modifier keys. Bug tracked with:
    // https://github.com/material-components/material-components-web/issues/6365.
    // tslint:disable-next-line:ban
    xit('should not change focus when pressing END with a modifier key', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toBe(2);

      const event = createKeyboardEvent('keydown', END, undefined, {shift: true});

      dispatchEvent(listOptions[2].nativeElement, event);
      fixture.detectChanges();

      expect(getFocusIndex()).toBe(2);
      expect(event.defaultPrevented).toBe(false);
    });

    // MDC does not support the common CTRL + A keyboard shortcut.
    // Tracked with: https://github.com/material-components/material-components-web/issues/6366
    // tslint:disable-next-line:ban
    xit('should select all items using ctrl + a', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toBe(2);

      listOptions.forEach(option => option.componentInstance.disabled = false);
      const event = createKeyboardEvent('keydown', A, undefined, {control: true});

      expect(listOptions.some(option => option.componentInstance.selected)).toBe(false);

      dispatchEvent(listOptions[2].nativeElement, event);
      fixture.detectChanges();

      expect(listOptions.every(option => option.componentInstance.selected)).toBe(true);
    });

    // MDC does not support the common CTRL + A keyboard shortcut.
    // Tracked with: https://github.com/material-components/material-components-web/issues/6366
    // tslint:disable-next-line:ban
    xit('should not select disabled items when pressing ctrl + a', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toBe(2);

      const event = createKeyboardEvent('keydown', A, undefined, {control: true});

      listOptions.slice(0, 2).forEach(option => option.componentInstance.disabled = true);
      fixture.detectChanges();

      expect(listOptions.map(option => option.componentInstance.selected))
        .toEqual([false, false, false, false, false]);

      dispatchEvent(listOptions[2].nativeElement, event);
      fixture.detectChanges();

      expect(listOptions.map(option => option.componentInstance.selected))
        .toEqual([false, false, true, true, true]);
    });

    // MDC does not support the common CTRL + A keyboard shortcut.
    // Tracked with: https://github.com/material-components/material-components-web/issues/6366
    // tslint:disable-next-line:ban
    xit('should select all items using ctrl + a if some items are selected', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toBe(2);

      const event = createKeyboardEvent('keydown', A, undefined, {control: true});

      listOptions.slice(0, 2).forEach(option => option.componentInstance.selected = true);
      fixture.detectChanges();

      expect(listOptions.some(option => option.componentInstance.selected)).toBe(true);

      dispatchEvent(listOptions[2].nativeElement, event);
      fixture.detectChanges();

      expect(listOptions.every(option => option.componentInstance.selected)).toBe(true);
    });

    // MDC does not support the common CTRL + A keyboard shortcut.
    // Tracked with: https://github.com/material-components/material-components-web/issues/6366
    // tslint:disable-next-line:ban
    xit('should deselect all with ctrl + a if all options are selected', () => {
      listOptions[2].nativeElement.focus();
      expect(getFocusIndex()).toBe(2);

      const event = createKeyboardEvent('keydown', A, undefined, {control: true});

      listOptions.forEach(option => option.componentInstance.selected = true);
      fixture.detectChanges();

      expect(listOptions.every(option => option.componentInstance.selected)).toBe(true);

      dispatchEvent(listOptions[2].nativeElement, event);
      fixture.detectChanges();

      expect(listOptions.every(option => option.componentInstance.selected)).toBe(false);
    });

    it('should be able to jump focus down to an item by typing', fakeAsync(() => {
      const firstOption = listOptions[0].nativeElement;

      firstOption.focus();
      expect(getFocusIndex()).toBe(0);

      dispatchEvent(firstOption, createKeyboardEvent('keydown', 83, 's'));
      fixture.detectChanges();
      tick(numbers.TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS);

      expect(getFocusIndex()).toBe(1);

      dispatchEvent(firstOption, createKeyboardEvent('keydown', 68, 'd'));
      fixture.detectChanges();
      tick(numbers.TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS);

      expect(getFocusIndex()).toBe(4);
    }));

    it('should be able to skip to an item by typing', fakeAsync(() => {
      listOptions[0].nativeElement.focus();
      expect(getFocusIndex()).toBe(0);

      dispatchKeyboardEvent(listOptions[0].nativeElement, 'keydown', D, 'd');
      fixture.detectChanges();
      tick(numbers.TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS);

      expect(getFocusIndex()).toBe(4);
    }));

    // Test for "A" specifically, because it's a special case that can be used
    // to select all values.
    it('should be able to skip to an item by typing the letter "A"', fakeAsync(() => {
      listOptions[0].nativeElement.focus();
      expect(getFocusIndex()).toBe(0);

      dispatchKeyboardEvent(listOptions[0].nativeElement, 'keydown', A, 'a');
      fixture.detectChanges();
      tick(numbers.TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS);

      expect(getFocusIndex()).toBe(3);
    }));

    it('should not select items while using the typeahead', fakeAsync(() => {
      const testListItem = listOptions[1].nativeElement as HTMLElement;
      const model =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;

      testListItem.focus();
      dispatchFakeEvent(testListItem, 'focus');
      fixture.detectChanges();

      expect(getFocusIndex()).toBe(1);
      expect(model.isEmpty()).toBe(true);

      dispatchKeyboardEvent(testListItem, 'keydown', D, 'd');
      fixture.detectChanges();
      tick(numbers.TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS / 2); // Tick only half the typeahead timeout.

      dispatchKeyboardEvent(testListItem, 'keydown', SPACE);
      fixture.detectChanges();
      // Tick the buffer timeout again as a new key has been pressed that resets
      // the buffer timeout.
      tick(numbers.TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS);

      expect(getFocusIndex()).toBe(4);
      expect(model.isEmpty()).toBe(true);
    }));

    it('should be able to select all options', () => {
      const list: MatSelectionList = selectionList.componentInstance;

      expect(list.options.toArray().every(option => option.selected)).toBe(false);

      list.selectAll();
      fixture.detectChanges();

      expect(list.options.toArray().every(option => option.selected)).toBe(true);
    });

    it('should be able to select all options, even if they are disabled', () => {
      const list: MatSelectionList = selectionList.componentInstance;

      list.options.forEach(option => option.disabled = true);
      fixture.detectChanges();

      expect(list.options.toArray().every(option => option.selected)).toBe(false);

      list.selectAll();
      fixture.detectChanges();

      expect(list.options.toArray().every(option => option.selected)).toBe(true);
    });

    it('should be able to deselect all options', () => {
      const list: MatSelectionList = selectionList.componentInstance;

      list.options.forEach(option => option.toggle());
      expect(list.options.toArray().every(option => option.selected)).toBe(true);

      list.deselectAll();
      fixture.detectChanges();

      expect(list.options.toArray().every(option => option.selected)).toBe(false);
    });

    it('should be able to deselect all options, even if they are disabled', () => {
      const list: MatSelectionList = selectionList.componentInstance;

      list.options.forEach(option => option.toggle());
      expect(list.options.toArray().every(option => option.selected)).toBe(true);

      list.options.forEach(option => option.disabled = true);
      fixture.detectChanges();

      list.deselectAll();
      fixture.detectChanges();

      expect(list.options.toArray().every(option => option.selected)).toBe(false);
    });

    it('should update the list value when an item is selected programmatically', () => {
      const list: MatSelectionList = selectionList.componentInstance;

      expect(list.selectedOptions.isEmpty()).toBe(true);

      listOptions[0].componentInstance.selected = true;
      listOptions[2].componentInstance.selected = true;
      fixture.detectChanges();

      expect(list.selectedOptions.isEmpty()).toBe(false);
      expect(list.selectedOptions.isSelected(listOptions[0].componentInstance)).toBe(true);
      expect(list.selectedOptions.isSelected(listOptions[2].componentInstance)).toBe(true);
    });

    it('should update the item selected state when it is selected via the model', () => {
      const list: MatSelectionList = selectionList.componentInstance;
      const item: MatListOption = listOptions[0].componentInstance;

      expect(item.selected).toBe(false);

      list.selectedOptions.select(item);
      fixture.detectChanges();

      expect(item.selected).toBe(true);
    });

    it('should set aria-multiselectable to true on the selection list element', () => {
      expect(selectionList.nativeElement.getAttribute('aria-multiselectable')).toBe('true');
    });

    it('should be able to reach list options that are indirect descendants', () => {
      const descendatsFixture = TestBed.createComponent(SelectionListWithIndirectChildOptions);
      descendatsFixture.detectChanges();
      listOptions = descendatsFixture.debugElement.queryAll(By.directive(MatListOption));
      selectionList = descendatsFixture.debugElement.query(By.directive(MatSelectionList))!;
      const list: MatSelectionList = selectionList.componentInstance;

      expect(list.options.toArray().every(option => option.selected)).toBe(false);

      list.selectAll();
      descendatsFixture.detectChanges();

      expect(list.options.toArray().every(option => option.selected)).toBe(true);
    });

    it('should disable list item ripples when the ripples on the list have been disabled',
      fakeAsync(() => {
        const rippleTarget = fixture.nativeElement
          .querySelector('.mat-mdc-list-option:not(.mdc-list-item--disabled)');
        const {enterDuration, exitDuration} = defaultRippleAnimationConfig;

        dispatchMouseEvent(rippleTarget, 'mousedown');
        dispatchMouseEvent(rippleTarget, 'mouseup');

        expect(rippleTarget.querySelectorAll('.mat-ripple-element').length)
          .toBe(1, 'Expected ripples to be enabled by default.');

        // Wait for the ripples to go away.
        tick(enterDuration + exitDuration);
        expect(rippleTarget.querySelectorAll('.mat-ripple-element').length)
          .toBe(0, 'Expected ripples to go away.');

        fixture.componentInstance.listRippleDisabled = true;
        fixture.detectChanges();

        dispatchMouseEvent(rippleTarget, 'mousedown');
        dispatchMouseEvent(rippleTarget, 'mouseup');

        expect(rippleTarget.querySelectorAll('.mat-ripple-element').length)
          .toBe(0, 'Expected no ripples after list ripples are disabled.');
      }));

    it('can bind both selected and value at the same time', () => {
      const componentFixture = TestBed.createComponent(SelectionListWithSelectedOptionAndValue);
      componentFixture.detectChanges();
      const listItemEl = componentFixture.debugElement.query(By.directive(MatListOption))!;
      expect(listItemEl.componentInstance.selected).toBe(true);
      expect(listItemEl.componentInstance.value).toBe(componentFixture.componentInstance.itemValue);
    });

    it('should pick up indirect descendant lines', () => {
      const componentFixture = TestBed.createComponent(SelectionListWithIndirectDescendantLines);
      componentFixture.detectChanges();

      const option = componentFixture.nativeElement.querySelector('mat-list-option');
      expect(option.classList).toContain('mat-mdc-2-line');
    });

    it('should have a focus indicator', () => {
      const optionNativeElements = listOptions.map(option => option.nativeElement);

      expect(optionNativeElements
        .every(element => element.classList.contains('mat-mdc-focus-indicator'))).toBe(true);
    });

  });

  describe('with list option selected', () => {
    let fixture: ComponentFixture<SelectionListWithSelectedOption>;
    let listItemEl: DebugElement;
    let selectionList: DebugElement;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MatListModule],
        declarations: [SelectionListWithSelectedOption],
      });

      TestBed.compileComponents();
    }));

    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(SelectionListWithSelectedOption);
      listItemEl = fixture.debugElement.query(By.directive(MatListOption))!;
      selectionList = fixture.debugElement.query(By.directive(MatSelectionList))!;
      fixture.detectChanges();
    }));

    it('should set its initial selected state in the selectedOptions', () => {
      let optionEl = listItemEl.injector.get<MatListOption>(MatListOption);
      let selectedOptions = selectionList.componentInstance.selectedOptions;
      expect(selectedOptions.isSelected(optionEl)).toBeTruthy();
    });
  });

  describe('with option disabled', () => {
    let fixture: ComponentFixture<SelectionListWithDisabledOption>;
    let listOptionEl: HTMLElement;
    let listOption: MatListOption;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MatListModule],
        declarations: [SelectionListWithDisabledOption]
      });

      TestBed.compileComponents();
    }));

    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(SelectionListWithDisabledOption);

      const listOptionDebug = fixture.debugElement.query(By.directive(MatListOption))!;

      listOption = listOptionDebug.componentInstance;
      listOptionEl = listOptionDebug.nativeElement;

      fixture.detectChanges();
    }));

    it('should disable ripples for disabled option', () => {
      expect(listOption.rippleDisabled)
        .toBe(false, 'Expected ripples to be enabled by default');

      fixture.componentInstance.disableItem = true;
      fixture.detectChanges();

      expect(listOption.rippleDisabled)
        .toBe(true, 'Expected ripples to be disabled if option is disabled');
    });

    it('should apply the "mat-list-item-disabled" class properly', () => {
      expect(listOptionEl.classList).not.toContain('mdc-list-item--disabled');

      fixture.componentInstance.disableItem = true;
      fixture.detectChanges();

      expect(listOptionEl.classList).toContain('mdc-list-item--disabled');
    });
  });

  describe('with list disabled', () => {
    let fixture: ComponentFixture<SelectionListWithListDisabled>;
    let listOption: DebugElement[];
    let selectionList: DebugElement;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MatListModule],
        declarations: [
          SelectionListWithListOptions,
          SelectionListWithCheckboxPositionAfter,
          SelectionListWithListDisabled,
          SelectionListWithOnlyOneOption
        ],
      });

      TestBed.compileComponents();
    }));

    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(SelectionListWithListDisabled);
      listOption = fixture.debugElement.queryAll(By.directive(MatListOption));
      selectionList = fixture.debugElement.query(By.directive(MatSelectionList))!;
      fixture.detectChanges();
    }));

    it('should not allow selection on disabled selection-list', () => {
      let testListItem = listOption[2].injector.get<MatListOption>(MatListOption);
      let selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;

      expect(selectList.selected.length).toBe(0);

      dispatchMouseEvent(testListItem._hostElement, 'click');
      fixture.detectChanges();

      expect(selectList.selected.length).toBe(0);
    });

    it('should update state of options if list state has changed', () => {
      const testOption = listOption[2].componentInstance as MatListOption;

      expect(testOption.rippleDisabled)
        .toBe(true, 'Expected ripples of list option to be disabled');

      fixture.componentInstance.disabled = false;
      fixture.detectChanges();

      expect(testOption.rippleDisabled)
        .toBe(false, 'Expected ripples of list option to be enabled');
    });
  });

  describe('with checkbox position after', () => {
    let fixture: ComponentFixture<SelectionListWithCheckboxPositionAfter>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MatListModule],
        declarations: [
          SelectionListWithListOptions,
          SelectionListWithCheckboxPositionAfter,
          SelectionListWithListDisabled,
          SelectionListWithOnlyOneOption
        ],
      });

      TestBed.compileComponents();
    }));

    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(SelectionListWithCheckboxPositionAfter);
      fixture.detectChanges();
    }));

    it('should be able to customize checkbox position', () => {
      expect(fixture.nativeElement.querySelector('.mdc-list-item__meta .mdc-checkbox'))
        .toBeTruthy('Expected checkbox to show up after content.');
      expect(fixture.nativeElement.querySelector('.mdc-list-item__graphic .mdc-checkbox'))
        .toBeFalsy('Expected no checkbox to show up before content.');
    });
  });

  describe('with list item elements', () => {
    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MatListModule],
        declarations: [
          SelectionListWithAvatar,
          SelectionListWithIcon,
        ],
      }).compileComponents();
    }));

    it('should add a class to reflect that it has an avatar', () => {
      const fixture = TestBed.createComponent(SelectionListWithIcon);
      fixture.detectChanges();

      const listOption = fixture.nativeElement.querySelector('.mat-mdc-list-option');
      expect(listOption.classList).toContain('mat-mdc-list-item-with-avatar');
    });

    it('should add a class to reflect that it has an icon', () => {
      const fixture = TestBed.createComponent(SelectionListWithIcon);
      fixture.detectChanges();

      const listOption = fixture.nativeElement.querySelector('.mat-mdc-list-option');
      expect(listOption.classList).toContain('mat-mdc-list-item-with-avatar');
    });
  });

  describe('with single selection', () => {
    let fixture: ComponentFixture<SelectionListWithListOptions>;
    let listOptions: DebugElement[];
    let selectionList: DebugElement;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MatListModule],
        declarations: [
          SelectionListWithListOptions,
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(SelectionListWithListOptions);
      fixture.componentInstance.multiple = false;
      listOptions = fixture.debugElement.queryAll(By.directive(MatListOption));
      selectionList = fixture.debugElement.query(By.directive(MatSelectionList))!;
      fixture.detectChanges();
    }));

    function getFocusIndex() {
      return listOptions.findIndex(o => document.activeElement === o.nativeElement);
    }

    it('should select one option at a time', () => {
      const testListItem1 = listOptions[1].injector.get<MatListOption>(MatListOption);
      const testListItem2 = listOptions[2].injector.get<MatListOption>(MatListOption);
      const selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;

      expect(selectList.selected.length).toBe(0);

      dispatchMouseEvent(testListItem1._hostElement, 'click');
      fixture.detectChanges();

      expect(selectList.selected).toEqual([testListItem1]);
      expect(listOptions[1].nativeElement.classList.contains('mdc-list-item--selected'))
        .toBe(true);

      dispatchMouseEvent(testListItem2._hostElement, 'click');
      fixture.detectChanges();

      expect(selectList.selected).toEqual([testListItem2]);
      expect(listOptions[1].nativeElement.classList.contains('mdc-list-item--selected'))
        .toBe(false);
      expect(listOptions[2].nativeElement.classList.contains('mdc-list-item--selected'))
        .toBe(true);
    });

    it('should not show check boxes', () => {
      expect(fixture.nativeElement.querySelector('mat-pseudo-checkbox')).toBeFalsy();
    });

    it('should not deselect the target option on click', () => {
      const testListItem1 = listOptions[1].injector.get<MatListOption>(MatListOption);
      const selectList =
        selectionList.injector.get<MatSelectionList>(MatSelectionList).selectedOptions;

      expect(selectList.selected.length).toBe(0);

      dispatchMouseEvent(testListItem1._hostElement, 'click');
      fixture.detectChanges();

      expect(selectList.selected).toEqual([testListItem1]);

      dispatchMouseEvent(testListItem1._hostElement, 'click');
      fixture.detectChanges();

      expect(selectList.selected).toEqual([testListItem1]);
    });

    it('throws an exception when toggling single/multiple mode after bootstrap', () => {
      fixture.componentInstance.multiple = true;
      expect(() => fixture.detectChanges()).toThrow(new Error(
        'Cannot change `multiple` mode of mat-selection-list after initialization.'));
    });

    it('should do nothing when pressing ctrl + a', () => {
      const event = createKeyboardEvent('keydown', A, undefined, {control: true});

      expect(listOptions.every(option => !option.componentInstance.selected)).toBe(true);

      dispatchEvent(selectionList.nativeElement, event);
      fixture.detectChanges();

      expect(listOptions.every(option => !option.componentInstance.selected)).toBe(true);
    });

    it('should focus, but not toggle, the next item when pressing SHIFT + UP_ARROW in single ' +
        'selection mode', () => {
      listOptions[3].nativeElement.focus();
      expect(getFocusIndex()).toBe(3);

      expect(listOptions[1].componentInstance.selected).toBe(false);
      expect(listOptions[2].componentInstance.selected).toBe(false);

      dispatchKeyboardEvent(listOptions[3].nativeElement, 'keydown', UP_ARROW,
          undefined, {shift: true});
      fixture.detectChanges();

      expect(listOptions[1].componentInstance.selected).toBe(false);
      expect(listOptions[2].componentInstance.selected).toBe(false);
    });

    it('should focus, but not toggle, the next item when pressing SHIFT + DOWN_ARROW ' +
        'in single selection mode', () => {
      listOptions[3].nativeElement.focus();
      expect(getFocusIndex()).toBe(3);

      expect(listOptions[1].componentInstance.selected).toBe(false);
      expect(listOptions[2].componentInstance.selected).toBe(false);

      dispatchKeyboardEvent(listOptions[3].nativeElement, 'keydown', DOWN_ARROW,
        undefined, {shift: true});
      fixture.detectChanges();

      expect(listOptions[1].componentInstance.selected).toBe(false);
      expect(listOptions[2].componentInstance.selected).toBe(false);
    });

  });
});

describe('MDC-based MatSelectionList with forms', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatListModule, FormsModule, ReactiveFormsModule],
      declarations: [
        SelectionListWithModel,
        SelectionListWithFormControl,
        SelectionListWithPreselectedOption,
        SelectionListWithPreselectedOptionAndModel,
        SelectionListWithPreselectedFormControlOnPush,
        SelectionListWithCustomComparator,
      ]
    });

    TestBed.compileComponents();
  }));

  describe('and ngModel', () => {
    let fixture: ComponentFixture<SelectionListWithModel>;
    let selectionListDebug: DebugElement;
    let listOptions: MatListOption[];
    let ngModel: NgModel;

    beforeEach(() => {
      fixture = TestBed.createComponent(SelectionListWithModel);
      fixture.detectChanges();

      selectionListDebug = fixture.debugElement.query(By.directive(MatSelectionList))!;
      ngModel = selectionListDebug.injector.get<NgModel>(NgModel);
      listOptions = fixture.debugElement.queryAll(By.directive(MatListOption))
        .map(optionDebugEl => optionDebugEl.componentInstance);
    });

    it('should update the model if an option got selected programmatically', fakeAsync(() => {
      expect(fixture.componentInstance.selectedOptions.length)
        .toBe(0, 'Expected no options to be selected by default');

      listOptions[0].toggle();
      fixture.detectChanges();

      tick();

      expect(fixture.componentInstance.selectedOptions.length)
        .toBe(1, 'Expected first list option to be selected');
    }));

    it('should update the model if an option got clicked', fakeAsync(() => {
      expect(fixture.componentInstance.selectedOptions.length)
        .toBe(0, 'Expected no options to be selected by default');

      dispatchMouseEvent(listOptions[0]._hostElement, 'click');
      fixture.detectChanges();

      tick();

      expect(fixture.componentInstance.selectedOptions.length)
        .toBe(1, 'Expected first list option to be selected');
    }));

    it('should update the options if a model value is set', fakeAsync(() => {
      expect(fixture.componentInstance.selectedOptions.length)
        .toBe(0, 'Expected no options to be selected by default');

      fixture.componentInstance.selectedOptions = ['opt3'];
      fixture.detectChanges();

      tick();

      expect(fixture.componentInstance.selectedOptions.length)
        .toBe(1, 'Expected first list option to be selected');
    }));

    it('should not mark the model as touched when the list is blurred', fakeAsync(() => {
      expect(ngModel.touched)
        .toBe(false, 'Expected the selection-list to be untouched by default.');

      dispatchFakeEvent(selectionListDebug.nativeElement, 'blur');
      fixture.detectChanges();
      tick();

      expect(ngModel.touched).toBe(false, 'Expected the selection-list to remain untouched.');
    }));

    it('should mark the model as touched when a list item is blurred', fakeAsync(() => {
      expect(ngModel.touched)
        .toBe(false, 'Expected the selection-list to be untouched by default.');

      dispatchFakeEvent(fixture.nativeElement.querySelector('.mat-mdc-list-option'), 'blur');
      fixture.detectChanges();
      tick();

      expect(ngModel.touched)
        .toBe(true, 'Expected the selection-list to be touched after an item is blurred.');
    }));

    it('should be pristine by default', fakeAsync(() => {
      fixture = TestBed.createComponent(SelectionListWithModel);
      fixture.componentInstance.selectedOptions = ['opt2'];
      fixture.detectChanges();

      ngModel =
        fixture.debugElement.query(By.directive(MatSelectionList))!.injector.get<NgModel>(NgModel);
      listOptions = fixture.debugElement.queryAll(By.directive(MatListOption))
        .map(optionDebugEl => optionDebugEl.componentInstance);

      // Flush the initial tick to ensure that every action from the ControlValueAccessor
      // happened before the actual test starts.
      tick();

      expect(ngModel.pristine)
        .toBe(true, 'Expected the selection-list to be pristine by default.');

      listOptions[1].toggle();
      fixture.detectChanges();

      tick();

      expect(ngModel.pristine)
        .toBe(false, 'Expected the selection-list to be dirty after state change.');
    }));

    it('should remove a selected option from the value on destroy', fakeAsync(() => {
      listOptions[1].selected = true;
      listOptions[2].selected = true;

      fixture.detectChanges();

      expect(fixture.componentInstance.selectedOptions).toEqual(['opt2', 'opt3']);

      fixture.componentInstance.options.pop();
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.selectedOptions).toEqual(['opt2']);
    }));

    it('should update the model if an option got selected via the model', fakeAsync(() => {
      expect(fixture.componentInstance.selectedOptions).toEqual([]);

      selectionListDebug.componentInstance.selectedOptions.select(listOptions[0]);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.selectedOptions).toEqual(['opt1']);
    }));

    it('should not dispatch the model change event if nothing changed using selectAll', () => {
      expect(fixture.componentInstance.modelChangeSpy).not.toHaveBeenCalled();

      selectionListDebug.componentInstance.selectAll();
      fixture.detectChanges();

      expect(fixture.componentInstance.modelChangeSpy).toHaveBeenCalledTimes(1);

      selectionListDebug.componentInstance.selectAll();
      fixture.detectChanges();

      expect(fixture.componentInstance.modelChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('should not dispatch the model change event if nothing changed using selectAll', () => {
      expect(fixture.componentInstance.modelChangeSpy).not.toHaveBeenCalled();

      selectionListDebug.componentInstance.deselectAll();
      fixture.detectChanges();

      expect(fixture.componentInstance.modelChangeSpy).not.toHaveBeenCalled();
    });

    it('should be able to programmatically set an array with duplicate values', fakeAsync(() => {
      fixture.componentInstance.options = ['one', 'two', 'two', 'two', 'three'];
      fixture.detectChanges();
      tick();

      listOptions = fixture.debugElement.queryAll(By.directive(MatListOption))
        .map(optionDebugEl => optionDebugEl.componentInstance);

      fixture.componentInstance.selectedOptions = ['one', 'two', 'two'];
      fixture.detectChanges();
      tick();

      expect(listOptions.map(option => option.selected)).toEqual([true, true, true, false, false]);
    }));
  });

  describe('and formControl', () => {
    let fixture: ComponentFixture<SelectionListWithFormControl>;
    let listOptions: MatListOption[];
    let selectionList: MatSelectionList;

    beforeEach(() => {
      fixture = TestBed.createComponent(SelectionListWithFormControl);
      fixture.detectChanges();

      selectionList = fixture.debugElement.query(By.directive(MatSelectionList))!.componentInstance;
      listOptions = fixture.debugElement.queryAll(By.directive(MatListOption))
        .map(optionDebugEl => optionDebugEl.componentInstance);
    });

    it('should be able to disable options from the control', () => {
      expect(selectionList.disabled)
        .toBe(false, 'Expected the selection list to be enabled.');
      expect(listOptions.every(option => !option.disabled))
        .toBe(true, 'Expected every list option to be enabled.');

      fixture.componentInstance.formControl.disable();
      fixture.detectChanges();

      expect(selectionList.disabled)
        .toBe(true, 'Expected the selection list to be disabled.');
      expect(listOptions.every(option => option.disabled))
        .toBe(true, 'Expected every list option to be disabled.');
    });

    it('should be able to update the disabled property after form control disabling', () => {
      expect(listOptions.every(option => !option.disabled))
        .toBe(true, 'Expected every list option to be enabled.');

      fixture.componentInstance.formControl.disable();
      fixture.detectChanges();

      expect(listOptions.every(option => option.disabled))
        .toBe(true, 'Expected every list option to be disabled.');

      // Previously the selection list has been disabled through FormControl#disable. Now we
      // want to verify that we can still change the disabled state through updating the disabled
      // property. Calling FormControl#disable should not lock the disabled property.
      // See: https://github.com/angular/material2/issues/12107
      selectionList.disabled = false;
      fixture.detectChanges();

      expect(listOptions.every(option => !option.disabled))
        .toBe(true, 'Expected every list option to be enabled.');
    });

    it('should be able to set the value through the form control', () => {
      expect(listOptions.every(option => !option.selected))
        .toBe(true, 'Expected every list option to be unselected.');

      fixture.componentInstance.formControl.setValue(['opt2', 'opt3']);
      fixture.detectChanges();

      expect(listOptions[1].selected).toBe(true, 'Expected second option to be selected.');
      expect(listOptions[2].selected).toBe(true, 'Expected third option to be selected.');

      fixture.componentInstance.formControl.setValue(null);
      fixture.detectChanges();

      expect(listOptions.every(option => !option.selected))
        .toBe(true, 'Expected every list option to be unselected.');
    });

    it('should deselect option whose value no longer matches', () => {
      const option = listOptions[1];

      fixture.componentInstance.formControl.setValue(['opt2']);
      fixture.detectChanges();

      expect(option.selected).toBe(true, 'Expected option to be selected.');

      option.value = 'something-different';
      fixture.detectChanges();

      expect(option.selected).toBe(false, 'Expected option not to be selected.');
      expect(fixture.componentInstance.formControl.value).toEqual([]);
    });

    it('should mark options as selected when the value is set before they are initialized', () => {
      fixture.destroy();
      fixture = TestBed.createComponent(SelectionListWithFormControl);

      fixture.componentInstance.formControl.setValue(['opt2', 'opt3']);
      fixture.detectChanges();

      listOptions = fixture.debugElement.queryAll(By.directive(MatListOption))
        .map(optionDebugEl => optionDebugEl.componentInstance);

      expect(listOptions[1].selected).toBe(true, 'Expected second option to be selected.');
      expect(listOptions[2].selected).toBe(true, 'Expected third option to be selected.');
    });

    it('should not clear the form control when the list is destroyed', fakeAsync(() => {
      const option = listOptions[1];

      option.selected = true;
      fixture.detectChanges();

      expect(fixture.componentInstance.formControl.value).toEqual(['opt2']);

      fixture.componentInstance.renderList = false;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.componentInstance.formControl.value).toEqual(['opt2']);
    }));

    it('should mark options added at a later point as selected', () => {
      fixture.componentInstance.formControl.setValue(['opt4']);
      fixture.detectChanges();

      fixture.componentInstance.renderExtraOption = true;
      fixture.detectChanges();

      listOptions = fixture.debugElement.queryAll(By.directive(MatListOption))
        .map(optionDebugEl => optionDebugEl.componentInstance);

      expect(listOptions.length).toBe(4);
      expect(listOptions[3].selected).toBe(true);
    });

  });

  describe('preselected values', () => {
    it('should add preselected options to the model value', fakeAsync(() => {
      const fixture = TestBed.createComponent(SelectionListWithPreselectedOption);
      const listOptions = fixture.debugElement.queryAll(By.directive(MatListOption))
        .map(optionDebugEl => optionDebugEl.componentInstance);

      fixture.detectChanges();
      tick();

      expect(listOptions[1].selected).toBe(true);
      expect(fixture.componentInstance.selectedOptions).toEqual(['opt2']);
    }));

    it('should handle preselected option both through the model and the view', fakeAsync(() => {
      const fixture = TestBed.createComponent(SelectionListWithPreselectedOptionAndModel);
      const listOptions = fixture.debugElement.queryAll(By.directive(MatListOption))
        .map(optionDebugEl => optionDebugEl.componentInstance);

      fixture.detectChanges();
      tick();

      expect(listOptions[0].selected).toBe(true);
      expect(listOptions[1].selected).toBe(true);
      expect(fixture.componentInstance.selectedOptions).toEqual(['opt1', 'opt2']);
    }));

    it('should show the item as selected when preselected inside OnPush parent', fakeAsync(() => {
      const fixture = TestBed.createComponent(SelectionListWithPreselectedFormControlOnPush);
      fixture.detectChanges();

      const option = fixture.debugElement.queryAll(By.directive(MatListOption))[1];
      const checkbox = option.nativeElement
          .querySelector('.mdc-checkbox__native-control') as HTMLInputElement;

      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(option.componentInstance.selected).toBe(true);
      expect(checkbox.checked).toBe(true);
    }));

  });

  describe('with custom compare function', () => {
    it('should use a custom comparator to determine which options are selected', fakeAsync(() => {
      const fixture = TestBed.createComponent(SelectionListWithCustomComparator);
      const testComponent = fixture.componentInstance;

      testComponent.compareWith = jasmine.createSpy('comparator', (o1: any, o2: any) => {
        return o1 && o2 && o1.id === o2.id;
      }).and.callThrough();

      testComponent.selectedOptions = [{id: 2, label: 'Two'}];
      fixture.detectChanges();
      tick();

      expect(testComponent.compareWith).toHaveBeenCalled();
      expect(testComponent.optionInstances.toArray()[1].selected).toBe(true);
    }));
  });
});


@Component({template: `
  <mat-selection-list
    id="selection-list-1"
    (selectionChange)="onValueChange($event)"
    [disableRipple]="listRippleDisabled"
    [color]="selectionListColor"
    [multiple]="multiple">
    <mat-list-option checkboxPosition="before" disabled="true" value="inbox"
                     [color]="firstOptionColor">
      Inbox (disabled selection-option)
    </mat-list-option>
    <mat-list-option id="testSelect" checkboxPosition="before" class="test-native-focus"
                    value="starred">
      Starred
    </mat-list-option>
    <mat-list-option checkboxPosition="before" value="sent-mail">
      Sent Mail
    </mat-list-option>
    <mat-list-option checkboxPosition="before" value="archive">
      Archive
    </mat-list-option>
    <mat-list-option checkboxPosition="before" value="drafts" *ngIf="showLastOption">
      Drafts
    </mat-list-option>
  </mat-selection-list>`})
class SelectionListWithListOptions {
  showLastOption = true;
  listRippleDisabled = false;
  multiple = true;
  selectionListColor: ThemePalette;
  firstOptionColor: ThemePalette;

  onValueChange(_change: MatSelectionListChange) {}
}

@Component({template: `
  <mat-selection-list id="selection-list-2">
    <mat-list-option checkboxPosition="after">
      Inbox (disabled selection-option)
    </mat-list-option>
    <mat-list-option id="testSelect" checkboxPosition="after">
      Starred
    </mat-list-option>
    <mat-list-option checkboxPosition="after">
      Sent Mail
    </mat-list-option>
    <mat-list-option checkboxPosition="after">
      Drafts
    </mat-list-option>
  </mat-selection-list>`})
class SelectionListWithCheckboxPositionAfter {
}

@Component({template: `
  <mat-selection-list id="selection-list-3" [disabled]="disabled">
    <mat-list-option checkboxPosition="after">
      Inbox (disabled selection-option)
    </mat-list-option>
    <mat-list-option id="testSelect" checkboxPosition="after">
      Starred
    </mat-list-option>
    <mat-list-option checkboxPosition="after">
      Sent Mail
    </mat-list-option>
    <mat-list-option checkboxPosition="after">
      Drafts
    </mat-list-option>
  </mat-selection-list>`})
class SelectionListWithListDisabled {
  disabled: boolean = true;
}

@Component({template: `
  <mat-selection-list>
    <mat-list-option [disabled]="disableItem">Item</mat-list-option>
  </mat-selection-list>
  `})
class SelectionListWithDisabledOption {
  disableItem: boolean = false;
}

@Component({template: `
  <mat-selection-list>
    <mat-list-option [selected]="true">Item</mat-list-option>
  </mat-selection-list>`})
class SelectionListWithSelectedOption {
}

@Component({
  template: `
  <mat-selection-list>
    <mat-list-option [selected]="true" [value]="itemValue">Item</mat-list-option>
  </mat-selection-list>`
})
class SelectionListWithSelectedOptionAndValue {
  itemValue = 'item1';
}

@Component({template: `
  <mat-selection-list id="selection-list-4">
    <mat-list-option checkboxPosition="after" class="test-focus" id="123">
      Inbox
    </mat-list-option>
  </mat-selection-list>`})
class SelectionListWithOnlyOneOption {
}

@Component({
  template: `
    <mat-selection-list [(ngModel)]="selectedOptions" (ngModelChange)="modelChangeSpy()">
      <mat-list-option *ngFor="let option of options" [value]="option">{{option}}</mat-list-option>
    </mat-selection-list>`
})
class SelectionListWithModel {
  modelChangeSpy = jasmine.createSpy('model change spy');
  selectedOptions: string[] = [];
  options = ['opt1', 'opt2', 'opt3'];
}

@Component({
  template: `
    <mat-selection-list [formControl]="formControl" *ngIf="renderList">
      <mat-list-option value="opt1">Option 1</mat-list-option>
      <mat-list-option value="opt2">Option 2</mat-list-option>
      <mat-list-option value="opt3">Option 3</mat-list-option>
      <mat-list-option value="opt4" *ngIf="renderExtraOption">Option 4</mat-list-option>
    </mat-selection-list>
  `
})
class SelectionListWithFormControl {
  formControl = new FormControl();
  renderList = true;
  renderExtraOption = false;
}


@Component({
  template: `
    <mat-selection-list [(ngModel)]="selectedOptions">
      <mat-list-option value="opt1">Option 1</mat-list-option>
      <mat-list-option value="opt2" selected>Option 2</mat-list-option>
    </mat-selection-list>`
})
class SelectionListWithPreselectedOption {
  selectedOptions: string[];
}


@Component({
  template: `
    <mat-selection-list [(ngModel)]="selectedOptions">
      <mat-list-option value="opt1">Option 1</mat-list-option>
      <mat-list-option value="opt2" selected>Option 2</mat-list-option>
    </mat-selection-list>`
})
class SelectionListWithPreselectedOptionAndModel {
  selectedOptions = ['opt1'];
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-selection-list [formControl]="formControl">
      <mat-list-option *ngFor="let opt of opts" [value]="opt">{{opt}}</mat-list-option>
    </mat-selection-list>
  `
})
class SelectionListWithPreselectedFormControlOnPush {
  opts = ['opt1', 'opt2', 'opt3'];
  formControl = new FormControl(['opt2']);
}


@Component({
  template: `
    <mat-selection-list [(ngModel)]="selectedOptions" [compareWith]="compareWith">
      <mat-list-option *ngFor="let option of options" [value]="option">
        {{option.label}}
      </mat-list-option>
    </mat-selection-list>`
})
class SelectionListWithCustomComparator {
  @ViewChildren(MatListOption) optionInstances: QueryList<MatListOption>;
  selectedOptions: {id: number, label: string}[] = [];
  compareWith?: (o1: any, o2: any) => boolean;
  options = [
    {id: 1, label: 'One'},
    {id: 2, label: 'Two'},
    {id: 3, label: 'Three'}
  ];
}


@Component({
  template: `
    <mat-selection-list>
      <mat-list-option>
        <div mat-list-avatar>I</div>
        Inbox
      </mat-list-option>
    </mat-selection-list>
  `
})
class SelectionListWithAvatar {
}

@Component({
  template: `
    <mat-selection-list>
      <mat-list-option>
        <div mat-list-icon>I</div>
        Inbox
      </mat-list-option>
    </mat-selection-list>
  `
})
class SelectionListWithIcon {
}


@Component({
  // Note the blank `ngSwitch` which we need in order to hit the bug that we're testing.
  template: `
    <mat-selection-list>
      <ng-container [ngSwitch]="true">
        <mat-list-option [value]="1">One</mat-list-option>
        <mat-list-option [value]="2">Two</mat-list-option>
      </ng-container>
    </mat-selection-list>`
})
class SelectionListWithIndirectChildOptions {
  @ViewChildren(MatListOption) optionInstances: QueryList<MatListOption>;
}

// Note the blank `ngSwitch` which we need in order to hit the bug that we're testing.
@Component({
  template: `
  <mat-selection-list>
    <mat-list-option>
      <ng-container [ngSwitch]="true">
        <h3 mat-line>Item</h3>
        <p mat-line>Item description</p>
      </ng-container>
    </mat-list-option>
  </mat-selection-list>`
})
class SelectionListWithIndirectDescendantLines {
}
