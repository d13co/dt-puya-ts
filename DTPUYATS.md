# dt-puya-ts: differences from puya-ts

`@d13co/dt-puya-ts` and `@d13co/dt-algorand-typescript` are [puya-ts](https://github.com/algorandfoundation/puya-ts) 1.3.1 and its Algorand TypeScript types, for [dt-algorand](https://github.com/d13co/dt-algorand/tree/dtalgorand), the time-travel fork of go-algorand. The compiler runs [dt-puya](https://github.com/d13co/dt-puya), the matching fork of the puya backend, which it downloads from dt-puya's releases. Everything else is upstream's: contracts that compile with puya-ts compile with dt-puya-ts to the same output.

Source and issues: [d13co/dt-puya-ts](https://github.com/d13co/dt-puya-ts) (branch `dtalgorand`).

- [Changes](#changes)
- [Installing](#installing)
- [Versions](#versions)
- [Releasing dt-puya-ts](#releasing-dt-puya-ts)

## Changes

| Area         | puya-ts                                                                  | dt-puya-ts                                                                                                             |
| ------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| puya backend | puya, from algorandfoundation/puya releases                              | dt-puya 5.10.1-dt.1.0.0, from [d13co/dt-puya releases](https://github.com/d13co/dt-puya/releases/tag/v5.10.1-dt.1.0.0) |
| npm packages | `@algorandfoundation/puya-ts`, `@algorandfoundation/algorand-typescript` | `@d13co/dt-puya-ts`, `@d13co/dt-algorand-typescript`, installed under the upstream names                               |

## Installing

See [Installing dt-puya-ts](README.md#installing-dt-puya-ts) in the README. The compiler downloads the dt-puya binary for your platform the first time it runs, and checks it against the release's SHA-256 checksum, as upstream does. To use a binary you have already, pass `--puya-path`.

## Versions

A release is `<puya-ts version>-dt.<x.y.z>`, such as `1.3.1-dt.1.0.0`, the same for both packages:

- the puya-ts version the code is built on; change it when merging a new upstream release;
- the fork's own release, `x.y.z`: bump `x` for a breaking change to what the fork adds, `y` for features and `z` for fixes. It never starts again: when the puya-ts version changes, it keeps counting from the last release, bumped as the change calls for.

Each release targets one dt-puya release (`targetedPuyaVersion` in `src/constants.ts`), which `puya-ts --version` prints.

## Releasing dt-puya-ts

GitHub Actions publishes both packages, with [`.github/workflows/dt-puya-ts.yml`](.github/workflows/dt-puya-ts.yml). On every push and pull request to `dtalgorand` it checks that the targeted dt-puya release is published, builds both packages (lint, type checks), checks the generated code, audits the production dependencies and runs the tests with LocalNet, on Node 22 and 24. On a `v<version>` tag it also checks the release, publishes both packages to npm with provenance, and creates a GitHub release with the tarballs. Upstream's workflows that release or publish docs (`release.yml`, `prod-release.yml`, `publish-devportal-docs.yml`) run only on algorandfoundation/puya-ts.

1. If dt-puya has a new release to target, set `targetedPuyaVersion` in `src/constants.ts` to it. It must be published first: the tests download it.
2. Choose the version (see [Versions](#versions)), and set it in both packages: `npm version <version> --no-git-tag-version` at the root and in `packages/algo-ts`, then `npm install` at the root, which records the linked `packages/algo-ts/dist` in `package-lock.json` (run `npm run algo-ts` first if `dist` is stale).
3. `node scripts/ci/dt-release.mjs update`: it sets the versions in the install snippets and the dt-puya version in `README.md` and in this file.
4. `npm test`, then `npm run build` and `npm pack --dry-run ./dist` to check the contents.
5. Commit and push `dtalgorand`, then tag the commit and push the tag: `git tag v<version>` and `git push d13co v<version>`.
6. The workflow checks that the tag is on `dtalgorand` and matches the versions in both `package.json` and `package-lock.json` files, and that the docs name that version and the targeted dt-puya (`node scripts/ci/dt-release.mjs check v<version>` runs the same check locally). In `dist/package.json`, it points the `@algorandfoundation/algorand-typescript` dependency at `npm:@d13co/dt-algorand-typescript@<version>`. After the tests, the `publish` job waits for approval, then publishes `@d13co/dt-algorand-typescript` and then `@d13co/dt-puya-ts` with `npm publish --tag latest`: npm 11 publishes a prerelease only with an explicit tag, and `latest` makes it the version `npm install` gets. A version already on npm is not published again.

### One-time setup

- **Default branch.** Set it to `dtalgorand` (Settings → General). The guards that keep upstream's workflows off the fork exist only on this branch, and the repository page then shows this branch's README.
- **First versions, by hand.** The workflow publishes only through npm trusted publishing, which is set up on a package that already exists. Publish the first version of each package from a checkout: steps 1 to 4, then `npm publish ./packages/algo-ts/dist --tag latest --access public`; set the dependency in `dist/package.json` as the workflow does (`cd dist && npm pkg set "dependencies.@algorandfoundation/algorand-typescript=npm:@d13co/dt-algorand-typescript@<version>"`), then `npm publish ./dist --tag latest --access public`. Then push the tag (step 5). The workflow sees that the versions are on npm, skips publishing, and creates the GitHub release.
- **Trusted publishers.** Right after the first publish, add one to each package for the workflow, either in the package's settings on npmjs.com (Trusted publishing → GitHub Actions: owner `d13co`, repository `dt-puya-ts`, workflow `dt-puya-ts.yml`, environment `npm`, publishing allowed) or with npm 11.5.1 or later: `npm trust github @d13co/dt-puya-ts --file dt-puya-ts.yml --repo d13co/dt-puya-ts --env npm --allow-publish`, and the same for `@d13co/dt-algorand-typescript`. npm drops a new trusted publisher if nothing is published with it within 2 days, so set them up when the next release is close, or add them again later.
- **Environment.** The `publish` job runs in the GitHub environment `npm`: give it required reviewers to approve each release, and a deployment policy that admits only `v*-dt.*` tags.
