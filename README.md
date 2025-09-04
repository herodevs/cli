# @herodevs/cli

The HeroDevs CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@herodevs/cli.svg)](https://npmjs.org/package/@herodevs/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@herodevs/cli.svg)](https://npmjs.org/package/@herodevs/cli)

<!-- toc -->
* [@herodevs/cli](#herodevscli)
<!-- tocstop -->

## Installation Instructions

1. Install node v20 or higher: [Download Node](https://nodejs.org/en/download)
1. Install the CLI using one of the following methods:
   * Globally: Refer to the [Usage](#usage) instructions on installing the CLI globally
   * npx: `npx @herodevs/cli@beta`
1. Refer to the [Commands](#commands) section for a list of commands

## TERMS

Use of this CLI is governed by the [HeroDevs End of Life Dataset Terms of Service and Data Policy](https://docs.herodevs.com/legal/end-of-life-dataset-terms).

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
@herodevs/cli/2.0.0-beta.7 darwin-arm64 node-v22.18.0
$ hd --help [COMMAND]
USAGE
  $ hd COMMAND
...
```
<!-- usagestop -->
## Commands
<!-- commands -->
* [`hd help [COMMAND]`](#hd-help-command)
* [`hd scan eol`](#hd-scan-eol)
* [`hd update [CHANNEL]`](#hd-update-channel)

## `hd help [COMMAND]`

Display help for hd.

```
USAGE
  $ hd help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for hd.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.32/src/commands/help.ts)_

## `hd scan eol`

Scan a given SBOM for EOL data

```
USAGE
  $ hd scan eol [--json] [-f <value> | -d <value>] [-s] [--saveSbom]

FLAGS
  -d, --dir=<value>   [default: <current directory>] The directory to scan in order to create a cyclonedx SBOM
  -f, --file=<value>  The file path of an existing cyclonedx SBOM to scan for EOL
  -s, --save          Save the generated report as herodevs.report.json in the scanned directory
      --saveSbom      Save the generated SBOM as herodevs.sbom.json in the scanned directory

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

  Output the report in JSON format (for APIs, CI, etc.)

    $ hd scan eol --json
```

_See code: [src/commands/scan/eol.ts](https://github.com/herodevs/cli/blob/v2.0.0-beta.7/src/commands/scan/eol.ts)_

## `hd update [CHANNEL]`

update the hd CLI

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

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v4.7.4/src/commands/update.ts)_
<!-- commandsstop -->

## CI/CD Usage

You can use `@herodevs/cli` in your CI/CD pipelines to automate EOL scanning.

### Using the Docker Image (Recommended)

We provide a Docker image that's pre-configured to run EOL scans. Based on [`cdxgen`](https://github.com/CycloneDX/cdxgen),
it contains build tools for most project types and will provide best results when generating an SBOM. Use these templates to generate a report and save it to your CI job artifact for analysis and processing after your scan runs.

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
      - uses: actions/checkout@v4

      - name: Run EOL Scan with Docker
        uses: docker://ghcr.io/herodevs/eol-scan
        with:
          args: "-s"
      
      - name: Upload   artifact
        uses: actions/upload-artifact@v4
        with:
          name: my-eol-report
          path: herodevs.report.json
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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: echo # Prepare environment, install tooling, perform setup, etc.

      - name: Run EOL Scan
        run: npx @herodevs/cli@beta

      - name: Upload   artifact
        uses: actions/upload-artifact@v4
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
