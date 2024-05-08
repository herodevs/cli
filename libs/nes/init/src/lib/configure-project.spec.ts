import { ProjectType } from '@herodevs/core-types';
import { configureProject } from './configure-project';
import { configureNpmProject } from './npm/configure-npm-project';
import { Entry } from './models';

jest.mock('./npm/configure-npm-project');

describe('configureProject', () => {
  let configureNpmProjectMock: jest.Mock;

  let accessToken: string;
  let projectTypes: ProjectType[];
  let entries: Entry[];

  beforeEach(() => {
    configureNpmProjectMock = configureNpmProject as jest.Mock;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    configureNpmProjectMock.mockImplementation(() => {});
    accessToken = 'abc123';
    projectTypes = [];
    entries = [];
  });

  it('should call configureNpmProject for npm projects', () => {
    projectTypes = ['npm'];
    configureProject(accessToken, projectTypes, entries);
    expect(configureNpmProjectMock).toHaveBeenCalledTimes(1);
    expect(configureNpmProjectMock).toHaveBeenCalledWith(accessToken, entries);
  });
});
