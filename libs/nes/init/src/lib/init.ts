import { checkbox, confirm, password, select } from '@inquirer/prompts';
import { ArgumentsCamelCase, CommandBuilder, CommandModule } from 'yargs';
import { verifyProjectType } from './verify-project-type';
import { getProductChoices } from './get-product-choices';
import { getPackageChoices } from './get-package-choices';
import { configureProject } from './configure-project';
import * as ora from 'ora';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Options {}

export const nesInitCommand: CommandModule<object, Options> = {
  command: 'init',
  describe: 'Initialize the NES project',
  aliases: [],
  builder: {} as CommandBuilder<unknown, Options>,
  handler: run,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function run(args: ArgumentsCamelCase<Options>): Promise<void> {
  const spinner = ora();

  const projectType = verifyProjectType();

  if (!projectType.valid) {
    console.error(projectType.error);
    return;
  }

  if (
    !(await confirm({
      message: 'Before initializing, please commit all changes. Continue?',
    }))
  ) {
    return;
  }

  const accessToken = await password({
    message: 'Enter access token',
    mask: '*',
  });

  spinner.start('loading your products');
  const productList = await getProductChoices(accessToken, projectType.types);
  spinner.stop();

  const releaseTrain = await select({
    message: 'select a product',
    choices: productList,
    pageSize: productList.length, // no scrolling
  });

  const packageList = getPackageChoices(releaseTrain).map((p) => ({
    ...p,
    checked: true,
  }));

  const packages = await checkbox({
    message: `select the package(s)`,
    choices: packageList,
    loop: false,
    pageSize: packageList.length, // no scrolling
  });

  console.log('configuring your project...');
  configureProject(accessToken, projectType.types, packages);

  console.log('Your project is now configured to access your NES product');
}
