import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatLegacyCardModule} from '@angular/material/legacy-card';
import {MatLegacyCheckboxModule} from '@angular/material/legacy-checkbox';
import {MatRadioModule} from '@angular/material/legacy-radio';
import {MatLegacySlideToggleModule} from '@angular/material/legacy-slide-toggle';
import {SlideToggleConfigurableExample} from './slide-toggle-configurable/slide-toggle-configurable-example';
import {SlideToggleFormsExample} from './slide-toggle-forms/slide-toggle-forms-example';
import {SlideToggleOverviewExample} from './slide-toggle-overview/slide-toggle-overview-example';
import {SlideToggleHarnessExample} from './slide-toggle-harness/slide-toggle-harness-example';

export {
  SlideToggleConfigurableExample,
  SlideToggleFormsExample,
  SlideToggleHarnessExample,
  SlideToggleOverviewExample,
};

const EXAMPLES = [
  SlideToggleConfigurableExample,
  SlideToggleFormsExample,
  SlideToggleHarnessExample,
  SlideToggleOverviewExample,
];

@NgModule({
  imports: [
    FormsModule,
    MatButtonModule,
    MatLegacyCardModule,
    MatLegacyCheckboxModule,
    MatRadioModule,
    MatLegacySlideToggleModule,
    ReactiveFormsModule,
  ],
  declarations: EXAMPLES,
  exports: EXAMPLES,
})
export class SlideToggleExamplesModule {}
