declare module '@cyclonedx/cdxgen' {
  /**
   * For all modules in the specified package, creates a list of
   * component objects from each one.
   */
  export function listComponents(options: any, allImports: any, pkg: any, ptype?: string): any[];

  /** Function to create BOM string for various languages */
  export function createBom(path: string, options: any): any;
  export function createMultiXBom(pathList: string[], options: any): Promise<any>;
  export function createXBom(path: string, options: any): Promise<any>;

  /** BOM creation functions for specific technologies */
  export function createJarBom(path: string, options: any): any;
  export function createAndroidBom(
    path: string,
    options: any,
  ): { bomJson: any; dependencies: any; parentComponent: any };
  export function createBinaryBom(
    path: string,
    options: any,
  ): { bomJson: any; dependencies: any; parentComponent: any };
  export function createJavaBom(path: string, options: any): Promise<any>;
  export function createNodejsBom(path: string, options: any): Promise<any>;
  export function createPixiBom(path: string, options: any): any;
  export function createPythonBom(path: string, options: any): Promise<any>;
  export function createGoBom(path: string, options: any): Promise<any>;
  export function createRustBom(path: string, options: any): Promise<any>;
  export function createDartBom(path: string, options: any): Promise<any>;
  export function createCppBom(path: string, options: any): any;
  export function createClojureBom(path: string, options: any): any;
  export function createHaskellBom(path: string, options: any): any;
  export function createElixirBom(path: string, options: any): any;
  export function createGitHubBom(path: string, options: any): any;
  export function createCloudBuildBom(path: string, options: any): any;
  export function createOSBom(_path: string, options: any): Promise<any>;
  export function createJenkinsBom(path: string, options: any): Promise<any>;
  export function createHelmBom(path: string, options: any): any;
  export function createSwiftBom(path: string, options: any): Promise<any>;
  export function createContainerSpecLikeBom(path: string, options: any): any;
  export function createPHPBom(path: string, options: any): any;
  export function createRubyBom(path: string, options: any): Promise<any>;
  export function createCsharpBom(path: string, options: any): Promise<any>;

  /** Function to create BOM for cryptographic certificates */
  export function createCryptoCertsBom(
    path: string,
    options: any,
  ): Promise<{
    bomJson: {
      components: {
        'bom-ref': string;
        cryptoProperties: {
          algorithmProperties: {
            executionEnvironment: string;
            implementationPlatform: string;
          };
          assetType: string;
        };
        name: string;
        properties: { name: string; value: string }[];
        type: string;
        version: string;
      }[];
    };
  }>;

  /** Utility functions */
  export function mergeDependencies(
    dependencies: any,
    newDependencies: any,
    parentComponent?: {},
  ): ({ dependsOn: any[]; provides: any[]; ref: string } | { dependsOn: any[]; provides?: undefined; ref: string })[];

  export function trimComponents(components: any[]): any[];
  export function dedupeBom(options: any, components: any[], parentComponent: any, dependencies: any[]): any;

  /** Method to submit the generated BOM to a server */
  export function submitBom(args: any, bomContents: any): Promise<undefined | { errors: string[] } | { token: string }>;
}
