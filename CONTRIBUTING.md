# Contributing

## Generate a new command

To generate a new CLI command run this command:

- With topic/group
  - replace `[topic]` with the topic or group in which the command will live
  - replace `[command]` with the name of the command

```
npx nx generate @nx/js:library --name=libs/[topic]/[command] --projectNameAndRootFormat=as-provided --no-interactive
```

- Without topic
  - replace `[command]` with the name of the command

```
npx nx generate @nx/js:library --name=libs/[command] --projectNameAndRootFormat=as-provided --no-interactive
```

## Adding a library

When adding a library to the monorepo, remember to update the CLI's lint rules to ignore the new library.

path to the cli lint rules: apps/cli/.eslintrc.json

## Lint Failures

To fix lint failures run:

```
npm run lint:cli:fix
```
