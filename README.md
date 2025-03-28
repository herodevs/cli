# @herodevs/cli

The HeroDevs CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@herodevs/cli.svg)](https://npmjs.org/package/@herodevs/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@herodevs/cli.svg)](https://npmjs.org/package/@herodevs/cli)

<!-- toc -->
* [@herodevs/cli](#herodevscli)
<!-- tocstop -->
## Usage
<!-- usage -->
```sh-session
$ npm install -g @herodevs/cli
$ hd COMMAND
running command...
$ hd (--version)
@herodevs/cli/1.2.0-beta.1 darwin-arm64 node-v22.14.0
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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.27/src/commands/help.ts)_

## `hd report committers`

Generate report of committers to a git repository

```
USAGE
  $ hd report committers [--json] [-m <value>] [-c] [-s]

FLAGS
  -c, --csv             Output in CSV format
  -m, --months=<value>  [default: 12] The number of months of git history to review
  -s, --save            Save the committers report as nes.committers.<output>

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

_See code: [src/commands/report/committers.ts](https://github.com/herodevs/cli/blob/v1.2.0-beta.1/src/commands/report/committers.ts)_

## `hd report purls`

Generate a list of purls from a sbom

```
USAGE
  $ hd report purls [--json] [-f <value>] [-d <value>] [-s] [-c]

FLAGS
  -c, --csv           Save output in CSV format (only applies when using --save)
  -d, --dir=<value>   The directory to scan in order to create a cyclonedx sbom
  -f, --file=<value>  The file path of an existing cyclonedx sbom to scan for EOL
  -s, --save          Save the list of purls as nes.purls.<output>

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

_See code: [src/commands/report/purls.ts](https://github.com/herodevs/cli/blob/v1.2.0-beta.1/src/commands/report/purls.ts)_

## `hd scan eol`

Scan a given sbom for EOL data

```
USAGE
  $ hd scan eol [--json] [-f <value>] [-d <value>] [-s] [-a] [-c]

FLAGS
  -a, --all                 Show all components (default is EOL and LTS only)
  -c, --getCustomerSupport  Get Never-Ending Support for End-of-Life components
  -d, --dir=<value>         The directory to scan in order to create a cyclonedx sbom
  -f, --file=<value>        The file path of an existing cyclonedx sbom to scan for EOL
  -s, --save                Save the generated SBOM as nes.sbom.json in the scanned directory

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Scan a given sbom for EOL data

EXAMPLES
  $ hd scan eol --dir=./my-project

  $ hd scan eol --file=path/to/sbom.json

  $ hd scan eol -a --dir=./my-project
```

_See code: [src/commands/scan/eol.ts](https://github.com/herodevs/cli/blob/v1.2.0-beta.1/src/commands/scan/eol.ts)_

## `hd scan sbom`

Scan a SBOM for purls

```
USAGE
  $ hd scan sbom [--json] [-f <value>] [-d <value>] [-s] [-b]

FLAGS
  -b, --background    Run the scan in the background
  -d, --dir=<value>   The directory to scan in order to create a cyclonedx sbom
  -f, --file=<value>  The file path of an existing cyclonedx sbom to scan for EOL
  -s, --save          Save the generated SBOM as nes.sbom.json in the scanned directory

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Scan a SBOM for purls

EXAMPLES
  $ hd scan sbom --dir=./my-project

  $ hd scan sbom --file=path/to/sbom.json
```

_See code: [src/commands/scan/sbom.ts](https://github.com/herodevs/cli/blob/v1.2.0-beta.1/src/commands/scan/sbom.ts)_
<!-- commandsstop -->
