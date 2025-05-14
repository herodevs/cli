# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.3.0-beta.1](https://github.com/herodevs/cli/compare/v1.1.0-beta.1...v1.3.0-beta.1) (2025-05-14)


### ⚠ BREAKING CHANGES

* implements new pagination api ([#149](https://github.com/herodevs/cli/issues/149))

### Features

* accept scan eol flags by default ([#208](https://github.com/herodevs/cli/issues/208)) ([2a643e9](https://github.com/herodevs/cli/commit/2a643e98a3849933983fdfe4d0dc9174ec6bd298))
* add --monthly flag to committers ([#67](https://github.com/herodevs/cli/issues/67)) ([a66d311](https://github.com/herodevs/cli/commit/a66d3111a276f01185b046494d707b0bb84d1ab0))
* add directory flag --directory ([05904b7](https://github.com/herodevs/cli/commit/05904b749d929ec4cbd1e789bdb89a6c94386e66))
* add directory flag --directory ([dcb036d](https://github.com/herodevs/cli/commit/dcb036d71301aadfd48b765a7dc810d10422e7bf))
* add install.sh script ([#193](https://github.com/herodevs/cli/issues/193)) ([17100ba](https://github.com/herodevs/cli/commit/17100baffdda6fde8ffe21447fb13ea86bdf3a4c))
* add last commit date to table ([7344bd2](https://github.com/herodevs/cli/commit/7344bd2a72b4d39c88651b94e3dd3bd57a4d8d1d))
* add purls flag to eol scan ([#141](https://github.com/herodevs/cli/issues/141)) ([a2f9d58](https://github.com/herodevs/cli/commit/a2f9d582c39e8e9226391cab5ea44fbb43fda0ff))
* add update-notifier feature for npx users ([#176](https://github.com/herodevs/cli/issues/176)) ([0daecad](https://github.com/herodevs/cli/commit/0daecad6890f4ace15b3eee403938baadb2cad07))
* add url for prod eol report card ([#228](https://github.com/herodevs/cli/issues/228)) ([ad60bf7](https://github.com/herodevs/cli/commit/ad60bf7a922cf0cb025990191e6f8748062b6274))
* add vuln count to table output ([#175](https://github.com/herodevs/cli/issues/175)) ([d730975](https://github.com/herodevs/cli/commit/d7309756000d419dbb061ee7f530cc919dae8add))
* **auto-update:** Added programmatic auto-update to BaseCommand class ([3c5cf3c](https://github.com/herodevs/cli/commit/3c5cf3ca1cf78547f32a6b29e0cba10cdc247090))
* batch api requests ([#143](https://github.com/herodevs/cli/issues/143)) ([3981b0f](https://github.com/herodevs/cli/commit/3981b0f15e696881009756aeaa287d06354a5e67))
* better handle --json flag in commands ([#129](https://github.com/herodevs/cli/issues/129)) ([dccce6b](https://github.com/herodevs/cli/commit/dccce6bc53466bc1e53c2aefe8b83137eac67df2))
* **committer:get-all:** Updated command output and feature functionality ([3c5cf3c](https://github.com/herodevs/cli/commit/3c5cf3ca1cf78547f32a6b29e0cba10cdc247090))
* **committers:** monthly report ([9be8560](https://github.com/herodevs/cli/commit/9be856022c8fe3694f9707873dd2a45c2af78ec7))
* create error service ([#137](https://github.com/herodevs/cli/issues/137)) ([5e8ab71](https://github.com/herodevs/cli/commit/5e8ab7146d90eef6621191f79ace259dfbcfdfbc))
* enable vuln count feature ([#187](https://github.com/herodevs/cli/issues/187)) ([6915c6e](https://github.com/herodevs/cli/commit/6915c6e208e99d8712ebd3922bb3c28bb3f737af))
* ensure hd cli does not trigger yarn install ([#199](https://github.com/herodevs/cli/issues/199)) ([c8c9336](https://github.com/herodevs/cli/commit/c8c93366ad254c7a61c8194693af0879d57e8ca8))
* ensure transitive dependencies are scanned ([#209](https://github.com/herodevs/cli/issues/209)) ([1dbb716](https://github.com/herodevs/cli/commit/1dbb716b4488a672d1bff670ad23f28a6245aa6e))
* get config based on environment ([#224](https://github.com/herodevs/cli/issues/224)) ([c0e99e0](https://github.com/herodevs/cli/commit/c0e99e0c6556e90b58aec15ab4a886315dd58630))
* hide extra columns on ok and unknown tables ([#189](https://github.com/herodevs/cli/issues/189)) ([2dd96f3](https://github.com/herodevs/cli/commit/2dd96f3a7724d2a668a7600b5bb11953ab34bf41))
* implements new pagination api ([#149](https://github.com/herodevs/cli/issues/149)) ([7551408](https://github.com/herodevs/cli/commit/755140888c55de4321a0479f1a51817aaaf27d3a))
* ingestion ([#64](https://github.com/herodevs/cli/issues/64)) ([e5fa36c](https://github.com/herodevs/cli/commit/e5fa36c985b257ce1d0e75c84a2c0a6805bc466b))
* log `scan eol` report data in cli ([#140](https://github.com/herodevs/cli/issues/140)) ([de81b24](https://github.com/herodevs/cli/commit/de81b245f4bf273c14cf22cbe0be6d7f06ce4348))
* log update-notifier message to stdout ([#223](https://github.com/herodevs/cli/issues/223)) ([80c5622](https://github.com/herodevs/cli/commit/80c5622ca82621a2bb378c056155bbb831636c0a))
* move eol status handling to backend ([#134](https://github.com/herodevs/cli/issues/134)) ([2a616ca](https://github.com/herodevs/cli/commit/2a616ca07be6dfb479e8f652902df8c22273e05b))
* move scan off process ([#131](https://github.com/herodevs/cli/issues/131)) ([7115ad2](https://github.com/herodevs/cli/commit/7115ad2343ba2bc0fef582f95ec2d15536f901fa))
* outputs eol scan in table format ([#168](https://github.com/herodevs/cli/issues/168)) ([fbacece](https://github.com/herodevs/cli/commit/fbacece9344ef4b479b084eaa8658a347bb75b83))
* print web report url ([#222](https://github.com/herodevs/cli/issues/222)) ([3c76a0f](https://github.com/herodevs/cli/commit/3c76a0fdc179806d723f4444b5b5c98dc912d27f))
* **publishing:** Added major, minor, patch, beta, and branch publishing ([3c5cf3c](https://github.com/herodevs/cli/commit/3c5cf3ca1cf78547f32a6b29e0cba10cdc247090))
* rename scheduled to supported ([b022d30](https://github.com/herodevs/cli/commit/b022d301dc83c2223d81124f1616fb516fde076f))
* run `scan eol -t` by default ([#205](https://github.com/herodevs/cli/issues/205)) ([7c5d7a2](https://github.com/herodevs/cli/commit/7c5d7a256b0f816100d8ea26fe790a8f6cb70bdb))
* setup scaffolding for publishing tarballs to s3 ([#152](https://github.com/herodevs/cli/issues/152)) ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* swap scheduled for lts status ([#177](https://github.com/herodevs/cli/issues/177)) ([e82ab2c](https://github.com/herodevs/cli/commit/e82ab2c4fae2784d3a47f7b1c5a14bb488af68d7))
* update report card url per product request ([#230](https://github.com/herodevs/cli/issues/230)) ([fede95e](https://github.com/herodevs/cli/commit/fede95e3423e689d36a9c37e8549bac9a90d7cb7))
* upload tarballs to s3 ([#157](https://github.com/herodevs/cli/issues/157)) ([3ce8582](https://github.com/herodevs/cli/commit/3ce8582f3fb8f834fb43e5694a4fa956d18d4d40))


### Bug Fixes

* change extensions to .ts ([#138](https://github.com/herodevs/cli/issues/138)) ([ded5b88](https://github.com/herodevs/cli/commit/ded5b88af20fd9fa79f363accdd518cc180a4796))
* **deps:** bump @apollo/client from 3.10.4 to 3.13.1 ([#80](https://github.com/herodevs/cli/issues/80)) ([680c392](https://github.com/herodevs/cli/commit/680c3924d2f167f343809190f04e866a332e6c4c))
* end-start was confusing should be swapped ([#68](https://github.com/herodevs/cli/issues/68)) ([b99e95e](https://github.com/herodevs/cli/commit/b99e95eb9c6f14ffdc646c9c0f69785aa9cac88f))
* **install:** force installs for now due to npm ip ([0c66817](https://github.com/herodevs/cli/commit/0c66817002a9f4d6167ad084b53fafe906834e5d))
* properly display package names on table ([#183](https://github.com/herodevs/cli/issues/183)) ([b16f825](https://github.com/herodevs/cli/commit/b16f82559e3a051fb3b2fe8d9eb1540a12f136cb))
* remove cdxgen dynamic import ([#147](https://github.com/herodevs/cli/issues/147)) ([c32d3c1](https://github.com/herodevs/cli/commit/c32d3c1e6f05440efa1d3bcd79cdf37f6a3dfc1d))
* report committers through day is inclusive to end of day ([789f637](https://github.com/herodevs/cli/commit/789f6371ad3529efdd582fd04ad8c70904be459d))
* **tracker:** re-add tracker topic and commands sans charting ([a4f5852](https://github.com/herodevs/cli/commit/a4f58527ae30976759b68ff75156881c14ccb3a8))
* **tracker:** remove tracker ([74cf0e0](https://github.com/herodevs/cli/commit/74cf0e05f4a1161e8e25f6d95d3bdaeee1675549))


### Core

* add e2e coverage to `scan eol` ([#161](https://github.com/herodevs/cli/issues/161)) ([5dc4503](https://github.com/herodevs/cli/commit/5dc4503d62597d9a1907275c53209df4a5d90af0))
* change check release ([#117](https://github.com/herodevs/cli/issues/117)) ([17ea728](https://github.com/herodevs/cli/commit/17ea72893d504b4f2dbf62aed75522427c49857e))
* improve inline help and docs ([d30bcc2](https://github.com/herodevs/cli/commit/d30bcc2a954d0d1b2e9da62adb34b4b5e6e12c6a))
* start testing output in old node.js versions ([#136](https://github.com/herodevs/cli/issues/136)) ([cfd0d63](https://github.com/herodevs/cli/commit/cfd0d63be912e40bfeb44d4dc16388eb628fe1c5))
* verify against multiple versions of node ([541447e](https://github.com/herodevs/cli/commit/541447e6bf22e51a9b39bda31f32c73b01ff3b1f))


### Miscellaneous

* add .nvmrc ([d8a6dcd](https://github.com/herodevs/cli/commit/d8a6dcdea7ee68ecacae5bcccc1d4e0894e3ccad))
* add back in post and pre pack ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* add codeowners ([#135](https://github.com/herodevs/cli/issues/135)) ([f433412](https://github.com/herodevs/cli/commit/f4334126ed0160408072f47ee54db42700ea2ebd))
* add debugging to manual release workflow ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* add lines for better readability ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* add link to terms in the readme ([#229](https://github.com/herodevs/cli/issues/229)) ([e29770e](https://github.com/herodevs/cli/commit/e29770e66bf74e287294a7e2bd636d27b633e0f5))
* add missing `npm run build` ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* add missing eof ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* add more e2e specs ([#148](https://github.com/herodevs/cli/issues/148)) ([aebaad1](https://github.com/herodevs/cli/commit/aebaad1f4af3f1a653599ce09585717e26809dba))
* add more missing dependencies ([#128](https://github.com/herodevs/cli/issues/128)) ([c746390](https://github.com/herodevs/cli/commit/c746390b0cd15881b0d94cec5fde4e5ac837e74e))
* add oclif/core to dependencies ([#127](https://github.com/herodevs/cli/issues/127)) ([52758b9](https://github.com/herodevs/cli/commit/52758b969c5206b193515d5076d2898f43b349a3))
* add run-name to release workflow ([08114aa](https://github.com/herodevs/cli/commit/08114aa4bb99bff5098b392388216172443a79d6))
* allow for beta release tag ([#124](https://github.com/herodevs/cli/issues/124)) ([76514f3](https://github.com/herodevs/cli/commit/76514f354b1431b2f87c99139f3eab01501968a7))
* **build:** revert tsconfig change ([dcea51a](https://github.com/herodevs/cli/commit/dcea51a0a6abeacbc27c4ce86c6defdd39e09f9b))
* continue debugging platform binary build ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* continue debugging win ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* continue debugging windows ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* convert fixtures to purls  ([#185](https://github.com/herodevs/cli/issues/185)) ([e02108e](https://github.com/herodevs/cli/commit/e02108e3ea7746835c1b2cbee893c4f0fc8ca802))
* create action for building tarballs ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* debug symlink issue in ci ([36e1de5](https://github.com/herodevs/cli/commit/36e1de54abbf4f6af8f9b458c0117d78257a8b3e))
* debug windows binary build ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* debug windows binary build ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* delete extra quote mark ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* **deps-dev:** bump @types/inquirer from 9.0.7 to 9.0.8 ([#220](https://github.com/herodevs/cli/issues/220)) ([eb1f4d1](https://github.com/herodevs/cli/commit/eb1f4d133553622822cffc1095d1a6b3faac2949))
* **deps-dev:** bump @types/node from 22.13.13 to 22.14.1 ([#173](https://github.com/herodevs/cli/issues/173)) ([ae87b03](https://github.com/herodevs/cli/commit/ae87b036ccf017903b6372add938b1386e10db8d))
* **deps-dev:** bump @types/node from 22.14.1 to 22.15.3 ([#212](https://github.com/herodevs/cli/issues/212)) ([838d51c](https://github.com/herodevs/cli/commit/838d51cc5ddadf335a27ede62ffdf6b64daee7ef))
* **deps-dev:** bump @types/node from 22.15.3 to 22.15.7 ([#221](https://github.com/herodevs/cli/issues/221)) ([563dc39](https://github.com/herodevs/cli/commit/563dc392c95156ef2c6a8dbb961a36d968f10585))
* **deps-dev:** bump @types/node from 22.15.7 to 22.15.17 ([#225](https://github.com/herodevs/cli/issues/225)) ([09d642c](https://github.com/herodevs/cli/commit/09d642c0a43b33d48a54a0c9f30a7420d9bb52b0))
* **deps-dev:** bump oclif from 4.17.41 to 4.17.43 ([#165](https://github.com/herodevs/cli/issues/165)) ([8a322fe](https://github.com/herodevs/cli/commit/8a322fe49aa73951d8121ecaa4e33b42badfdff3))
* **deps-dev:** bump oclif from 4.17.43 to 4.17.44 ([#169](https://github.com/herodevs/cli/issues/169)) ([4e1fb3c](https://github.com/herodevs/cli/commit/4e1fb3ceb7e3d021c64e4f5d559c02aed8405a6a))
* **deps-dev:** bump oclif from 4.17.44 to 4.17.46 ([#197](https://github.com/herodevs/cli/issues/197)) ([133a566](https://github.com/herodevs/cli/commit/133a56679af09804ca12a95f329f9ddd2a8bbef8))
* **deps-dev:** bump shx from 0.3.4 to 0.4.0 ([#162](https://github.com/herodevs/cli/issues/162)) ([43ae0ff](https://github.com/herodevs/cli/commit/43ae0ff719971a2f2cd2eb2c0038a6304e718a5c))
* **deps-dev:** bump sinon from 19.0.4 to 20.0.0 ([#164](https://github.com/herodevs/cli/issues/164)) ([b461f01](https://github.com/herodevs/cli/commit/b461f01dce110c648257008a3da949230be5c426))
* **deps-dev:** bump tsx from 4.19.3 to 4.19.4 ([#219](https://github.com/herodevs/cli/issues/219)) ([1a8c843](https://github.com/herodevs/cli/commit/1a8c843fdf7dc68dab43f2b1d51eb3d20d45db9d))
* **deps-dev:** bump typescript from 5.8.2 to 5.8.3 ([#163](https://github.com/herodevs/cli/issues/163)) ([13f70d9](https://github.com/herodevs/cli/commit/13f70d99315efa3f9a4f0fd93487ce1c600817ec))
* **deps:** bump @apollo/client from 3.13.5 to 3.13.6 ([#166](https://github.com/herodevs/cli/issues/166)) ([0f6bf68](https://github.com/herodevs/cli/commit/0f6bf68458a9e42129b5e14db0cc602b5e467bf5))
* **deps:** bump @apollo/client from 3.13.6 to 3.13.7 ([#170](https://github.com/herodevs/cli/issues/170)) ([deadc87](https://github.com/herodevs/cli/commit/deadc8720f258a92567f7226de7ac1505c526161))
* **deps:** bump @apollo/client from 3.13.7 to 3.13.8 ([#190](https://github.com/herodevs/cli/issues/190)) ([cbfc964](https://github.com/herodevs/cli/commit/cbfc9645e2e08dd2da1c4be721131beec6cc34b2))
* **deps:** bump @cyclonedx/cdxgen from 11.2.3 to 11.2.4 ([#172](https://github.com/herodevs/cli/issues/172)) ([ebb5b0f](https://github.com/herodevs/cli/commit/ebb5b0f5af9d370a3a0347a5c923926143b9085d))
* **deps:** bump @cyclonedx/cdxgen from 11.2.4 to 11.2.5 ([#195](https://github.com/herodevs/cli/issues/195)) ([e10153f](https://github.com/herodevs/cli/commit/e10153f9e15989c4462671cd9fa7e22e377ce764))
* **deps:** bump @cyclonedx/cdxgen from 11.2.5 to 11.2.6 ([#213](https://github.com/herodevs/cli/issues/213)) ([4773a34](https://github.com/herodevs/cli/commit/4773a34bc6396bccd59fb7f3a3986c9ad5ebf587))
* **deps:** bump @cyclonedx/cdxgen from 11.2.6 to 11.2.7 ([#217](https://github.com/herodevs/cli/issues/217)) ([d384393](https://github.com/herodevs/cli/commit/d384393ad8ebe4076b6675df9e25e5bbe2106e6d))
* **deps:** bump @oclif/core from 4.2.10 to 4.3.0 ([#214](https://github.com/herodevs/cli/issues/214)) ([3f68dc9](https://github.com/herodevs/cli/commit/3f68dc9e25c806236f18a8f75833cd120ff81ef9))
* **deps:** bump @oclif/plugin-help from 6.2.27 to 6.2.28 ([#226](https://github.com/herodevs/cli/issues/226)) ([3589f65](https://github.com/herodevs/cli/commit/3589f65b310b868f3cee6cddf56e72d1ec70fcee))
* **deps:** bump @oclif/plugin-update from 4.6.36 to 4.6.37 ([#171](https://github.com/herodevs/cli/issues/171)) ([e545da1](https://github.com/herodevs/cli/commit/e545da1b846d20480ac6eeec511be9543579f977))
* **deps:** bump @oclif/plugin-update from 4.6.37 to 4.6.38 ([#196](https://github.com/herodevs/cli/issues/196)) ([aca0b82](https://github.com/herodevs/cli/commit/aca0b825dfc0298bf2fe68cb28eac78a8225d79f))
* **deps:** bump @oclif/plugin-update from 4.6.38 to 4.6.39 ([#218](https://github.com/herodevs/cli/issues/218)) ([2d07bf3](https://github.com/herodevs/cli/commit/2d07bf3bc8e34c29dcf42e37e7cc47df9e1eedba))
* **deps:** bump actions/setup-node from 4.2.0 to 4.3.0 ([#114](https://github.com/herodevs/cli/issues/114)) ([7f32e4b](https://github.com/herodevs/cli/commit/7f32e4bd26adf42733de991f402a8af438a77292))
* **deps:** bump actions/setup-node from 4.3.0 to 4.4.0 ([#174](https://github.com/herodevs/cli/issues/174)) ([9eebc24](https://github.com/herodevs/cli/commit/9eebc24784eb3de837ffd5470d8b463efee1ffdd))
* **deps:** bump biomejs/setup-biome from 2.3.0 to 2.5.0 ([#146](https://github.com/herodevs/cli/issues/146)) ([44ddac4](https://github.com/herodevs/cli/commit/44ddac4e85d00c67633c054b99f9b7448bce93fc))
* **deps:** bump deps ([a0e8b46](https://github.com/herodevs/cli/commit/a0e8b46c65a25191758cab84107c1127927be10a))
* **deps:** bump graphql from 16.10.0 to 16.11.0 ([#211](https://github.com/herodevs/cli/issues/211)) ([cc4f9eb](https://github.com/herodevs/cli/commit/cc4f9ebc46c4c61ee4d02e5ab41ab2fc4da56cb6))
* **dev-deps:** bump @nx/eslint from 19.6.1 to 19.8.14 ([#79](https://github.com/herodevs/cli/issues/79)) ([1fb33b4](https://github.com/herodevs/cli/commit/1fb33b409462eae319c29ea770169b359f6fa525))
* **dev-deps:** bump @nx/workspace from 19.6.1 to 19.8.14 ([#72](https://github.com/herodevs/cli/issues/72)) ([43c0291](https://github.com/herodevs/cli/commit/43c0291ab699ebe020a384d510eb5bc2a990d2b7))
* **dev-deps:** bump @types/node from 18.16.9 to 18.19.68 ([#70](https://github.com/herodevs/cli/issues/70)) ([5a5d2ad](https://github.com/herodevs/cli/commit/5a5d2adc141232647fd0c0536534b46905040c17))
* **dev-deps:** bump typescript from 5.5.4 to 5.8.2 ([#81](https://github.com/herodevs/cli/issues/81)) ([685c51e](https://github.com/herodevs/cli/commit/685c51e0d50c48edbf9f158b7d2d68c0c596b064))
* drop --no-xz on windows ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* drop package locks ([#116](https://github.com/herodevs/cli/issues/116)) ([ce1ebb7](https://github.com/herodevs/cli/commit/ce1ebb76eb2114a7e6e54191cd5021959a658aac))
* drop sea ([#121](https://github.com/herodevs/cli/issues/121)) ([c5b801f](https://github.com/herodevs/cli/commit/c5b801fcc2c1989d513afd5c03a794d1e7de0691))
* ee/exclude tarballs from npm ([#158](https://github.com/herodevs/cli/issues/158)) ([dea22fb](https://github.com/herodevs/cli/commit/dea22fbe331755aefd3f3957123776480844b60d))
* ensure checkout version happens correctly ([#156](https://github.com/herodevs/cli/issues/156)) ([863221f](https://github.com/herodevs/cli/commit/863221facef76e41e622aa48902cfc84a3c87c85))
* ensure each binary has unique name ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* ensure each matrix  builds one artifact ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* exclude e2e directory from dependabot npm scan ([#160](https://github.com/herodevs/cli/issues/160)) ([d55c75f](https://github.com/herodevs/cli/commit/d55c75f778f3eb1c1b9319c4a00c650178463191))
* extract github release into an action ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* extract windows tar wrapper into ps script ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* fix ENOENT errors ([#78](https://github.com/herodevs/cli/issues/78)) ([df90a7b](https://github.com/herodevs/cli/commit/df90a7be97342255760f430f914759401cf6b5b8))
* fix how we set channels in s3 ([#159](https://github.com/herodevs/cli/issues/159)) ([9301cb3](https://github.com/herodevs/cli/commit/9301cb36901bb24a51f2bffe346d6dc253624a8b))
* fix relative path issue with tar-wrapper ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* fix relative paths ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* get rid of pre and post pack commands ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* get version from package.json ([#125](https://github.com/herodevs/cli/issues/125)) ([ab51a86](https://github.com/herodevs/cli/commit/ab51a86bc80ece14fc5361cb4c7bca3e88739e63))
* go back to win targets ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* improve error handling for purl files ([#201](https://github.com/herodevs/cli/issues/201)) ([fc60ec7](https://github.com/herodevs/cli/commit/fc60ec7116aebdf95bd99dca61e39a4e4f92c731))
* keep package.json 0.0.0 ([aa71a07](https://github.com/herodevs/cli/commit/aa71a07169be7c5a976016ae0021e06dcfd38f8b))
* linting ([8e21952](https://github.com/herodevs/cli/commit/8e21952df6db16164b53737840118ee81ab35d19))
* manual ci ([#123](https://github.com/herodevs/cli/issues/123)) ([dcceacd](https://github.com/herodevs/cli/commit/dcceacd72338b222517ff62a52044e8a636ce3bb))
* more windows binary debugging ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* narrow scope of published artifacts ([7ca976f](https://github.com/herodevs/cli/commit/7ca976ff270ceb30a8a578b66c9b34b216d25eaa))
* only install oclif globally on win ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* prepare for release 1.1.0-beta.1 ([#133](https://github.com/herodevs/cli/issues/133)) ([25658e3](https://github.com/herodevs/cli/commit/25658e3f18a52c456f3705682ff97cece2acfc01))
* properly handle slashes in tarball action ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* release 0.3.0 ([272b1ce](https://github.com/herodevs/cli/commit/272b1cee5d9f454a5e21b0044b6fa9d2f5b0fa68))
* release 1.4.0-beta.1 ([#155](https://github.com/herodevs/cli/issues/155)) ([6ea783b](https://github.com/herodevs/cli/commit/6ea783bd215854a66d6edc659d217d1a5fee73c4))
* release 1.5.0-beta.1 ([#178](https://github.com/herodevs/cli/issues/178)) ([b022d30](https://github.com/herodevs/cli/commit/b022d301dc83c2223d81124f1616fb516fde076f))
* release 1.6.0-beta.0 ([#210](https://github.com/herodevs/cli/issues/210)) ([57d056c](https://github.com/herodevs/cli/commit/57d056ceea08f132ec5a2c34f4d5ada2b0117249))
* release v1.1.0-beta.0 ([#122](https://github.com/herodevs/cli/issues/122)) ([3a8db84](https://github.com/herodevs/cli/commit/3a8db840ee7eda9c2d16637088cb5661057f9eb2))
* **release:** 1.5.0-beta.2 ([0c35010](https://github.com/herodevs/cli/commit/0c3501037bcf58e6d088616e3cfe24de5c3e6659))
* **release:** 1.5.0-beta.3 ([#204](https://github.com/herodevs/cli/issues/204)) ([7b49285](https://github.com/herodevs/cli/commit/7b49285842a4292cafff712975dcbfb707405a72))
* remove 'staging' from run-name ([3432025](https://github.com/herodevs/cli/commit/343202537333b39f77cb080d904ff093b3252756))
* rename nes.**.json to eol.**.json ([#200](https://github.com/herodevs/cli/issues/200)) ([9ae477d](https://github.com/herodevs/cli/commit/9ae477d8be84c54ad5fb47b1602b8d9de065a308))
* replace commit-and-tag-version ([#207](https://github.com/herodevs/cli/issues/207)) ([1321f16](https://github.com/herodevs/cli/commit/1321f16b4f47373da0ce8803ddbe014b2352196f))
* skip creating git tag for manual release ([#126](https://github.com/herodevs/cli/issues/126)) ([ddff89a](https://github.com/herodevs/cli/commit/ddff89ae36ef7900005351e82af00ae0bb613095))
* split step in build tarball by os ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* switch default to dry run ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* try different tar tool, add debug logs ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* trying again ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))
* update npm auth token ([cac6004](https://github.com/herodevs/cli/commit/cac6004a2f9894f9d8c60b78a75ffe30b31a0f9e))
* update release.sh script with pr feature ([#194](https://github.com/herodevs/cli/issues/194)) ([56082e2](https://github.com/herodevs/cli/commit/56082e2f6b7f98cd1d2871aa7c304d0f2a370656))
* use powershell syntax on windows ([4c28b13](https://github.com/herodevs/cli/commit/4c28b13d6fd3886ed828822831ef584e5e138167))

## [1.5.0-beta.3](https://github.com/herodevs/cli/compare/v1.4.0-beta.1...v1.5.0-beta.3) (2025-04-25)


### Features

* add install.sh script ([#193](https://github.com/herodevs/cli/issues/193)) ([17100ba](https://github.com/herodevs/cli/commit/17100baffdda6fde8ffe21447fb13ea86bdf3a4c))
* ensure hd cli does not trigger yarn install ([#199](https://github.com/herodevs/cli/issues/199)) ([c8c9336](https://github.com/herodevs/cli/commit/c8c93366ad254c7a61c8194693af0879d57e8ca8))


## [1.5.0-beta.2](https://github.com/herodevs/cli/compare/v1.4.0-beta.1...v1.5.0-beta.2) (2025-04-18)


### Features

* add update-notifier feature for npx users ([#176](https://github.com/herodevs/cli/issues/176)) ([0daecad](https://github.com/herodevs/cli/commit/0daecad6890f4ace15b3eee403938baadb2cad07))
* add vuln count to table output ([#175](https://github.com/herodevs/cli/issues/175)) ([d730975](https://github.com/herodevs/cli/commit/d7309756000d419dbb061ee7f530cc919dae8add))
* enable vuln count feature ([#187](https://github.com/herodevs/cli/issues/187)) ([6915c6e](https://github.com/herodevs/cli/commit/6915c6e208e99d8712ebd3922bb3c28bb3f737af)), closes [#188](https://github.com/herodevs/cli/issues/188)
* hide extra columns on ok and unknown tables ([#189](https://github.com/herodevs/cli/issues/189)) ([2dd96f3](https://github.com/herodevs/cli/commit/2dd96f3a7724d2a668a7600b5bb11953ab34bf41))
* outputs eol scan in table format ([#168](https://github.com/herodevs/cli/issues/168)) ([fbacece](https://github.com/herodevs/cli/commit/fbacece9344ef4b479b084eaa8658a347bb75b83))
* swap scheduled for lts status ([#177](https://github.com/herodevs/cli/issues/177)) ([e82ab2c](https://github.com/herodevs/cli/commit/e82ab2c4fae2784d3a47f7b1c5a14bb488af68d7))
* upload tarballs to s3 ([#157](https://github.com/herodevs/cli/issues/157)) ([3ce8582](https://github.com/herodevs/cli/commit/3ce8582f3fb8f834fb43e5694a4fa956d18d4d40))


### Bug Fixes

* properly display package names on table ([#183](https://github.com/herodevs/cli/issues/183)) ([b16f825](https://github.com/herodevs/cli/commit/b16f82559e3a051fb3b2fe8d9eb1540a12f136cb))

## [1.1.0-beta.1](https://github.com/herodevs/cli/compare/v1.0.0-beta.0...v1.1.0-beta.0) (2025-03-24)


### Features

* add --monthly flag to committers ([#67](https://github.com/herodevs/cli/issues/67)) ([a66d311](https://github.com/herodevs/cli/commit/a66d3111a276f01185b046494d707b0bb84d1ab0))
* add directory flag --directory ([05904b7](https://github.com/herodevs/cli/commit/05904b749d929ec4cbd1e789bdb89a6c94386e66))
* add directory flag --directory ([dcb036d](https://github.com/herodevs/cli/commit/dcb036d71301aadfd48b765a7dc810d10422e7bf))
* add last commit date to table ([7344bd2](https://github.com/herodevs/cli/commit/7344bd2a72b4d39c88651b94e3dd3bd57a4d8d1d))
* **auto-update:** Added programmatic auto-update to BaseCommand class ([3c5cf3c](https://github.com/herodevs/cli/commit/3c5cf3ca1cf78547f32a6b29e0cba10cdc247090))
* better handle --json flag in commands ([#129](https://github.com/herodevs/cli/issues/129)) ([dccce6b](https://github.com/herodevs/cli/commit/dccce6bc53466bc1e53c2aefe8b83137eac67df2))
* **committer:get-all:** Updated command output and feature functionality ([3c5cf3c](https://github.com/herodevs/cli/commit/3c5cf3ca1cf78547f32a6b29e0cba10cdc247090))
* **committers:** monthly report ([9be8560](https://github.com/herodevs/cli/commit/9be856022c8fe3694f9707873dd2a45c2af78ec7))
* ingestion ([#64](https://github.com/herodevs/cli/issues/64)) ([e5fa36c](https://github.com/herodevs/cli/commit/e5fa36c985b257ce1d0e75c84a2c0a6805bc466b))
* **publishing:** Added major, minor, patch, beta, and branch publishing ([3c5cf3c](https://github.com/herodevs/cli/commit/3c5cf3ca1cf78547f32a6b29e0cba10cdc247090))


### Bug Fixes

* **deps:** bump @apollo/client from 3.10.4 to 3.13.1 ([#80](https://github.com/herodevs/cli/issues/80)) ([680c392](https://github.com/herodevs/cli/commit/680c3924d2f167f343809190f04e866a332e6c4c))
* end-start was confusing should be swapped ([#68](https://github.com/herodevs/cli/issues/68)) ([b99e95e](https://github.com/herodevs/cli/commit/b99e95eb9c6f14ffdc646c9c0f69785aa9cac88f))
* **install:** force installs for now due to npm ip ([0c66817](https://github.com/herodevs/cli/commit/0c66817002a9f4d6167ad084b53fafe906834e5d))
* report committers through day is inclusive to end of day ([789f637](https://github.com/herodevs/cli/commit/789f6371ad3529efdd582fd04ad8c70904be459d))
* **tracker:** re-add tracker topic and commands sans charting ([a4f5852](https://github.com/herodevs/cli/commit/a4f58527ae30976759b68ff75156881c14ccb3a8))
* **tracker:** remove tracker ([74cf0e0](https://github.com/herodevs/cli/commit/74cf0e05f4a1161e8e25f6d95d3bdaeee1675549))


### Core

* change check release ([#117](https://github.com/herodevs/cli/issues/117)) ([17ea728](https://github.com/herodevs/cli/commit/17ea72893d504b4f2dbf62aed75522427c49857e))
* improve inline help and docs ([d30bcc2](https://github.com/herodevs/cli/commit/d30bcc2a954d0d1b2e9da62adb34b4b5e6e12c6a))
* verify against multiple versions of node ([541447e](https://github.com/herodevs/cli/commit/541447e6bf22e51a9b39bda31f32c73b01ff3b1f))


### Miscellaneous

* add .nvmrc ([d8a6dcd](https://github.com/herodevs/cli/commit/d8a6dcdea7ee68ecacae5bcccc1d4e0894e3ccad))
* add more missing dependencies ([#128](https://github.com/herodevs/cli/issues/128)) ([c746390](https://github.com/herodevs/cli/commit/c746390b0cd15881b0d94cec5fde4e5ac837e74e))
* add oclif/core to dependencies ([#127](https://github.com/herodevs/cli/issues/127)) ([52758b9](https://github.com/herodevs/cli/commit/52758b969c5206b193515d5076d2898f43b349a3))
* add run-name to release workflow ([08114aa](https://github.com/herodevs/cli/commit/08114aa4bb99bff5098b392388216172443a79d6))
* allow for beta release tag ([#124](https://github.com/herodevs/cli/issues/124)) ([76514f3](https://github.com/herodevs/cli/commit/76514f354b1431b2f87c99139f3eab01501968a7))
* **build:** revert tsconfig change ([dcea51a](https://github.com/herodevs/cli/commit/dcea51a0a6abeacbc27c4ce86c6defdd39e09f9b))
* debug symlink issue in ci ([36e1de5](https://github.com/herodevs/cli/commit/36e1de54abbf4f6af8f9b458c0117d78257a8b3e))
* **deps:** bump actions/setup-node from 4.2.0 to 4.3.0 ([#114](https://github.com/herodevs/cli/issues/114)) ([7f32e4b](https://github.com/herodevs/cli/commit/7f32e4bd26adf42733de991f402a8af438a77292))
* **deps:** bump deps ([a0e8b46](https://github.com/herodevs/cli/commit/a0e8b46c65a25191758cab84107c1127927be10a))
* **dev-deps:** bump @nx/eslint from 19.6.1 to 19.8.14 ([#79](https://github.com/herodevs/cli/issues/79)) ([1fb33b4](https://github.com/herodevs/cli/commit/1fb33b409462eae319c29ea770169b359f6fa525))
* **dev-deps:** bump @nx/workspace from 19.6.1 to 19.8.14 ([#72](https://github.com/herodevs/cli/issues/72)) ([43c0291](https://github.com/herodevs/cli/commit/43c0291ab699ebe020a384d510eb5bc2a990d2b7))
* **dev-deps:** bump @types/node from 18.16.9 to 18.19.68 ([#70](https://github.com/herodevs/cli/issues/70)) ([5a5d2ad](https://github.com/herodevs/cli/commit/5a5d2adc141232647fd0c0536534b46905040c17))
* **dev-deps:** bump typescript from 5.5.4 to 5.8.2 ([#81](https://github.com/herodevs/cli/issues/81)) ([685c51e](https://github.com/herodevs/cli/commit/685c51e0d50c48edbf9f158b7d2d68c0c596b064))
* drop package locks ([#116](https://github.com/herodevs/cli/issues/116)) ([ce1ebb7](https://github.com/herodevs/cli/commit/ce1ebb76eb2114a7e6e54191cd5021959a658aac))
* drop sea ([#121](https://github.com/herodevs/cli/issues/121)) ([c5b801f](https://github.com/herodevs/cli/commit/c5b801fcc2c1989d513afd5c03a794d1e7de0691))
* fix ENOENT errors ([#78](https://github.com/herodevs/cli/issues/78)) ([df90a7b](https://github.com/herodevs/cli/commit/df90a7be97342255760f430f914759401cf6b5b8))
* get version from package.json ([#125](https://github.com/herodevs/cli/issues/125)) ([ab51a86](https://github.com/herodevs/cli/commit/ab51a86bc80ece14fc5361cb4c7bca3e88739e63))
* keep package.json 0.0.0 ([aa71a07](https://github.com/herodevs/cli/commit/aa71a07169be7c5a976016ae0021e06dcfd38f8b))
* linting ([8e21952](https://github.com/herodevs/cli/commit/8e21952df6db16164b53737840118ee81ab35d19))
* manual ci ([#123](https://github.com/herodevs/cli/issues/123)) ([dcceacd](https://github.com/herodevs/cli/commit/dcceacd72338b222517ff62a52044e8a636ce3bb))
* narrow scope of published artifacts ([7ca976f](https://github.com/herodevs/cli/commit/7ca976ff270ceb30a8a578b66c9b34b216d25eaa))
* release 0.3.0 ([272b1ce](https://github.com/herodevs/cli/commit/272b1cee5d9f454a5e21b0044b6fa9d2f5b0fa68))
* remove 'staging' from run-name ([3432025](https://github.com/herodevs/cli/commit/343202537333b39f77cb080d904ff093b3252756))
* skip creating git tag for manual release ([#126](https://github.com/herodevs/cli/issues/126)) ([ddff89a](https://github.com/herodevs/cli/commit/ddff89ae36ef7900005351e82af00ae0bb613095))
* update npm auth token ([cac6004](https://github.com/herodevs/cli/commit/cac6004a2f9894f9d8c60b78a75ffe30b31a0f9e))
