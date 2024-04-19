import { ProjectType } from './project-type';

describe('ProjectType', () => {
  it('should accept npm as a project type', () => {
    const projectType: ProjectType = 'npm';
    expect(projectType).toEqual('npm');
  });
});
