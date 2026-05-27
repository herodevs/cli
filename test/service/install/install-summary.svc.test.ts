import {
  createInstallSummary,
  formatInstallSummary,
  recordAvailableNotEntitled,
  recordMatchedNesPackage,
} from '../../../src/service/install/install-summary.svc.ts';

describe('install summary service', () => {
  it('prints only the latest not-entitled NES candidate for each OSS package', () => {
    const summary = createInstallSummary();
    recordAvailableNotEntitled(summary, 'lodash', {
      ossVersion: '4.17.21',
      nesPackageName: '@neverendingsupport/lodash',
      nesVersion: '4.17.21-lodash-4.17.22',
    });
    recordAvailableNotEntitled(summary, 'lodash', {
      ossVersion: '4.17.23',
      nesPackageName: '@neverendingsupport/lodash',
      nesVersion: '4.17.23-lodash-4.17.25',
    });

    expect(formatInstallSummary(summary)).toBe(
      [
        'NES packages available, but not included in your entitlement:',
        '- lodash@4.17.23 -> @neverendingsupport/lodash@4.17.23-lodash-4.17.25',
      ].join('\n'),
    );
  });

  it('prints only the latest installed NES candidate for each OSS package', () => {
    const summary = createInstallSummary();
    recordMatchedNesPackage(summary, 'lodash', {
      ossVersion: '4.17.21',
      nesPackageName: '@neverendingsupport/lodash',
      nesVersion: '4.17.21-lodash-4.17.22',
    });
    recordMatchedNesPackage(summary, 'lodash', {
      ossVersion: '4.17.23',
      nesPackageName: '@neverendingsupport/lodash',
      nesVersion: '4.17.23-lodash-4.17.25',
    });

    expect(formatInstallSummary(summary)).toBe(
      ['Installed NES packages:', '- lodash@4.17.23 -> @neverendingsupport/lodash@4.17.23-lodash-4.17.25'].join('\n'),
    );
  });
});
