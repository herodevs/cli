import { input, confirm } from '@inquirer/prompts';
import { askConsent, promptClientName, promptToProceedUploadFile } from './prompts';

jest.mock('@inquirer/prompts', () => ({
  input: jest.fn(),
  confirm: jest.fn(),
}));

describe('askConsent', () => {
  it('should return true if args.consent is true', async () => {
    const args = { consent: true } as any;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await askConsent(args);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Data may contain sensitive data, please review before sharing it.'
    );
    expect(result).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should prompt for consent and return true if user agrees', async () => {
    const args = { consent: false } as any;
    (confirm as jest.Mock).mockResolvedValue(true);

    const result = await askConsent(args);

    expect(confirm).toHaveBeenCalledWith({
      message: 'Data may contain sensitive data, please review before sharing it. Continue?',
    });
    expect(result).toBe(true);
  });

  it('should prompt for consent and return false if user disagrees', async () => {
    const args = { consent: false } as any;
    (confirm as jest.Mock).mockResolvedValue(false);

    const result = await askConsent(args);

    expect(confirm).toHaveBeenCalledWith({
      message: 'Data may contain sensitive data, please review before sharing it. Continue?',
    });
    expect(result).toBe(false);
  });
});

describe('promptClientName', () => {
  it('should return the entered name if valid', async () => {
    const mockName = 'John Doe';
    (input as jest.Mock).mockResolvedValue(mockName);

    const result = await promptClientName();

    expect(input).toHaveBeenCalledWith({
      message: "Please enter your company's name:",
      validate: expect.any(Function),
    });
    expect(result).toBe(mockName);
  });

  it('should validate the input and reject empty names', async () => {
    const validateFn = (input as jest.Mock).mock.calls[0][0].validate;
    expect(validateFn('')).toBe('Name cannot be empty!');
    expect(validateFn('   ')).toBe('Name cannot be empty!');
    expect(validateFn('Valid Name')).toBe(true);
  });
});

describe('promptToProceedUploadFile', () => {
  it('should return true if the user confirms the upload', async () => {
    const fileName = 'test-file.txt';
    (confirm as jest.Mock).mockResolvedValue(true);

    const result = await promptToProceedUploadFile(fileName);

    expect(result).toBe(true);
    expect(confirm).toHaveBeenCalledWith({
      message: `Found ${fileName}, this file will be uploaded. Continue?`,
    });
  });

  it('should return false if the user denies the upload', async () => {
    const fileName = 'test-file.txt';
    (confirm as jest.Mock).mockResolvedValue(false);

    const result = await promptToProceedUploadFile(fileName);

    expect(result).toBe(false);
    expect(confirm).toHaveBeenCalledWith({
      message: `Found ${fileName}, this file will be uploaded. Continue?`,
    });
  });
});
