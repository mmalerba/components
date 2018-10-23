/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  NgZone,
} from '@angular/core';
import {take} from 'rxjs/operators';
import {MatDateSelection} from '@angular/material/core';

/**
 * An internal class that represents the data corresponding to a single calendar cell.
 * @docs-private
 */
export class MatCalendarCell<D> {
  constructor(public value: number,
              public displayValue: string,
              public ariaLabel: string,
              public enabled: boolean,
              public date: D) {}
}


/**
 * An internal component used to display calendar data in a table.
 * @docs-private
 */
@Component({
  moduleId: module.id,
  selector: '[mat-calendar-body]',
  templateUrl: 'calendar-body.html',
  styleUrls: ['calendar-body.css'],
  host: {
    'class': 'mat-calendar-body',
    'role': 'grid',
    'aria-readonly': 'true'
  },
  exportAs: 'matCalendarBody',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatCalendarBody<D> {
  /** The label for the table. (e.g. "Jan 2017"). */
  @Input() label: string;

  /** The cells to display in the table. */
  @Input() rows: MatCalendarCell<D>[][];

  /** The value in the table that corresponds to today. */
  @Input() todayValue: number;

  /** The value in the table that is currently selected. */
  @Input() selectedValue: MatDateSelection<D>;

  /** The minimum number of free cells needed to fit the label in the first row. */
  @Input() labelMinRequiredCells: number;

  /** The number of columns in the table. */
  @Input() numCols = 7;

  /** Whether to allow selection of disabled cells. */
  @Input() allowDisabledSelection = false;

  /** The cell number of the active cell in the table. */
  @Input() activeCell = 0;

  /**
   * The aspect ratio (width / height) to use for the cells in the table. This aspect ratio will be
   * maintained even as the table resizes.
   */
  @Input() cellAspectRatio = 1;

  /** Emits when a new value is selected. */
  // this should no longer be necessary since the date selection handles changes internally.
  // @Output() readonly selectedValueChange: EventEmitter<number> = new EventEmitter<number>();

  constructor(private _elementRef: ElementRef<HTMLElement>, private _ngZone: NgZone) { }

  _cellClicked(cell: MatCalendarCell<D>): void {
    if (!this.allowDisabledSelection && !cell.enabled) {
      return;
    }
    // this.selectedValueChange.emit(cell.value);
  }

  /** The number of blank cells to put at the beginning for the first row. */
  get _firstRowOffset(): number {
    return this.rows && this.rows.length && this.rows[0].length ?
        this.numCols - this.rows[0].length : 0;
  }

  _isActiveCell(rowIndex: number, colIndex: number): boolean {
    let cellNumber = rowIndex * this.numCols + colIndex;

    // Account for the fact that the first row may not have as many cells.
    if (rowIndex) {
      cellNumber -= this._firstRowOffset;
    }

    return cellNumber == this.activeCell;
  }

  _isSelected(item: MatCalendarCell<D>): boolean {
    return this.selectedValue.contains(item.date);
  }

  /** Focuses the active cell after the microtask queue is empty. */
  _focusActiveCell() {
    this._ngZone.runOutsideAngular(() => {
      this._ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
        const activeCell: HTMLElement | null =
            this._elementRef.nativeElement.querySelector('.mat-calendar-body-active');

        if (activeCell) {
          activeCell.focus();
        }
      });
    });
  }
}
