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
   - Globally: Refer to the [Usage](#usage) instructions on installing the CLI globally
   - Npx:`npx @herodevs/cli@beta <commands>`
1. Refer to the [Commands](#commands) section for a list of commands

## TERMS

Use of this CLI is governed by the [HeroDevs End of Life Dataset Terms of Service and Data Policy](https://docs.herodevs.com/legal/end-of-life-dataset-terms).

## Scanning Behavior

The CLI's scanning commands (`hd scan eol` and `hd scan sbom`) are designed to be non-invasive:

* They do not install dependencies or modify package manager files (package-lock.json, yarn.lock, etc.)
* They analyze the project in its current state
* If you need dependencies installed for accurate scanning, please install them manually before running the scan


## Usage
<!-- usage -->
```sh-session
$ npm install -g @herodevs/cli
$ hd COMMAND
running command...
$ hd (--version)
@herodevs/cli/2.0.0-beta.4 darwin-arm64 node-v22.15.1
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
* [`hd report purls`](#hd-report-purls)
* [`hd scan eol`](#hd-scan-eol)
* [`hd scan sbom`](#hd-scan-sbom)
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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.29/src/commands/help.ts)_

## `hd report committers`

Generate report of committers to a git repository

```
USAGE
  $ hd report committers [--json] [-m <value>] [-c] [-s]

FLAGS
  -c, --csv             Output in CSV format
  -m, --months=<value>  [default: 12] The number of months of git history to review
  -s, --save            Save the committers report as herodevs.committers.<output>

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generate report of committers to a git repository

EXAMPLES
  $ hd report committers

  $ hd report committers --csv -s

  $ hd report committers --json

  $ hd report committers --csv
```

_See code: [src/commands/report/committers.ts](https://github.com/herodevs/cli/blob/v2.0.0-beta.4/src/commands/report/committers.ts)_

## `hd report purls`

Generate a list of purls from a sbom

```
USAGE
  $ hd report purls [--json] [-f <value>] [-d <value>] [-s] [-c]

FLAGS
  -c, --csv           Save output in CSV format (only applies when using --save)
  -d, --dir=<value>   The directory to scan in order to create a cyclonedx sbom
  -f, --file=<value>  The file path of an existing cyclonedx sbom to scan for EOL
  -s, --save          Save the list of purls as herodevs.purls.<output>

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generate a list of purls from a sbom

EXAMPLES
  $ hd report purls --json -s

  $ hd report purls --dir=./my-project

  $ hd report purls --file=path/to/sbom.json

  $ hd report purls --dir=./my-project --save

  $ hd report purls --save --csv
```

_See code: [src/commands/report/purls.ts](https://github.com/herodevs/cli/blob/v2.0.0-beta.4/src/commands/report/purls.ts)_

## `hd scan eol`

Scan a given sbom for EOL data

```
USAGE
  $ hd scan eol [--json] [-f <value>] [-p <value>] [-d <value>] [-s]

FLAGS
  -d, --dir=<value>    The directory to scan in order to create a cyclonedx sbom
  -f, --file=<value>   The file path of an existing cyclonedx sbom to scan for EOL
  -p, --purls=<value>  The file path of a list of purls to scan for EOL
  -s, --save           Save the generated report as herodevs.report.json in the scanned directory

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Scan a given sbom for EOL data

EXAMPLES
  $ hd scan eol --dir=./my-project

  $ hd scan eol --file=path/to/sbom.json

  $ hd scan eol --purls=path/to/purls.json

  $ hd scan eol -a --dir=./my-project
```

_See code: [src/commands/scan/eol.ts](https://github.com/herodevs/cli/blob/v2.0.0-beta.4/src/commands/scan/eol.ts)_

## `hd scan sbom`

Scan a SBOM for purls

```
USAGE
  $ hd scan sbom [--json] [-f <value>] [-d <value>] [-s] [-b]

FLAGS
  -b, --background    Run the scan in the background
  -d, --dir=<value>   The directory to scan in order to create a cyclonedx sbom
  -f, --file=<value>  The file path of an existing cyclonedx sbom to scan for EOL
  -s, --save          Save the generated SBOM as herodevs.sbom.json in the scanned directory

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Scan a SBOM for purls

EXAMPLES
  $ hd scan sbom --dir=./my-project

  $ hd scan sbom --file=path/to/sbom.json
```

_See code: [src/commands/scan/sbom.ts](https://github.com/herodevs/cli/blob/v2.0.0-beta.4/src/commands/scan/sbom.ts)_

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

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v4.6.45/src/commands/update.ts)_
<!-- commandsstop -->

## CI/CD Usage

You can use `@herodevs/cli` in your CI/CD pipelines to automate EOL scanning.

### Using the Docker Image (recommended)

We provide a Docker image that's pre-configured to run EOL scans. Based on [`cdxgen`](https://github.com/CycloneDX/cdxgen), 
it contains build tools for most project types and will provide best results when generating an SBOM.

#### GitHub Actions

```yaml
# .github/workflows/herodevs-eol-scan.yml
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
          args: "--json"
```

#### GitLab CI/CD

```yaml
eol-scan: 
  image: 
    name: "ghcr.io/herodevs/eol-scan"
    # Entrypoint or base command must be disabled due 
    # to GitLab's execution mechanism and run manually
    entrypoint: [""] 
  script: "npx @herodevs/cli@beta --json"
```

### Using `npx`

You can use `npx` to run the CLI just like you'd run it locally.

> [!NOTE] 
> The development environment is expected to be ready to run the app. For best results, 
prefer [using the prebuilt image](#using-the-docker-image-recommended), but otherwise, prepare 
all requirements before the scan step.

#### GitHub Actions

```yaml
# .github/workflows/herodevs-eol-scan.yml
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
```

#### GitLab CI/CD

```yaml
image: alpine

eol-scan:
  script:
    - echo # Prepare environment, install tooling, perform setup, etc.
    - npx @herodevs/cli@beta
```