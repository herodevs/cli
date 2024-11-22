import { readFileSync, statSync } from 'node:fs';
import { promptToProceedUploadFile } from './prompts';
import { findManifestFile } from './send-manifest';

jest.mock('node:fs', () => ({
  readFileSync: jest.fn(),
  statSync: jest.fn(),
}));

jest.mock('./prompts', () => ({
  promptToProceedUploadFile: jest.fn(),
}));

describe('Telemetry Functions', () => {
  it('should find manifest files correctly', async () => {
    const mockFileName = 'package.json';
    const mockFileData = '{"name": "test package"}';
    const mockFileStat = { size: 1024 };

    (statSync as jest.Mock).mockReturnValue(mockFileStat);
    (readFileSync as jest.Mock).mockReturnValue(mockFileData);
    (promptToProceedUploadFile as jest.Mock).mockResolvedValue(true);

    const result = await findManifestFile();

    expect(result).toEqual({ name: mockFileName, data: mockFileData });
    expect(promptToProceedUploadFile).toHaveBeenCalledWith(mockFileName);
  });

  it('should warn if manifest file is empty', async () => {
    const mockFileName = 'package.json';
    const mockFileStat = { size: 0 };
    (statSync as jest.Mock).mockReturnValue(mockFileStat);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = await findManifestFile();

    expect(result).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith(`File ${mockFileName} is empty`);
    consoleWarnSpy.mockRestore();
  });

  it('should warn if manifest file is too large', async () => {
    const mockFileStat = { size: 6e6 }; // 6MB file, larger than the 5MB max size
    (statSync as jest.Mock).mockReturnValue(mockFileStat);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = await findManifestFile();
    const mockFileName = 'package.json';
    expect(result).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith(`File ${mockFileName} is too large`);
    consoleWarnSpy.mockRestore();
  });

  it('should not proceed with upload if user rejects', async () => {
    const mockFileName = 'package.json';
    const mockFileStat = { size: 1024 };
    (statSync as jest.Mock).mockReturnValue(mockFileStat);
    (promptToProceedUploadFile as jest.Mock).mockResolvedValue(false);
    const result = await findManifestFile();
    expect(result).toBeUndefined();
    expect(promptToProceedUploadFile).toHaveBeenCalledWith(mockFileName);
  });

  it('should return undefined if no manifest file is found', async () => {
    (statSync as jest.Mock).mockReturnValueOnce(undefined);
    const result = await findManifestFile();
    expect(result).toBeUndefined();
  });
});
