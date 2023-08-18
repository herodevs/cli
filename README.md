HeroDevs NES Developer Kit -- `@herodevs/ndk`
=================

<!-- [![herodevs](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://herodevs.com)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE) -->

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @herodevs/ndk
$ @herodevs/ndk COMMAND
running command...
$ @herodevs/ndk (--version)
@herodevs/ndk/0.0.0 darwin-arm64 node-v18.17.1
$ @herodevs/ndk --help [COMMAND]
USAGE
  $ @herodevs/ndk COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`@herodevs/ndk committer get-all`](#herodevsndk-committer-get-all)
* [`@herodevs/ndk help [COMMANDS]`](#herodevsndk-help-commands)
* [`@herodevs/ndk plugins`](#herodevsndk-plugins)
* [`@herodevs/ndk plugins:install PLUGIN...`](#herodevsndk-pluginsinstall-plugin)
* [`@herodevs/ndk plugins:inspect PLUGIN...`](#herodevsndk-pluginsinspect-plugin)
* [`@herodevs/ndk plugins:install PLUGIN...`](#herodevsndk-pluginsinstall-plugin-1)
* [`@herodevs/ndk plugins:link PLUGIN`](#herodevsndk-pluginslink-plugin)
* [`@herodevs/ndk plugins:uninstall PLUGIN...`](#herodevsndk-pluginsuninstall-plugin)
* [`@herodevs/ndk plugins:uninstall PLUGIN...`](#herodevsndk-pluginsuninstall-plugin-1)
* [`@herodevs/ndk plugins:uninstall PLUGIN...`](#herodevsndk-pluginsuninstall-plugin-2)
* [`@herodevs/ndk plugins update`](#herodevsndk-plugins-update)

## `@herodevs/ndk committer get-all`

Get All Committers Between Two Dates

```
USAGE
  $ @herodevs/ndk committer get-all -s {yyyy-MM-dd} -e {yyyy-MM-dd} -x {path 1} -x {path 2} -x {path 3}

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -s, --startDate  The most recent date to report from
  -e, --endDate    The oldest date to report from
  -x, --exclude    Files to exclude when reporting
                   Multiple values accepted (eg. `-x ./foo/bar -x ./baz/boo -x ./yet/another`)

GLOBAL FLAGS
  --json           Format output as json
  --log-level      Sets output log level

DESCRIPTION
  Get All Committers Between Two Dates

EXAMPLES
  $ @herodevs/ndk committer get-all -s 2023-08-19 -e 2023-01-01 -x ./src/test -x ./dist
  -----------------------------------------------------------------------------
  Committer               | # of Commits      | Between Dates (oldest - newest)
  -----------------------------------------------------------------------------
  shotaro-kaneda-1        | 11                | 2023-06-01 - 2023-08-19
  tetsuoshima             | 8                 | 2023-03-22 - 2023-06-10

```

_See code: [dist/commands/committer/get-all.ts](dist/commands/committer/get-all.ts)_

## `@herodevs/ndk help [COMMANDS]`

Display help for @herodevs/ndk.

```
USAGE
  $ @herodevs/ndk help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for @herodevs/ndk.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.16/src/commands/help.ts)_

## `@herodevs/ndk plugins`

List installed plugins.

```
USAGE
  $ @herodevs/ndk plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ @herodevs/ndk plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/index.ts)_

## `@herodevs/ndk plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ @herodevs/ndk plugins:install PLUGIN...

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
  $ @herodevs/ndk plugins add

EXAMPLES
  $ @herodevs/ndk plugins:install myplugin 

  $ @herodevs/ndk plugins:install https://github.com/someuser/someplugin

  $ @herodevs/ndk plugins:install someuser/someplugin
```

## `@herodevs/ndk plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ @herodevs/ndk plugins:inspect PLUGIN...

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
  $ @herodevs/ndk plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/inspect.ts)_

## `@herodevs/ndk plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ @herodevs/ndk plugins:install PLUGIN...

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
  $ @herodevs/ndk plugins add

EXAMPLES
  $ @herodevs/ndk plugins:install myplugin 

  $ @herodevs/ndk plugins:install https://github.com/someuser/someplugin

  $ @herodevs/ndk plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/install.ts)_

## `@herodevs/ndk plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ @herodevs/ndk plugins:link PLUGIN

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
  $ @herodevs/ndk plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/link.ts)_

## `@herodevs/ndk plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ @herodevs/ndk plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ @herodevs/ndk plugins unlink
  $ @herodevs/ndk plugins remove
```

## `@herodevs/ndk plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ @herodevs/ndk plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ @herodevs/ndk plugins unlink
  $ @herodevs/ndk plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/uninstall.ts)_

## `@herodevs/ndk plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ @herodevs/ndk plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ @herodevs/ndk plugins unlink
  $ @herodevs/ndk plugins remove
```

## `@herodevs/ndk plugins update`

Update installed plugins.

```
USAGE
  $ @herodevs/ndk plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.5/src/commands/plugins/update.ts)_
<!-- commandsstop -->
