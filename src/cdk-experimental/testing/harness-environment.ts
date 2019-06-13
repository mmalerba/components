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

  // Part of the `HarnessLoader` interface, delegated to concrete implementation.
  abstract documentRootLocatorFactory(): LocatorFactory;

  // Implemented as part of the `LocatorFactory` interface.
  rootElement(): TestElement {
    return this.createTestElement(this.rawRootElement);
  }

  // Implemented as part of the `LocatorFactory` interface.
  locatorForRequired(selector: string): AsyncFn<TestElement>;
  locatorForRequired<T extends ComponentHarness>(harness: ComponentHarnessConstructor<T>):
      AsyncFn<T>;
  locatorForRequired<T extends ComponentHarness>(
      arg: string | ComponentHarnessConstructor<T>): AsyncFn<TestElement | T> {
    return async () => {
      if (typeof arg === 'string') {
        const element = await this.getRawElement(arg);
        if (element) {
          return this.createTestElement(element);
        }
      } else {
        const element = await this.getRawElement(arg.hostSelector);
        if (element) {
          return this.createComponentHarness(arg, element);
        }
      }
      const selector = typeof arg === 'string' ? arg : arg.hostSelector;
      throw Error(`Expected to find element matching selector: "${selector}", but none was found`);
    };
  }

  // Implemented as part of the `LocatorFactory` interface.
  locatorForOptional(selector: string): AsyncFn<TestElement | null>;
  locatorForOptional<T extends ComponentHarness>(harness: ComponentHarnessConstructor<T>):
      AsyncFn<T | null>;
  locatorForOptional<T extends ComponentHarness>(
      arg: string | ComponentHarnessConstructor<T>): AsyncFn<TestElement | T | null> {
    return async () => {
      if (typeof arg === 'string') {
        const element = await this.getRawElement(arg);
        return element ? this.createTestElement(element) : null;
      } else {
        const element = await this.getRawElement(arg.hostSelector);
        return element ? this.createComponentHarness(arg, element) : null;
      }
    };
  }

  // Implemented as part of the `LocatorFactory` interface.
  locatorForAll(selector: string): AsyncFn<TestElement[]>;
  locatorForAll<T extends ComponentHarness>(harness: ComponentHarnessConstructor<T>): AsyncFn<T[]>;
  locatorForAll<T extends ComponentHarness>(
      arg: string | ComponentHarnessConstructor<T>): AsyncFn<TestElement[] | T[]> {
    return async () => {
      if (typeof arg === 'string') {
        return (await this.getAllRawElements(arg)).map(e => this.createTestElement(e));
      } else {
        return (await this.getAllRawElements(arg.hostSelector))
            .map(e => this.createComponentHarness(arg, e));
      }
    };
  }

  // Implemented as part of the `HarnessLoader` interface.
  requiredHarness<T extends ComponentHarness>(harness: ComponentHarnessConstructor<T>): Promise<T> {
    return this.locatorForRequired(harness)();
  }

  // Implemented as part of the `HarnessLoader` interface.
  optionalHarness<T extends ComponentHarness>(harness: ComponentHarnessConstructor<T>):
    Promise<T | null> {
    return this.locatorForOptional(harness)();
  }

  // Implemented as part of the `HarnessLoader` interface.
  allHarnesses<T extends ComponentHarness>(harness: ComponentHarnessConstructor<T>): Promise<T[]> {
    return this.locatorForAll(harness)();
  }

  // Implemented as part of the `HarnessLoader` interface.
  async findRequired(selector: string): Promise<HarnessLoader> {
    const element = await this.getRawElement(selector);
    if (element) {
      return this.createHarnessLoader(element);
    }
    throw Error(`Expected to find element matching selector: "${selector}", but none was found`);
  }

  // Implemented as part of the `HarnessLoader` interface.
  async findOptional(selector: string): Promise<HarnessLoader | null> {
    const element = await this.getRawElement(selector);
    return element ? this.createHarnessLoader(element) : null;
  }

  // Implemented as part of the `HarnessLoader` interface.
  async findAll(selector: string): Promise<HarnessLoader[]> {
    return (await this.getAllRawElements(selector)).map(e => this.createHarnessLoader(e));
  }

  /** Creates a `TestElement` from a raw element. */
  protected abstract createTestElement(element: E): TestElement;

  /** Creates a `ComponentHarness` for the given harness type with the given raw host element. */
  protected abstract createComponentHarness<T extends ComponentHarness>(
    harnessType: ComponentHarnessConstructor<T>, element: E): T;

  /** Creates a `HarnessLoader` rooted at the given raw element. */
  protected abstract createHarnessLoader(element: E): HarnessLoader;

  /**
   * Gets the first element matching the given selector under this environment's root element, or
   * null if no elements match.
   */
  protected abstract getRawElement(selector: string): Promise<E | null>;

  /**
   * Gets a list of all elements matching the given selector under this environment's root element.
   */
  protected abstract getAllRawElements(selector: string): Promise<E[]>;
}
