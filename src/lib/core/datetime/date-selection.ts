/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FactoryProvider, Optional, SkipSelf} from '@angular/core';
import {DateAdapter} from '@angular/material/core';
import {Subject} from 'rxjs';


export abstract class MatDateSelection<D> {
  valueChanges = new Subject<void>();

  constructor(protected readonly adapter: DateAdapter<D>) {}

  dispose() {
    this.valueChanges.complete();
  }

  abstract add(date: D | null): void;
  abstract clone(): MatDateSelection<D>;
  abstract getFirstSelectedDate(): D|null;
  abstract getLastSelectedDate(): D|null;
  abstract isComplete(): boolean;
  abstract isSame(other: MatDateSelection<D>): boolean;
  abstract isValid(): boolean;
  abstract contains(value: D): boolean;
  abstract overlaps(range: DateRange<D>): boolean;
}

export interface DateRange<D> {
  start: D | null;
  end: D | null;
}

/**
 * Concrete implementation of a MatDateSelection that holds a single date.
 */
export class MatSingleDateSelection<D> extends MatDateSelection<D> {
  private date: D | null = null;

  constructor(adapter: DateAdapter<D>, date?: D | null) {
    super(adapter);
    if (date) {
      this.date = date;
    }
  }

  add(date: D | null) {
    this.date = date;
    this.valueChanges.next();
  }

  compareDate(other: MatSingleDateSelection<D>) {
    const date = this.asDate();
    const otherDate = other.asDate();
    if (date && otherDate) {
      return this.adapter.compareDate(date, otherDate);
    }

    throw Error;
  }

  clone(): MatDateSelection<D> {
    return new MatSingleDateSelection<D>(this.adapter, this.date);
  }

  getFirstSelectedDate() { return this.date; }

  getLastSelectedDate() { return this.date; }

  isComplete() { return !!this.date; }

  isSame(other: MatDateSelection<D>): boolean {
    return other instanceof MatSingleDateSelection &&
        this.adapter.sameDate(other.getFirstSelectedDate(), this.getFirstSelectedDate());
  }

  isValid(): boolean {
    return !!(this.date &&
      this.adapter.isDateInstance(this.date) &&
      this.adapter.isValid(this.date));
  }

  asDate(): D | null {
    return this.isValid() ? this.adapter.deserialize(this.date) : null;
  }

  contains(value: D): boolean {
    return !!(this.date && this.adapter.sameDate(value, this.date));
  }

  /**
   * Determines if the single date is within a given date range. Retuns false if either dates of
   * the range is null or if the selection is undefined.
   */
  overlaps(range: DateRange<D>): boolean {
    return !!(this.date && range.start && range.end &&
      this.adapter.compareDate(range.start, this.date) <= 0 &&
      this.adapter.compareDate(this.date, range.end) <= 0);
  }
}

/**
 * Concrete implementation of a MatDateSelection that holds a date range, represented by
 * a start date and an end date.
 */
export class MatRangeDateSelection<D> extends MatDateSelection<D> {
  private start: D | null = null;
  private end: D | null = null;

  constructor(adapter: DateAdapter<D>, start?: D | null, end?: D | null) {
    super(adapter);

    if (start) {
      this.start = start;
    }

    if (end) {
      this.end = end;
    }
  }

  /**
   * Adds an additional date to the range. If no date is set thus far, it will set it to the
   * beginning. If the beginning is set, it will set it to the end.
   * If add is called on a complete selection, it will empty the selection and set it as the start.
   */
  add(date: D): void {
    if (!this.start) {
      this.start = date;
    } else if (!this.end) {
      this.end = date;
    } else {
      this.start = date;
      this.end = null;
    }

    this.valueChanges.next();
  }

  clone(): MatDateSelection<D> {
    return new MatRangeDateSelection<D>(this.adapter, this.start, this.end);
  }

  getFirstSelectedDate() { return this.start; }

  getLastSelectedDate() { return this.end; }

  setFirstSelectedDate(value: D | null) { this.start = value; }

  setLastSelectedDate(value: D | null) { this.end = value; }

  isComplete(): boolean {
    return !!(this.start && this.end);
  }

  isSame(other: MatDateSelection<D>): boolean {
    return other instanceof MatRangeDateSelection &&
        this.adapter.sameDate(this.getFirstSelectedDate(), other.getFirstSelectedDate()) &&
        this.adapter.sameDate(this.getLastSelectedDate(), other.getLastSelectedDate());
  }

  isValid(): boolean {
    return !!(this.start && this.end &&
        this.adapter.isValid(this.start!) && this.adapter.isValid(this.end!));
  }

  asRange(): DateRange<D> {
    return {
      start: this.start,
      end: this.end,
    };
  }

  contains(value: D): boolean {
    if (this.start && this.end) {
      return this.adapter.compareDate(this.start, value) <= 0 &&
          this.adapter.compareDate(this.end, value) >= 0;
    } else if (this.start) {
      return this.adapter.sameDate(this.start, value);
    }

    return false;
  }

  /**
   * Returns true if the given range and the selection overlap in any way. False if otherwise, that
   * includes incomplete selections or ranges.
   */
  overlaps(range: DateRange<D>): boolean {
    if (!(this.start && this.end && range.start && range.end)) {
      return false;
    }

    return (
      this.inBetween(range.start, this.start, this.end) ||
      this.inBetween(range.end, this.start, this.end) ||
      (
        this.adapter.compareDate(range.start, this.start) <= 0 &&
        this.adapter.compareDate(this.end, range.end) <= 0
      )
    );
  }

  private inBetween(value: D, from: D, to: D): boolean {
    return this.adapter.compareDate(from, value) <= 0 && this.adapter.compareDate(value, to) <= 0;
  }
}

export function MAT_SINGLE_DATE_SELECTION_MODEL_FACTORY<D>(parent: MatSingleDateSelection<D>,
                                                           adapter: DateAdapter<D>) {
  return parent || new MatSingleDateSelection(adapter);
}

export const MAT_SINGLE_DATE_SELECTION_MODEL_PROVIDER: FactoryProvider = {
  provide: MatDateSelection,
  deps: [[new Optional(), new SkipSelf(), MatDateSelection], DateAdapter],
  useFactory: MAT_SINGLE_DATE_SELECTION_MODEL_FACTORY
};
