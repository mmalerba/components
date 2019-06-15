/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AsyncFn,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessLoader,
  HarnessPredicate,
  LocatorFactory
} from './component-harness';
import {TestElement} from './test-element';

/**
 * Base harness environment class that can be extended to allow `ComponentHarness`es to be used in
 * different test environments (e.g. testbed, protractor, etc.). This class implements the
 * functionality of both a `HarnessLoader` and `LocatorFactory`. This class is generic on the raw
 * element type, `E`, used by the particular test environment.
 */
export abstract class HarnessEnvironment<E> implements HarnessLoader, LocatorFactory {
  protected constructor(protected rawRootElement: E) {}

  // Implemented as part of the `LocatorFactory` interface.
  documentRootLocatorFactory(): LocatorFactory {
    return this.createEnvironment(this.getDocumentRoot());
  }

  // Implemented as part of the `LocatorFactory` interface.
  rootElement(): TestElement {
    return this.createTestElement(this.rawRootElement);
  }

  // Implemented as part of the `LocatorFactory` interface.
  locatorForRequired(selector: string): AsyncFn<TestElement>;
  locatorForRequired<T extends ComponentHarness>(
      harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): AsyncFn<T>;
  locatorForRequired<T extends ComponentHarness>(
      arg: string | ComponentHarnessConstructor<T> | HarnessPredicate<T>):
      AsyncFn<TestElement | T> {
    return async () => {
      let selector: string;
      if (typeof arg === 'string') {
        selector = arg;
        const element = (await this.getAllRawElements(selector))[0];
        if (element) {
          return this.createTestElement(element);
        }
      } else {
        const harnessPredicate = arg instanceof HarnessPredicate ? arg : new HarnessPredicate(arg);
        selector = harnessPredicate.harnessType.hostSelector;
        const element = (await this.getAllRawElements(selector))[0];
        if (element) {
          return this.createComponentHarness(harnessPredicate.harnessType, element);
        }
      }
      throw Error(`Expected to find element matching selector: "${selector}", but none was found`);
    };
  }

  // Implemented as part of the `LocatorFactory` interface.
  locatorForOptional(selector: string): AsyncFn<TestElement | null>;
  locatorForOptional<T extends ComponentHarness>(
      harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): AsyncFn<T | null>;
  locatorForOptional<T extends ComponentHarness>(
      arg: string | ComponentHarnessConstructor<T> | HarnessPredicate<T>):
      AsyncFn<TestElement | T | null> {
    return async () => {
      if (typeof arg === 'string') {
        const element = (await this.getAllRawElements(arg))[0];
        return element ? this.createTestElement(element) : null;
      } else {
        const harnessPredicate = arg instanceof HarnessPredicate ? arg : new HarnessPredicate(arg);
        const element =
            (await this.getAllRawElements(harnessPredicate.harnessType.hostSelector))[0];
        return element ? this.createComponentHarness(harnessPredicate.harnessType, element) : null;
      }
    };
  }

  // Implemented as part of the `LocatorFactory` interface.
  locatorForAll(selector: string): AsyncFn<TestElement[]>;
  locatorForAll<T extends ComponentHarness>(
      harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): AsyncFn<T[]>;
  locatorForAll<T extends ComponentHarness>(
      arg: string | ComponentHarnessConstructor<T> | HarnessPredicate<T>):
      AsyncFn<TestElement[] | T[]> {
    return async () => {
      if (typeof arg === 'string') {
        return (await this.getAllRawElements(arg)).map(e => this.createTestElement(e));
      } else {
        const harnessPredicate = arg instanceof HarnessPredicate ? arg : new HarnessPredicate(arg);
        return (await this.getAllRawElements(harnessPredicate.harnessType.hostSelector))
            .map(element => this.createComponentHarness(harnessPredicate.harnessType, element));
      }
    };
  }

  // Implemented as part of the `HarnessLoader` interface.
  requiredHarness<T extends ComponentHarness>(
      harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): Promise<T> {
    return this.locatorForRequired(harnessType)();
  }

  // Implemented as part of the `HarnessLoader` interface.
  optionalHarness<T extends ComponentHarness>(
      harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): Promise<T | null> {
    return this.locatorForOptional(harnessType)();
  }

  // Implemented as part of the `HarnessLoader` interface.
  allHarnesses<T extends ComponentHarness>(
      harnessType: ComponentHarnessConstructor<T> | HarnessPredicate<T>): Promise<T[]> {
    return this.locatorForAll(harnessType)();
  }

  // Implemented as part of the `HarnessLoader` interface.
  async findRequired(selector: string): Promise<HarnessLoader> {
    const element = (await this.getAllRawElements(selector))[0];
    if (element) {
      return this.createEnvironment(element);
    }
    throw Error(`Expected to find element matching selector: "${selector}", but none was found`);
  }

  // Implemented as part of the `HarnessLoader` interface.
  async findOptional(selector: string): Promise<HarnessLoader | null> {
    const element = (await this.getAllRawElements(selector))[0];
    return element ? this.createEnvironment(element) : null;
  }

  // Implemented as part of the `HarnessLoader` interface.
  async findAll(selector: string): Promise<HarnessLoader[]> {
    return (await this.getAllRawElements(selector)).map(e => this.createEnvironment(e));
  }

  /** Creates a `ComponentHarness` for the given harness type with the given raw host element. */
  protected createComponentHarness<T extends ComponentHarness>(
      harnessType: ComponentHarnessConstructor<T>, element: E): T {
    return new harnessType(this.createEnvironment(element));
  }

  /** Gets the root element for the document. */
  protected abstract getDocumentRoot(): E;

  /** Creates a `TestElement` from a raw element. */
  protected abstract createTestElement(element: E): TestElement;

  /** Creates a `HarnessLoader` rooted at the given raw element. */
  protected abstract createEnvironment(element: E): HarnessEnvironment<E>;

  /**
   * Gets a list of all elements matching the given selector under this environment's root element.
   */
  protected abstract getAllRawElements(selector: string): Promise<E[]>;
}
