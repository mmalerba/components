import {MatRadioModule} from '@angular/material/legacy-radio';
import {runHarnessTests} from '@angular/material/legacy-radio/testing/shared.spec';
import {MatRadioButtonHarness, MatRadioGroupHarness} from './radio-harness';

describe('Non-MDC-based', () => {
  runHarnessTests(MatRadioModule, MatRadioGroupHarness, MatRadioButtonHarness);
});
