# Français, a Goodfellow language pack

[Goodfellow](https://github.com/goodfellow-cms/goodfellow-cms)'s admin panel in French: every string of the admin panel, the editor's controls and the labels of Goodfellow's own blocks.

Install it from your site's admin panel: **Site Settings → Admin panel languages → Language packs**, search for French, look at how much of the admin panel it says, then **Install and publish**. Editors then choose Français from the language menu at the top. You can change any of its words afterwards with **Edit**, and updates to the pack keep what you changed. Language packs never update by themselves: when a new version is out, **Show** beside the installed pack offers it.

It's also the example to copy if you're making a language pack of your own, and the rest of this page goes through how it's made.

## Who has read it

Every string was translated by machine, following Goodfellow's glossary, and checked by its tests, but no French speaker has read it all yet, so none is marked `reviewed`. If you speak French, corrections are welcome: open an issue or a pull request, and mark the strings you've read with `"reviewed": true`. `npm run status` counts them.

## What's in it

A language pack is an npm package with no code: the admin panel's words in one language, which Goodfellow copies into a site's `content/admin-text/<code>.json` when an owner installs it. Its package has these files:

| File | What it is |
|---|---|
| [`package.json`](package.json) | Its name, version, and the Goodfellow releases it works with |
| [`goodfellow-language.json`](goodfellow-language.json) | The language, and its words |
| [`test/language.test.mjs`](test/language.test.mjs) | Checks it as Goodfellow will when someone installs it |
| [`scripts/status.mjs`](scripts/status.mjs) | Lists what's missing or out of date, to translate next |

### package.json

- **`name`** is `goodfellow-language-<name>`, or `@you/goodfellow-language-<name>`. The Admin panel languages screen lists only packages named this way.
- **`keywords`** include `goodfellow-language`, which is how the screen finds language packs on npm.
- **`peerDependencies`** names the Goodfellow releases the pack works with, as a range on `@goodfellow-cms/core`, such as `>=0.9.0 <1.0.0`. A version is offered only to sites on a release in that range, and a version without one is never offered. Strings a new release adds show in English until the pack has them, so widen the range once you've translated them.
- **`files`** lists `goodfellow-language.json`, since only the files listed are published.
- **`repository`** is where it's built from, which npm checks when it's published with provenance.

### goodfellow-language.json

A site's admin text file, with the language's `code`:

```json
{
  "version": 1,
  "code": "fr",
  "name": "Français",
  "description": "Le panneau d'administration de Goodfellow en français.",
  "strings": {
    "nav.pages": { "text": "Pages", "source": "7decab7f" }
  },
  "puck": {
    "header-publish": { "text": "Publier", "source": "6c6229a8" }
  },
  "labels": {
    "Heading": { "text": "Titre" }
  }
}
```

- **`code`** names the site's file, `content/admin-text/fr.json`, so a site has one pack for each language. Use the language's code, with a region where the words differ, such as `pt-BR`.
- **`name`** is the language's name in itself, as the language menu shows it.
- **`strings`** are the admin panel's own words, by the keys in Goodfellow's `packages/admin/src/strings.tsx`; **`puck`** is the editor's controls, by Puck's dictionary's keys; **`labels`** are blocks' names, settings and choices, by their English wording.
- **`source`** is a hash of the English the text was made from (`englishHash()` from `@goodfellow-cms/core`), so text whose English has changed in a later release is found again. Labels are keyed by their English, so they need none.
- **`reviewed`** marks text someone who speaks the language has read.
- **Keep every `{placeholder}`** as the English has it, such as `{title}`: the admin panel fills them in, and shows the English for any string whose placeholders differ, or that's empty.

The quickest start for a language of your own is a site's own file: on the Admin panel languages screen, **Add a language** translates it with the site's AI service, and **Edit** goes through it string by string. Copy `content/admin-text/<code>.json` into a package like this one and add `code`.

## Checking it

```sh
npm ci
npm test
npm run status
```

`package-lock.json` names the Goodfellow release the test checks against, so every run checks the same one; Dependabot moves it on to newer ones in `devDependencies`' ranges, and `npm update` does the same by hand. `package.json`'s `overrides` give Puck, which Goodfellow's admin panel is built on, happy-dom 21.0.4 in place of the 20 it asks for, which fixes its security advisories, as Goodfellow's own sites have.

The test reads the pack with Goodfellow's own code and the admin panel's English (`@goodfellow-cms/admin/text`), and checks that `goodfellow-language.json` is valid, that it says every string the admin panel shows, that each is one the admin panel can use, that none was made from English that has changed since, and that it has nothing Goodfellow no longer says. When Dependabot brings a new Goodfellow release, the test lists what it added or changed, and `npm run status` shows each with its English, to translate. GitHub Actions runs it on every change ([`check.yml`](.github/workflows/check.yml)).

## Publishing a version

Every change that reaches the published pack needs a changeset: run `npx changeset`, choose patch, minor or major, and describe the change for the pack's users. It writes a file in `.changeset/`, which goes in the same pull request.

1. Run `npm run release:version`, which turns the changesets into a new `version` in `package.json` and an entry in `CHANGELOG.md`. Commit what it changes. Every release needs a new version: npm never lets one be published twice.
2. Once that's on `main`, tag it with `v` and the version, and push the tag, which starts [`publish.yml`](.github/workflows/publish.yml):

   ```sh
   git switch main && git pull
   git tag v0.1.1 && git push origin v0.1.1
   ```

   The workflow stops unless the tag matches `package.json`'s version and is on `main`.
3. [`publish.yml`](.github/workflows/publish.yml) checks the pack again and stages it on npm with [provenance](https://docs.npmjs.com/generating-provenance-statements), which the Admin panel languages screen shows owners: which repository and commit it was built from. A staged version isn't published: nobody can install it until a maintainer approves it. The run's page lists the digest of the file it staged.
4. Approve it from your computer, with npm 11.15 or later, signed in to npm (`npm login`): `npm stage list goodfellow-language-fr` lists what's waiting, with each one's id and digest. Compare the digest with the run's, then run `npm stage approve <id>`, which asks for your two-factor code and publishes it.

The workflow signs in to npm with [trusted publishing](https://docs.npmjs.com/trusted-publishers), so the repository holds no npm token, and it may only stage versions. Set it up once, with npm 11.15 or later, shortly before a release, since npm drops a trusted publisher that hasn't staged anything within 2 days:

```sh
npm trust github goodfellow-language-fr --file publish.yml --repo goodfellow-cms/goodfellow-language-fr --allow-stage-publish --yes
```

Then choose **Require two-factor authentication and disallow tokens** under the package's **Settings → Publishing access**, and keep pushing `v` tags to maintainers with a tag ruleset, as [Harbor's README](https://github.com/goodfellow-cms/goodfellow-theme-harbor#publishing-a-version) describes. A new package's first version has to be published from a computer (`npm publish --access public`), since trusted publishing is set up in a package's settings.

The Admin panel languages screen offers a version once it's 3 days old, since most harmful versions of npm packages are found and removed by then.

## Making it easy to find

Call your pack's repository `goodfellow-language-<name>` too, and give it the `goodfellow-language` topic: on GitHub, the gear beside **About** on the repository's page; on GitLab, **Settings → General → Topics**.

## License

[MIT](LICENSE)
