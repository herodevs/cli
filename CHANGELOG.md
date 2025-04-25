# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

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
