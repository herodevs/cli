@herodevs/cli
=================

The HeroDevs CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@herodevs/cli.svg)](https://npmjs.org/package/@herodevs/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@herodevs/cli.svg)](https://npmjs.org/package/@herodevs/cli)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @herodevs/cli
$ hd COMMAND
running command...
$ hd (--version)
@herodevs/cli/2.0.0 darwin-arm64 node-v22.13.1
$ hd --help [COMMAND]
USAGE
  $ hd COMMAND
...
```
<!-- usagestop -->
# Commands
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
* [`hd report committers [FILE]`](#hd-report-committers-file)
* [`hd scan eol [DIR]`](#hd-scan-eol-dir)

## `hd help [COMMAND]`

Display help for hd.

```text
USAGE
  $ mycli123 hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ mycli123 hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/mdonnalley/mycli123/blob/v0.0.0/src/commands/hello/index.ts)_

## `mycli123 hello world`

Say hello world

```text
USAGE
  $ mycli123 hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ mycli123 hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/mdonnalley/mycli123/blob/v0.0.0/src/commands/hello/world.ts)_

## `mycli123 help [COMMAND]`

Display help for mycli123.

```text
USAGE
  $ mycli123 help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for hd.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.26/src/commands/help.ts)_

## `hd plugins`

List installed plugins.

```text
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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/index.ts)_

## `hd plugins add PLUGIN`

Installs a plugin into hd.

```text
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

```text
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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/inspect.ts)_

## `hd plugins install PLUGIN`

Installs a plugin into hd.

```text
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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/install.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/link.ts)_

## `hd plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```text
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

```text
USAGE
  $ hd plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/reset.ts)_

## `hd plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```text
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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/uninstall.ts)_

## `hd plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```text
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

```text
USAGE
  $ hd plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.34/src/commands/plugins/update.ts)_

## `hd report committers [FILE]`

describe the command here

```
USAGE
  $ hd report committers [FILE] [-f] [-n <value>]

ARGUMENTS
  FILE  file to read

FLAGS
  -f, --force
  -n, --name=<value>  name to print

DESCRIPTION
  describe the command here

EXAMPLES
  $ hd report committers
```

_See code: [src/commands/report/committers.ts](https://github.com/herodevs/cli/blob/v2.0.0/src/commands/report/committers.ts)_

## `hd scan eol [DIR]`

Scan a given directory

```
USAGE
  $ hd scan eol [DIR] [--json] [-a] [-d <value>]

ARGUMENTS
  DIR  file to read

FLAGS
  -a, --all
  -d, --dir=<value>  [default: /Users/edward/code/herodevs/cli] The directory to scan

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Scan a given directory

EXAMPLES
  $ hd scan eol
```

_See code: [src/commands/scan/eol.ts](https://github.com/herodevs/cli/blob/v2.0.0/src/commands/scan/eol.ts)_
<!-- commandsstop -->
