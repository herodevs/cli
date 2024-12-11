# HeroDevs CLI - `@herodevs/cli`

## Node Setup & Installation

Node versions 14+

No installation:

```
npx @herodevs/cli ...
```

Global installation:

```
npm install -g @herodevs/cli
hd ...
# or
hdcli ...
```

## Non-Node or Node < 14 Setup & Installation

Navigate [here](https://github.com/herodevs/cli/releases) to download the version for your operating system from the most recent release.

## Available Commands

```bash
# Initializes your project to use NES libraries
hdcli nes init
```

```bash
# Shows a list of committers in git repository
hdcli report committers
```

```bash
# Shows diagnostic information about your project
hdcli report diagnostics
```

```bash
# Initializes the project for the lines-of-code tracker
hdcli tracker init
```

```bash
# Runs a lines-of-code tracker to gather project
hdcli tracker run
```

```bash
# Send information about your project manifest files
hdcli report generate
```

For local debugging and development, it is possible configure the server to which reports are sent by setting the `NES_REPORT_URL` environment variable:

```bash
# Send information about your project manifest files to a custom graphql endpoint
NES_REPORT_URL="https://example.com/graphql" hdcli report generate
```

## Tutorials

- [Configure your project to consume a Never-Ending Support package](docs/nes-init.md)
- [Get an audit of the users who have committed to a project](docs/git-audit.md)
