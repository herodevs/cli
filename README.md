# HeroDevs NES Developer Kit -- `@herodevs/cli`

<!-- [![herodevs](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://herodevs.com)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE) -->

<!-- toc -->
* [HeroDevs NES Developer Kit -- `@herodevs/cli`](#herodevs-nes-developer-kit----herodevscli)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @herodevs/cli
$ @herodevs/cli COMMAND
running command...
$ @herodevs/cli (--version)
@herodevs/cli/0.1.7 darwin-arm64 node-v18.17.1
$ @herodevs/cli --help [COMMAND]
USAGE
  $ @herodevs/cli COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`@herodevs/cli committer [GET-ALL]`](#herodevscli-committer-get-all)
* [`@herodevs/cli committer:get-all [flags [-s][-e][-x]]`](#herodevscli-committerget-all-flags--s-e-x)
* [`@herodevs/cli help [COMMANDS]`](#herodevscli-help-commands)
* [`@herodevs/cli plugins`](#herodevscli-plugins)
* [`@herodevs/cli plugins:install PLUGIN...`](#herodevscli-pluginsinstall-plugin)
* [`@herodevs/cli plugins:inspect PLUGIN...`](#herodevscli-pluginsinspect-plugin)
* [`@herodevs/cli plugins:install PLUGIN...`](#herodevscli-pluginsinstall-plugin-1)
* [`@herodevs/cli plugins:link PLUGIN`](#herodevscli-pluginslink-plugin)
* [`@herodevs/cli plugins:uninstall PLUGIN...`](#herodevscli-pluginsuninstall-plugin)
* [`@herodevs/cli plugins:uninstall PLUGIN...`](#herodevscli-pluginsuninstall-plugin-1)
* [`@herodevs/cli plugins:uninstall PLUGIN...`](#herodevscli-pluginsuninstall-plugin-2)
* [`@herodevs/cli plugins update`](#herodevscli-plugins-update)
* [`@herodevs/cli update verify`](#herodevscli-update-verify)

## `@herodevs/cli committer [GET-ALL]`

Gets committer info

```
USAGE
  $ @herodevs/cli committer [GET-ALL] [--json] [--log-level debug|info|warn|error]

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

DESCRIPTION
  Gets committer info

EXAMPLES
  $ @herodevs/cli committer
```

_See code: [dist/commands/committer/index.ts](https://github.com/herodevs/cli/blob/v0.1.7/dist/commands/committer/index.ts)_

## `@herodevs/cli committer:get-all [flags [-s][-e][-x]]`

Get Committers Between Two Dates

```
USAGE
  $ @herodevs/cli committer get-all [flags [-s][-e][-x]]

FLAGS
  -e, --endDate=<value>     [default: 2022-08-31] End Date (format: yyyy-MM-dd)
  -s, --startDate=<value>   [default: 2023-08-31] Start Date (format: yyyy-MM-dd)
  -x, --exclude=<value>...  Path Exclusions (eg -x="./src/bin" -x="./dist")

GLOBAL FLAGS
  --json                Format output as json.
  --log-level=<option>  Specify level for logging.
                        <options: debug|info|warn|error>

EXAMPLES
  $ @herodevs/cli committer get-all
```

_See code: [dist/commands/committer/get-all.ts](https://github.com/herodevs/cli/blob/v0.1.7/dist/commands/committer/get-all.ts)_

## `@herodevs/cli help [COMMANDS]`

Display help for @herodevs/cli.

```
USAGE
  $ @herodevs/cli help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for @herodevs/cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.16/src/commands/help.ts)_

## `@herodevs/cli plugins`

List installed plugins.

```
USAGE
  $ @herodevs/cli plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ @herodevs/cli plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/index.ts)_

## `@herodevs/cli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ @herodevs/cli plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ @herodevs/cli plugins add

EXAMPLES
  $ @herodevs/cli plugins:install myplugin 

  $ @herodevs/cli plugins:install https://github.com/someuser/someplugin

  $ @herodevs/cli plugins:install someuser/someplugin
```

## `@herodevs/cli plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ @herodevs/cli plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ @herodevs/cli plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/inspect.ts)_

## `@herodevs/cli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ @herodevs/cli plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ @herodevs/cli plugins add

EXAMPLES
  $ @herodevs/cli plugins:install myplugin 

  $ @herodevs/cli plugins:install https://github.com/someuser/someplugin

  $ @herodevs/cli plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/install.ts)_

## `@herodevs/cli plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ @herodevs/cli plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ @herodevs/cli plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/link.ts)_

## `@herodevs/cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ @herodevs/cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ @herodevs/cli plugins unlink
  $ @herodevs/cli plugins remove
```

## `@herodevs/cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ @herodevs/cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ @herodevs/cli plugins unlink
  $ @herodevs/cli plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/uninstall.ts)_

## `@herodevs/cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ @herodevs/cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ @herodevs/cli plugins unlink
  $ @herodevs/cli plugins remove
```

## `@herodevs/cli plugins update`

Update installed plugins.

```
USAGE
  $ @herodevs/cli plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/update.ts)_

## `@herodevs/cli update verify`

verifies version

```
USAGE
  $ @herodevs/cli update verify [-q]

FLAGS
  -q, --quiet  Prints/returns nothing if version is up to date

DESCRIPTION
  verifies version

EXAMPLES
  $ @herodevs/cli update verify
```

_See code: [dist/commands/update/verify.ts](https://github.com/herodevs/cli/blob/v0.1.7/dist/commands/update/verify.ts)_
<!-- commandsstop -->
