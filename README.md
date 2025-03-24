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
@herodevs/cli/1.0.0-beta.0 darwin-arm64 node-v22.13.0
$ hd --help [COMMAND]
USAGE
  $ hd COMMAND
...
```
<!-- usagestop -->
## Commands
<!-- commands -->
* [`hd report committers`](#hd-report-committers)
* [`hd report purls`](#hd-report-purls)
* [`hd scan eol`](#hd-scan-eol)
* [`hd scan sbom`](#hd-scan-sbom)

## `hd report committers`

Generate report of committers to a git repository

```
USAGE
  $ hd report committers [--json] [-m <value>] [-o text|json|csv] [-s]

FLAGS
  -m, --months=<value>   [default: 12] The number of months of git history to review
  -o, --output=<option>  [default: text] Output format: text, json, or csv
                         <options: text|json|csv>
  -s, --save             Save the committers report as nes.committers.<output>

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generate report of committers to a git repository

EXAMPLES
  $ hd report committers

  $ hd report committers -o csv -s

  $ hd report committers --output=json

  $ hd report committers --output=csv
```

## `hd report purls`

Generate a list of purls from a sbom

```
USAGE
  $ hd report purls [--json] [-f <value>] [-d <value>] [-s] [-o json|csv]

FLAGS
  -d, --dir=<value>      The directory to scan in order to create a cyclonedx sbom
  -f, --file=<value>     The file path of an existing cyclonedx sbom to scan for EOL
  -o, --output=<option>  [default: json] The format of the saved file (when using --save)
                         <options: json|csv>
  -s, --save             Save the list of purls as nes.purls.<output>

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generate a list of purls from a sbom

EXAMPLES
  $ hd report purls --dir=./my-project

  $ hd report purls --file=path/to/sbom.json

  $ hd report purls --dir=./my-project --save

  $ hd report purls --save --output=csv
```

## `hd scan eol`

Scan a given sbom for EOL data

```
USAGE
  $ hd scan eol [--json] [-f <value>] [-d <value>] [-s]

FLAGS
  -d, --dir=<value>   The directory to scan in order to create a cyclonedx sbom
  -f, --file=<value>  The file path of an existing cyclonedx sbom to scan for EOL
  -s, --save          Save the generated SBOM as nes.sbom.json in the scanned directory

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Scan a given sbom for EOL data

EXAMPLES
  $ hd scan eol --dir=./my-project

  $ hd scan eol --file=path/to/sbom.json
```

## `hd scan sbom`

Scan a SBOM for purls

```
USAGE
  $ hd scan sbom [--json] [-f <value>] [-d <value>] [-s]

FLAGS
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
<!-- commandsstop -->
