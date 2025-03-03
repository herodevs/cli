import { existsSync, readFileSync } from 'fs';
import * as process from 'node:process';
import { readConfig } from '../../../shared/src/lib/read-config';

jest.mock('fs');


describe('readConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(require('fs'), 'existsSync').mockImplementation(() => false);
    jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => '{}');
  });

  it('should read the default config file if no optionsPath is provided', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue('{"key": "value"}');

    expect(readConfig('/root')).toEqual({ key: 'value' });
    expect(readFileSync).toHaveBeenCalledWith('/root/hd-tracker/config.json', 'utf-8');
  });

  it('should use the provided optionsPath if it exists', () => {
    (existsSync as jest.Mock).mockImplementation((path) => path === '/root/custom-config.json');
    (readFileSync as jest.Mock).mockReturnValue('{"key": "custom"}');

    expect(readConfig('/root', 'custom-config.json')).toEqual({ key: 'custom' });
  });

  it('should log an error and exit if the config file cannot be read', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockImplementation(() => { throw new Error('File read error'); });

    console.error = jest.fn();
    jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('Exit called'); });

    expect(() => readConfig('/root')).toThrow('Exit called');
    expect(console.error).toHaveBeenCalledWith('Error reading config file:', '/root/hd-tracker/config.json');
  });
});
