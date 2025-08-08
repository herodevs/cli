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
   - npx: `npx @herodevs/cli@beta`
1. Refer to the [Commands](#commands) section for a list of commands

## TERMS

Use of this CLI is governed by the [HeroDevs End of Life Dataset Terms of Service and Data Policy](https://docs.herodevs.com/legal/end-of-life-dataset-terms).

## Scanning Behavior

The CLI is designed to be non-invasive:

* It does install dependencies or modify package manager files (package-lock.json, yarn.lock, etc.)
* It analyzes the project in its current state
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
* [`hd scan eol`](#hd-scan-eol)
* [`hd help [COMMAND]`](#hd-help-command)
* [`hd update [CHANNEL]`](#hd-update-channel)

## `hd scan eol`

Scan a given SBOM for EOL data. 
- `scan eol` is the default command and can be omitted.
- If no `--dir` or `--file` are specified, it defaults to `--dir .` (current path).

```
USAGE
  $ hd scan eol [--json] [-f <value>] [-p <value>] [-d <value>] [-s]

FLAGS
  -d, --dir=<value>    The directory to scan in order to create a CycloneDX SBOM
  -f, --file=<value>   The file path of an existing CycloneDX SBOM to scan for EOL
  -s, --save           Save the generated report as herodevs.report.json in the scanned directory
  -s, --save-sbom      Save the generated SBOM as herodevs.sbom.json in the scanned directory

GLOBAL FLAGS
  --json  Format output as JSON.

DESCRIPTION
  Scan a given SBOM for EOL data

EXAMPLES
  Default behavior (no command or flags specified)
    $ hd
  Equivalent to
    $ hd scan eol --dir .
  Skip SBOM generation and specify an existing file
    $ hd scan eol --file /path/to/SBOM.json
  Optionally save report and/or SBOM
    $ hd --dir ./my-project --save --save-sbom
  JSON output (for APIs, CI, etc.)
    $ hd --json
```

_See code: [src/commands/scan/eol.ts](https://github.com/herodevs/cli/blob/v2.0.0-beta.4/src/commands/scan/eol.ts)_

## `hd help [COMMAND]`

Display help.

```
USAGE
  $ hd help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Displays global help or for a specific command.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.29/src/commands/help.ts)_

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