import { addHours, addMinutes, addSeconds, format, formatISO, subMonths } from 'date-fns';
import { reportCommittersCommand } from './committers';
import { runCommand } from '@herodevs/utility';
import { dateFormat } from './constants';
import { parseDateFlags } from './parse-date-flags';
import { parseGitLogEntries } from './parse-git-log-entries';
import { getCommitterCounts } from './get-committer-counts';

jest.mock('@herodevs/utility');
jest.mock('./parse-git-log-entries');
jest.mock('./get-committer-counts');

describe('reportCommittersCommand', () => {
  let defaultBeforeDate: string;
  let defaultAfterDate: string;

  beforeEach(() => {
    defaultBeforeDate = format(new Date(), 'yyyy-MM-dd');
    defaultAfterDate = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
  });

  describe('metadata', () => {
    it('should define the command', () => {
      expect(reportCommittersCommand.command).toEqual('committers');
    });

    it('should set a description', () => {
      expect(reportCommittersCommand.describe).toEqual('show git committers');
    });

    it('should set alias(es)', () => {
      expect(reportCommittersCommand.aliases).toEqual(['git']);
    });
  });

  describe('default values', () => {
    it('should set start date as today', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder = reportCommittersCommand.builder as any;
      expect(builder.beforeDate.default).toEqual(defaultBeforeDate);
    });

    it('should set end date as 1 year ago', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder = reportCommittersCommand.builder as any;
      expect(builder.afterDate.default).toEqual(defaultAfterDate);
    });

    it('should not have a default value for exclude', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder = reportCommittersCommand.builder as any;
      expect(builder.exclude.default).toBeUndefined();
    });
  });

  describe('implementation', () => {
    let runCommandMock: jest.Mock;
    let parseGitLogEntriesMock: jest.Mock;
    let getCommitterCountsMock: jest.Mock;

    beforeEach(() => {
      runCommandMock = runCommand as jest.Mock;
      parseGitLogEntriesMock = parseGitLogEntries as jest.Mock;
      getCommitterCountsMock = getCommitterCounts as jest.Mock;
    });

    it('should run the correct git command', () => {
      const args = {
        beforeDate: defaultBeforeDate,
        afterDate: defaultAfterDate,
      };

      runCommandMock.mockResolvedValue('');

      const { beforeDate, afterDate } = parseDateFlags(
        dateFormat,
        defaultBeforeDate,
        defaultAfterDate
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reportCommittersCommand.handler(args as any);

      const beforeDateEndOfDay = formatISO(
        addHours(addMinutes(addSeconds(beforeDate, 59), 59), 23)
      );

      expect(runCommandMock).toHaveBeenCalledWith(
        `git log --since "${afterDate}" --until "${beforeDateEndOfDay}" --pretty=format:"%hΓΓΓΓ%anΓΓΓΓ%ad" `
      );
    });

    it('should parse and organize the git committers', async () => {
      const args = {
        beforeDate: defaultBeforeDate,
        afterDate: defaultAfterDate,
      };

      runCommandMock.mockResolvedValue('a\nb');
      parseGitLogEntriesMock.mockReturnValue([
        {
          commitHash: 'hash',
          committer: 'testy',
          date: defaultBeforeDate,
        },
      ]);
      getCommitterCountsMock.mockReturnValue([
        { name: 'a', count: 5 },
        { name: 'b', count: 3 },
        { name: 'b', count: 1 },
      ]);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await reportCommittersCommand.handler(args as any);

      expect(parseGitLogEntriesMock).toHaveBeenCalledWith(['a', 'b']);
      expect(getCommitterCountsMock).toHaveBeenCalledWith([
        {
          commitHash: 'hash',
          committer: 'testy',
          date: defaultBeforeDate,
        },
      ]);

      // Since we use console.table console is only called once
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });
});
