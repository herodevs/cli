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
