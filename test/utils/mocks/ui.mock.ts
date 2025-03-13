import inquirer from 'inquirer';

import { BaseStackMock } from './base.mock.ts';

export class InquirerMock extends BaseStackMock {
  public constructor() {
    super(inquirer, 'prompt');
  }
}
