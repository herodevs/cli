# @herodevs/cli

The HeroDevs CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@herodevs/cli.svg)](https://npmjs.org/package/@herodevs/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@herodevs/cli.svg)](https://npmjs.org/package/@herodevs/cli)

<!-- toc -->
* [@herodevs/cli](#herodevscli)
<!-- tocstop -->

### Terms and Data Security

- [HeroDevs End of Life Dataset Terms of Service and Data Policy](https://docs.herodevs.com/legal/end-of-life-dataset-terms)
- [HeroDevs End of Life Dataset Data Privacy and Security](https://docs.herodevs.com/eol-ds/data-privacy-and-security)

### Prerequisites

- Install node v20 or higher: [Download Node](https://nodejs.org/en/download)
- The HeroDevs CLI expects that you have all required technology installed for the project that you are running the CLI against
  - For example, if you are running the CLI against a Gradle project, the CLI expects you to have Java installed.


### Installation methods

#### Node Package Execute (NPX)

With Node installed, you can run the CLI directly from the npm registry without installing it globally or locally on your system

```sh
npx @herodevs/cli@beta
```

#### Global NPM Installation

```sh
npm install -g @herodevs/cli@beta
```

#### Binary Installation

HeroDevs CLI is available as a binary installation, without requiring `npm`. To do that, you may either download and run the script manually, or use the following cURL or Wget command:

```sh
curl -o- https://raw.githubusercontent.com/herodevs/cli/v2.0.0-beta.14/scripts/install.sh | bash
```

```sh
wget -qO- https://raw.githubusercontent.com/herodevs/cli/v2.0.0-beta.14/scripts/install.sh | bash
```

## Scanning Behavior

The CLI is designed to be non-invasive:

* It does **not** install dependencies or modify package manager files (package-lock.json, yarn.lock, etc.)
* It analyzes the project in its current state

## Installing Dependencies Before Use

Some projects and ecosystems require projects to have dependencies installed already, to achieve an accurate scan result. It is **highly** recommended that you install all dependencies of your project to your working directory, before running a scan on your project, to ensure scan accuracy.

### Java Users

Maven and Gradle projects should run an install and build before scanning

## Usage
<!-- usage -->
```sh-session
$ npm install -g @herodevs/cli@beta
$ hd COMMAND
running command...
$ hd (--version)
@herodevs/cli/2.0.0-beta.14 darwin-arm64 node-v24.10.0
$ hd --help [COMMAND]
USAGE
  $ hd COMMAND
...
```
<!-- usagestop -->
## Commands
<!-- commands -->
* [`hd help [COMMAND]`](#hd-help-command)
* [`hd report committers`](#hd-report-committers)
* [`hd scan eol`](#hd-scan-eol)
* [`hd tracker init`](#hd-tracker-init)
* [`hd update [CHANNEL]`](#hd-update-channel)
  * **NOTE:** Only applies to [binary installation method](#binary-installation). NPM users should use [`npm install`](#global-npm-installation) to update to the latest version.

## `hd help [COMMAND]`

Display help for hd.

```
USAGE
  $ hd help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for hd.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.34/src/commands/help.ts)_

## `hd report committers`

Generate report of committers to a git repository

```
USAGE
  $ hd report committers [--json] [-x <value>...] [-d <value>] [--monthly] [-m <value> | -s <value> | -e <value> |  | ]
    [-c] [-s]

FLAGS
  -c, --csv                 Output in CSV format
  -d, --directory=<value>   Directory to search
  -e, --afterDate=<value>   [default: 2024-11-19] Start date (format: yyyy-MM-dd)
  -m, --months=<value>      [default: 12] The number of months of git history to review. Cannot be used along beforeDate
                            and afterDate
  -s, --beforeDate=<value>  [default: 2025-11-19] End date (format: yyyy-MM-dd)
  -s, --save                Save the committers report as herodevs.committers.<output>
  -x, --exclude=<value>...  Path Exclusions (eg -x="./src/bin" -x="./dist")
      --json                Output to JSON format
      --monthly             Break down by calendar month.

DESCRIPTION
  Generate report of committers to a git repository

EXAMPLES
  $ hd report committers

  $ hd report committers --csv -s

  $ hd report committers --json

  $ hd report committers --csv
```

_See code: [src/commands/report/committers.ts](https://github.com/herodevs/cli/blob/v2.0.0-beta.14/src/commands/report/committers.ts)_

## `hd scan eol`

Scan a given SBOM for EOL data

```
USAGE
  $ hd scan eol [--json] [-f <value> | -d <value>] [-s] [-o <value>] [--saveSbom] [--sbomOutput <value>]
    [--saveTrimmedSbom] [--hideReportUrl] [--version]

FLAGS
  -d, --dir=<value>         [default: <current directory>] The directory to scan in order to create a cyclonedx SBOM
  -f, --file=<value>        The file path of an existing SBOM to scan for EOL (supports CycloneDX and SPDX 2.3 formats)
  -o, --output=<value>      Save the generated report to a custom path (defaults to herodevs.report.json when not
                            provided)
  -s, --save                Save the generated report as herodevs.report.json in the scanned directory
      --hideReportUrl       Hide the generated web report URL for this scan
      --saveSbom            Save the generated SBOM as herodevs.sbom.json in the scanned directory
      --saveTrimmedSbom     Save the trimmed SBOM as herodevs.sbom-trimmed.json in the scanned directory
      --sbomOutput=<value>  Save the generated SBOM to a custom path (defaults to herodevs.sbom.json when not provided)
      --version             Show CLI version.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Scan a given SBOM for EOL data

EXAMPLES
  Default behavior (no command or flags specified)

    $ hd

  Equivalent to

    $ hd scan eol --dir .

  Skip SBOM generation and specify an existing file

    $ hd scan eol --file /path/to/sbom.json

  Save the report or SBOM to a file

    $ hd scan eol --save --saveSbom

  Save the report and SBOM to custom paths

    $ hd scan eol --dir . --save --saveSbom --output ./reports/my-report.json --sbomOutput ./reports/my-sbom.json

  Output the report in JSON format (for APIs, CI, etc.)

    $ hd scan eol --json
```

_See code: [src/commands/scan/eol.ts](https://github.com/herodevs/cli/blob/v2.0.0-beta.14/src/commands/scan/eol.ts)_

## `hd tracker init`

Initialize the tracker configuration

```
USAGE
  $ hd tracker init [--force -o] [-d <value>] [-f <value>] [-i <value>...]

FLAGS
  -d, --outputDir=<value>          [default: hd-tracker] Output directory for the tracker configuration file
  -f, --configFile=<value>         [default: config.json] Filename for the tracker configuration file
  -i, --ignorePatterns=<value>...  [default: node_modules] Ignore patterns to use for the tracker configuration file
  -o, --overwrite                  Overwrites the tracker configuration file if it exists
      --force                      Force tracker configuration file creation. Use with --overwrite flag

DESCRIPTION
  Initialize the tracker configuration

EXAMPLES
  $ hd tracker init

  $ hd tracker init -d trackerDir

  $ hd tracker init -d trackerDir -f configFileName

  $ hd tracker init -i node_modules

  $ hd tracker init -i node_modules -i custom_modules

  $ hd tracker init -o
```

_See code: [src/commands/tracker/init.ts](https://github.com/herodevs/cli/blob/v2.0.0-beta.14/src/commands/tracker/init.ts)_

## `hd update [CHANNEL]`

update the hd CLI

* **NOTE:** Only applies to [binary installation method](#binary-installation). NPM users should use [`npm install`](#global-npm-installation) to update to the latest version.

```
USAGE
  $ hd update [CHANNEL] [--force |  | [-a | -v <value> | -i]] [-b ]

FLAGS
  -a, --available        See available versions.
  -b, --verbose          Show more details about the available versions.
  -i, --interactive      Interactively select version to install. This is ignored if a channel is provided.
  -v, --version=<value>  Install a specific version.
      --force            Force a re-download of the requested version.

DESCRIPTION
  update the hd CLI

EXAMPLES
  Update to the stable channel:

    $ hd update stable

  Update to a specific version:

    $ hd update --version 1.0.0

  Interactively select version:

    $ hd update --interactive

  See available versions:

    $ hd update --available
```

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v4.7.13/src/commands/update.ts)_
<!-- commandsstop -->

## CI/CD Usage

You can use `@herodevs/cli` in your CI/CD pipelines to automate EOL scanning.

### Using the Docker Image (Recommended)

We provide a Docker image that's pre-configured to run EOL scans. Based on [`cdxgen`](https://github.com/CycloneDX/cdxgen),
it contains build tools for most project types and will provide best results when generating an SBOM. Use these templates to generate a report and save it to your CI job artifact for analysis and processing after your scan runs.

**Note:** There is a potential to run into permission issues writing out the report to your CI runner. Please ensure that your CI runner is setup to have proper read/write permissions for wherever your output files are being written to.

#### GitHub Actions

```yaml
## .github/workflows/herodevs-eol-scan.yml
name: HeroDevs EOL Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  scan:
    runs-on: ubuntu-latest
    environment: demo
    steps:
      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Run EOL Scan
        run: |
          docker run --name eol-scanner \
            -v $GITHUB_WORKSPACE:/app \
            -w /app \
            ghcr.io/herodevs/eol-scan --save --output /tmp/herodevs.report.json
          docker cp eol-scanner:/tmp/herodevs.report.json ${{ runner.temp }}/herodevs.report.json
          docker rm eol-scanner

      - name: Upload artifact
        uses: actions/upload-artifact@v5
        with:
          name: my-eol-report
          path: ${{ runner.temp }}/herodevs.report.json
```

#### GitLab CI/CD

```yaml
eol-scan: 
  image: 
    name: "ghcr.io/herodevs/eol-scan"
    # Entrypoint or base command must be disabled due 
    # to GitLab's execution mechanism and run manually
    entrypoint: [""] 
  script: "npx @herodevs/cli@beta scan eol -s"
  artifacts:
    paths:
      - herodevs.report.json
```

### Using `npx` in CI

You can use `npx` to run the CLI in your CI pipeline, just like you would run it locally.

> [!NOTE]
> The development environment is expected to be ready to run the app. For best results,
prefer [using the prebuilt image](#using-the-docker-image-recommended), but otherwise, prepare
all requirements before the scan step.

#### GitHub Actions

```yaml
## .github/workflows/herodevs-eol-scan.yml
name: HeroDevs EOL Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v6
        with:
          node-version: '24'

      - run: echo # Prepare environment, install tooling, perform setup, etc.

      - name: Run EOL Scan
        run: npx @herodevs/cli@beta scan eol

      - name: Upload artifact
        uses: actions/upload-artifact@v5
        with:
          name: my-eol-report
          path: herodevs.report.json
```

#### GitLab CI/CD

```yaml
image: alpine

eol-scan:
  script:
    - echo # Prepare environment, install tooling, perform setup, etc.
    - npx @herodevs/cli@beta scan eol -s
  artifacts:
    paths:
      - herodevs.report.json
```

## Local Docker image scans

The same pre-configured image can be pulled locally to scan in an optimized environment. Mount your code
to `/app` or a specified working directory to perform the scan:

```shell
docker run -v "$PWD":/app ghcr.io/herodevs/eol-scan
```
