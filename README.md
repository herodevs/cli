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
@herodevs/cli/1.1.0-beta.1 darwin-arm64 node-v22.14.0
$ hd --help [COMMAND]
USAGE
  $ hd COMMAND
...
```
<!-- usagestop -->
## Commands
<!-- commands -->
* [`hd help [COMMAND]`](#hd-help-command)
* [`hd plugins`](#hd-plugins)
* [`hd plugins add PLUGIN`](#hd-plugins-add-plugin)
* [`hd plugins:inspect PLUGIN...`](#hd-pluginsinspect-plugin)
* [`hd plugins install PLUGIN`](#hd-plugins-install-plugin)
* [`hd plugins link PATH`](#hd-plugins-link-path)
* [`hd plugins remove [PLUGIN]`](#hd-plugins-remove-plugin)
* [`hd plugins reset`](#hd-plugins-reset)
* [`hd plugins uninstall [PLUGIN]`](#hd-plugins-uninstall-plugin)
* [`hd plugins unlink [PLUGIN]`](#hd-plugins-unlink-plugin)
* [`hd plugins update`](#hd-plugins-update)
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

## `hd plugins`

List installed plugins.

```
USAGE
  $ hd plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ hd plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/index.ts)_

## `hd plugins add PLUGIN`

Installs a plugin into hd.

```
USAGE
  $ hd plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into hd.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the HD_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the HD_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ hd plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ hd plugins add myplugin

  Install a plugin from a github url.

    $ hd plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ hd plugins add someuser/someplugin
```

## `hd plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ hd plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ hd plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/inspect.ts)_

## `hd plugins install PLUGIN`

Installs a plugin into hd.

```
USAGE
  $ hd plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into hd.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the HD_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the HD_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ hd plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ hd plugins install myplugin

  Install a plugin from a github url.

    $ hd plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ hd plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/install.ts)_

## `hd plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ hd plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ hd plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/link.ts)_

## `hd plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ hd plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ hd plugins unlink
  $ hd plugins remove

EXAMPLES
  $ hd plugins remove myplugin
```

## `hd plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ hd plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/reset.ts)_

## `hd plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ hd plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ hd plugins unlink
  $ hd plugins remove

EXAMPLES
  $ hd plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/uninstall.ts)_

## `hd plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ hd plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ hd plugins unlink
  $ hd plugins remove

EXAMPLES
  $ hd plugins unlink myplugin
```

## `hd plugins update`

Update installed plugins.

```
USAGE
  $ hd plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/update.ts)_

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

_See code: [src/commands/report/committers.ts](https://github.com/herodevs/cli/blob/v1.1.0-beta.1/src/commands/report/committers.ts)_

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

_See code: [src/commands/report/purls.ts](https://github.com/herodevs/cli/blob/v1.1.0-beta.1/src/commands/report/purls.ts)_

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

_See code: [src/commands/scan/eol.ts](https://github.com/herodevs/cli/blob/v1.1.0-beta.1/src/commands/scan/eol.ts)_

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

_See code: [src/commands/scan/sbom.ts](https://github.com/herodevs/cli/blob/v1.1.0-beta.1/src/commands/scan/sbom.ts)_
<!-- commandsstop -->
