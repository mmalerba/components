/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {chain, noop, Rule, SchematicsException, Tree} from '@angular-devkit/schematics';
import {
  addModuleImportToRootModule,
  getProjectFromWorkspace,
  getProjectStyleFile,
} from '@angular/cdk/schematics';
import {getWorkspace} from '@schematics/angular/utility/config';
import * as parse5 from 'parse5';
import {addFontsToIndex} from './fonts/material-fonts';
import {addHammerJsToMain} from './gestures/hammerjs-import';
import {Schema} from './schema';
import {addThemeToAppStyles} from './theming/theming';

/**
 * Scaffolds the basics of a Angular Material application, this includes:
 *  - Add Packages to package.json
 *  - Adds pre-built themes to styles.ext
 *  - Adds Browser Animation to app.module
 */
export default function(options: Schema): Rule {
  if (!parse5) {
    throw new SchematicsException('Parse5 is required but could not be found! Please install ' +
      '"parse5" manually in order to continue.');
  }

  return chain([
    options && options.gestures ? addHammerJsToMain(options) : noop(),
    addThemeToAppStyles(options),
    addAnimationRootConfig(options),
    addFontsToIndex(options),
    addMaterialAppStyles(options),
  ]);
}

/** Add browser animation module to the app module file. */
function addAnimationRootConfig(options: Schema) {
  return (host: Tree) => {
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(workspace, options.project);

    addModuleImportToRootModule(host, 'BrowserAnimationsModule',
      '@angular/platform-browser/animations', project);

    return host;
  };
}

/**
 * Adds custom Material styles to the project style file. The custom CSS sets up the Roboto font
 * and reset the default browser body margin.
 */
function addMaterialAppStyles(options: Schema) {
  return (host: Tree) => {
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(workspace, options.project);
    const styleFilePath = getProjectStyleFile(project);
    const buffer = host.read(styleFilePath!);

    if (!styleFilePath || !buffer) {
      return console.warn(`Could not find styles file: "${styleFilePath}". Skipping styles ` +
        `generation. Please consider manually adding the "Roboto" font and resetting the ` +
        `body margin.`);
    }

    const htmlContent = buffer.toString();
    const insertion = '\n' +
      `html, body { height: 100%; }\n` +
      `body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }\n`;

    if (htmlContent.includes(insertion)) {
      return;
    }

    const recorder = host.beginUpdate(styleFilePath);

    recorder.insertLeft(htmlContent.length, insertion);
    host.commitUpdate(recorder);
  };
}
