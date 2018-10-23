/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {TargetVersion} from '../../target-version';
import {VersionChanges} from '../transform-change-data';

export interface MaterialAttributeSelectorData {
  /** The attribute name to replace. */
  replace: string;
  /** The new name for the attribute. */
  replaceWith: string;
}

export const attributeSelectors: VersionChanges<MaterialAttributeSelectorData> = {
  [TargetVersion.V6]: [
    {
      pr: 'https://github.com/angular/material2/pull/10257',
      changes: [
        {
          replace: 'cdkPortalHost',
          replaceWith: 'cdkPortalOutlet'
        },
        {
          replace: 'portalHost',
          replaceWith: 'cdkPortalOutlet'
        }
      ]
    }
  ]
};
