# dt-puya-ts

> `@d13co/dt-puya-ts` and `@d13co/dt-algorand-typescript` are a fork of [puya-ts](https://github.com/algorandfoundation/puya-ts) 1.3.1, the Algorand TypeScript compiler, and its types, for [dt-algorand](https://github.com/d13co/dt-algorand/tree/dtalgorand), the time-travel fork of go-algorand, with its time-travel ops. The compiler runs [dt-puya](https://github.com/d13co/dt-puya), the matching fork of the puya backend. Everything else is upstream's. The upstream README follows below.

## dt-puya-ts: the main changes

- **Time-travel ops**: `op.TimeTravel` has dt-algorand's `tt_seek`, which moves a program's reads to a past round, and the `tt_*_change` lookups, which find when an account, holding, local state, asset, app, box, state key or box name prefix changed. Programs run them through dt-algorand's `POST /v2/query`.
- **dt-puya**: the compiler downloads the backend from [dt-puya 5.10.1-dt.1.0.0](https://github.com/d13co/dt-puya/releases/tag/v5.10.1-dt.1.0.0) in place of algorandfoundation/puya.

See **[DTPUYATS.md](https://github.com/d13co/dt-puya-ts/blob/dtalgorand/DTPUYATS.md)** for the details, the versions and the release steps. Source and issues: [d13co/dt-puya-ts](https://github.com/d13co/dt-puya-ts) (branch `dtalgorand`).

## Installing dt-puya-ts

Install both packages under their upstream names and override them across your whole dependency tree, so that your contracts' imports, the compiler and other packages (e.g. `@algorandfoundation/algorand-typescript-testing`) all load the same copy. Imports stay `@algorandfoundation/algorand-typescript`, and the CLI stays `puya-ts`.

npm (`package.json`; each override must equal the dependency spec):

```json
{
  "dependencies": {
    "@algorandfoundation/algorand-typescript": "npm:@d13co/dt-algorand-typescript@1.3.1-dt.1.0.0"
  },
  "devDependencies": {
    "@algorandfoundation/puya-ts": "npm:@d13co/dt-puya-ts@1.3.1-dt.1.0.0"
  },
  "overrides": {
    "@algorandfoundation/algorand-typescript": "npm:@d13co/dt-algorand-typescript@1.3.1-dt.1.0.0",
    "@algorandfoundation/puya-ts": "npm:@d13co/dt-puya-ts@1.3.1-dt.1.0.0"
  }
}
```

pnpm (`pnpm-workspace.yaml`, or `pnpm.overrides` in `package.json`), with the same dependencies as above:

```yaml
overrides:
  '@algorandfoundation/algorand-typescript': npm:@d13co/dt-algorand-typescript@1.3.1-dt.1.0.0
  '@algorandfoundation/puya-ts': npm:@d13co/dt-puya-ts@1.3.1-dt.1.0.0
```

yarn: the same entries under `resolutions` in `package.json` (yarn ignores `overrides`). bun: the same entries under `overrides`.

Fork versions are prereleases (`-dt.…`), which `^` ranges don't match, so pin the exact versions as above. Then check that only the forks are installed: `npm ls @algorandfoundation/algorand-typescript @algorandfoundation/puya-ts`, and `npx puya-ts --version`, which names the dt-puya version it targets.

---

# Algorand TypeScript

Algorand TypeScript is a partial implementation of the TypeScript programming language that runs on the Algorand Virtual Machine (AVM). It includes a statically typed framework for development of Algorand smart contracts and logic signatures, with TypeScript interfaces to underlying AVM functionality that works with standard TypeScript tooling.

It maintains the syntax and semantics of TypeScript such that a developer who knows TypeScript can make safe assumptions
about the behaviour of the compiled code when running on the AVM. Algorand TypeScript is also executable TypeScript that can be run
and debugged on a Node.js virtual machine with transpilation to EcmaScript and run from automated tests.

Algorand TypeScript is compiled for execution on the AVM by PuyaTs, a TypeScript frontend for the [Puya](https://github.com/algorandfoundation/puya) optimising compiler that ensures the resulting AVM bytecode execution semantics that match the given TypeScript code. PuyaTs produces output that is directly compatible with AlgoKit typed clients to make deployment and calling easy.

## Documentation

- [Language Guide](https://algorandfoundation.github.io/puya-ts/language-guide/)
- [API Reference](https://algorandfoundation.github.io/puya-ts/api/)
- [CLI Guide](https://algorandfoundation.github.io/puya-ts/cli/)
- [Migration Guides](https://algorandfoundation.github.io/puya-ts/migration-guides/)
- [Release Notes](https://github.com/algorandfoundation/puya-ts/releases)
- [Contribution Guide](CONTRIBUTING.md)

For developing the documentation site locally, see the [docs README](docs/README.md).
