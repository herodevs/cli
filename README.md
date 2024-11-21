# HeroDevs CLI - `@herodevs/cli`

## Node Setup & Installation

Node versions 14+

No installation:

```bash
npx @herodevs/cli ...
```

Global installation:

```bash
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

## Tutorials

- [Configure your project to consume a Never-Ending Support package](docs/nes-init.md)
- [Get an audit of the users who have committed to a project](docs/git-audit.md)
