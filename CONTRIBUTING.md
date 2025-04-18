# Contributing

## Testing

### E2E Tests

When adding new test fixtures that include `package.json` or `package-lock.json` files, be aware that Dependabot may create PR warnings about vulnerabilities in these fixtures. To prevent this, you can add a comment in the Dependabot PR:

```markdown
@dependabot ignore this dependency
```

See [this example PR](https://github.com/herodevs/cli/pull/182#issuecomment-2812762970) for reference.
