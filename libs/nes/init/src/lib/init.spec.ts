import { nesInitCommand } from './init';
import { verifyProjectType } from './verify-project-type';
import { getProductChoices } from './get-product-choices';
import { getPackageChoices } from './get-package-choices';
import { checkbox, confirm, password, select } from '@inquirer/prompts';
import { configureProject } from './configure-project';
import { Choice, ReleaseTrain } from './models';
import { sortByName } from '@herodevs/utility';

jest.mock('./verify-project-type');
jest.mock('@inquirer/prompts');
jest.mock('./get-product-choices');
jest.mock('./get-package-choices');
jest.mock('./configure-project');

describe('nesInitCommand', () => {
  describe('configuration', () => {
    it('should define a command', () => {
      expect(nesInitCommand.command).toEqual('init');
    });

    it('should define a description', () => {
      expect(nesInitCommand.describe).toEqual('Initialize the NES project');
    });
  });

  describe('implementation', () => {
    let verifyProjectTypeMock: jest.Mock;
    let checkboxMock: jest.Mock;
    let confirmMock: jest.Mock;
    let passwordMock: jest.Mock;
    let selectMock: jest.Mock;
    let getProductChoicesMock: jest.Mock;
    let getPackageChoicesMock: jest.Mock;
    let mockReleaseTrains: ReleaseTrain[] = [];
    let mockReleaseTrainChoices: Choice<ReleaseTrain[]>[] = [];
    let configureProjectMock: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();

      verifyProjectTypeMock = verifyProjectType as jest.Mock;
      checkboxMock = checkbox as jest.Mock;
      confirmMock = confirm as jest.Mock;
      passwordMock = password as jest.Mock;
      selectMock = select as jest.Mock;
      getProductChoicesMock = getProductChoices as jest.Mock;
      getPackageChoicesMock = getPackageChoices as jest.Mock;
      configureProjectMock = configureProject as jest.Mock;

      mockReleaseTrains = [
        {
          id: 1,
          key: 'release-train-1',
          name: 'release train 1',
          products: [
            {
              id: 111,
              key: 'vue_essentials',
              name: 'Vue 2 Essentials',
            },
          ],
          entries: [
            {
              packageVersion: {
                id: 222,
                name: '2.3.4',
                fqns: '@neverendingsupport/vue2@2.3.4',
                origination: {
                  name: 'vue',
                  type: 'npm',
                  version: '2.3.4',
                },
              },
            },
          ],
        },
        {
          id: 3,
          key: 'release-train-3',
          name: 'release train 3',
          products: [
            {
              id: 333,
              key: 'vue_essentials',
              name: 'Vue 3 Essentials',
            },
          ],
          entries: [
            {
              packageVersion: {
                id: 444,
                name: '4.5.6',
                fqns: '@neverendingsupport/vue2@4.5.6',
                origination: {
                  name: 'vue',
                  type: 'npm',
                  version: '4.5.6',
                },
              },
            },
          ],
        },
      ];
      const products = mockReleaseTrains.reduce((acc, rt) => {
        rt.products.forEach((product) => {
          if (acc[product.name]) {
            acc[product.name].push(rt);
          } else {
            acc[product.name] = [rt];
          }
        });

        return acc;
      }, {} as { [key: string]: ReleaseTrain[] });

      mockReleaseTrainChoices = Object.entries(products)
        .map(([key, value]) => ({
          name: key,
          value,
        }))
        .sort(sortByName);

      const packageChoices = mockReleaseTrains[0].entries.map((e) => ({
        name: e.packageVersion,
        value: e,
      }));

      verifyProjectTypeMock.mockReturnValue({
        types: ['npm'],
        valid: true,
      });
      confirmMock.mockReturnValue(Promise.resolve(true));
      passwordMock.mockReturnValue(Promise.resolve('abc123'));
      selectMock.mockReturnValue(Promise.resolve(mockReleaseTrainChoices[0].value));
      checkboxMock.mockReturnValue(Promise.resolve(packageChoices.map((c) => c.value)));
      getProductChoicesMock.mockReturnValue(Promise.resolve(mockReleaseTrainChoices));
      getPackageChoicesMock.mockReturnValue(packageChoices);
    });

    describe('invalid project type', () => {
      it('should report the error', async () => {
        verifyProjectTypeMock.mockReturnValue({
          types: ['npm'],
          valid: false,
          error: 'Unable to recognize a supported project type.',
        });
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await nesInitCommand.handler({ _: [], $0: '' });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Unable to recognize a supported project type.'
        );
      });

      it('should not continue', async () => {
        verifyProjectTypeMock.mockReturnValue({
          types: ['npm'],
          valid: false,
          error: 'Unable to recognize a supported project type.',
        });

        await nesInitCommand.handler({ _: [], $0: '' });

        expect(confirmMock).not.toHaveBeenCalled();
      });
    });

    describe('user confirmation', () => {
      it('should confirm user consent', async () => {
        confirmMock.mockReturnValue(Promise.resolve(false));

        await nesInitCommand.handler({ _: [], $0: '' });

        expect(confirmMock).toHaveBeenCalledWith({
          message: 'Before initializing, please commit all changes. Continue?',
        });
      });

      it('should exit if confirmation is rejected', async () => {
        confirmMock.mockReturnValue(Promise.resolve(false));

        await nesInitCommand.handler({ _: [], $0: '' });

        expect(confirmMock).toHaveBeenCalledTimes(1);
        expect(passwordMock).not.toHaveBeenCalled();
      });
    });

    it('should provide a selection of release trains to the user', async () => {
      await nesInitCommand.handler({ _: [], $0: '' });
      expect(selectMock).toHaveBeenCalledWith({
        message: 'select a product',
        choices: mockReleaseTrainChoices,
        pageSize: mockReleaseTrainChoices.length,
        loop: false,
      });
    });

    it('should call to configure the project', async () => {
      await nesInitCommand.handler({ _: [], $0: '' });

      expect(configureProjectMock).toHaveBeenCalledWith(
        'abc123',
        ['npm'],
        mockReleaseTrains[0].entries
      );
    });
  });
});
