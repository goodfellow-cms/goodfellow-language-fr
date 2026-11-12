// Checks the language pack as Goodfellow will when someone installs it, so a
// release never fails there: its goodfellow-language.json, and every string
// against the English of the Goodfellow release package-lock.json names, as the
// admin panel checks them when it uses them.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { goodfellowAdminTextSources, languageStatus, sourceKey, sourceState } from "@goodfellow-cms/admin/text";
import {
  isLanguagePackName,
  LANGUAGE_PACK_KEYWORD,
  LANGUAGE_PACK_MANIFEST,
  languagePackManifestSchema,
} from "@goodfellow-cms/core";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const pkg = JSON.parse(await read("package.json"));
const manifest = languagePackManifestSchema.parse(JSON.parse(await read(LANGUAGE_PACK_MANIFEST)));
const sources = goodfellowAdminTextSources();
const file = { ...manifest, version: 1 };
const keys = (state) => sources.filter((source) => sourceState(file, source) === state).map((source) => source.key);

test("is named and described as a language pack, for the Goodfellow releases it works with", () => {
  assert.ok(isLanguagePackName(pkg.name), `${pkg.name} isn't named goodfellow-language-<name>`);
  assert.ok(pkg.keywords.includes(LANGUAGE_PACK_KEYWORD));
  assert.ok(pkg.peerDependencies?.["@goodfellow-cms/core"], "needs a peerDependencies range on @goodfellow-cms/core");
  assert.ok(pkg.files.includes(LANGUAGE_PACK_MANIFEST), `package.json's files leaves out ${LANGUAGE_PACK_MANIFEST}`);
});

test("says every string the admin panel shows", () => {
  assert.deepEqual(keys("missing"), []);
});

test("has only strings the admin panel can use: the English's {placeholders}, not empty, not too long", () => {
  assert.deepEqual(keys("unusable"), []);
});

test("was made from today's English", () => {
  assert.deepEqual(keys("outdated"), []);
});

// Labels that releases in package.json's peer range still show, which later
// releases renamed. Labels are found by their English, so the newer releases
// never use these; take one out once the range no longer includes a release
// that shows it.
const OLDER_LABELS = [
  // 0.9 and 0.10, which 0.11 calls "A menu: light, dark, or like the visitor's computer".
  "A menu: light, dark or like the visitor's computer",
  // 0.9 and 0.10, which 0.11 calls "Item field".
  "Entry field",
  // 0.9 and 0.10, which 0.11 words with a comma before "or".
  "Giscus's, Disqus's or Garrul's code, for comments kept elsewhere than Site settings says (optional)",
  // 0.9 and 0.10, which 0.11 words with a comma before "and".
  "Yes: leave out scripts, styles and frames",
];

test("has nothing Goodfellow no longer says", () => {
  const known = new Set([
    ...sources.map((source) => source.key),
    ...OLDER_LABELS.map((label) => sourceKey("labels", label)),
  ]);
  const stale = ["strings", "puck", "labels"].flatMap((table) =>
    Object.keys(manifest[table])
      .filter((key) => !known.has(sourceKey(table, key)))
      .map((key) => sourceKey(table, key)),
  );
  assert.deepEqual(stale, []);
});

test("keeps older releases' labels only while 0.11's English says them differently", () => {
  const known = new Set(sources.map((source) => source.key));
  for (const label of OLDER_LABELS) {
    assert.ok(manifest.labels[label], `${label} has no French`);
    assert.ok(!known.has(sourceKey("labels", label)), `${label} is today's English, so it needn't be listed`);
  }
});

test("counts as complete on the Admin panel languages screen", () => {
  const status = languageStatus(file, sources);
  assert.equal(status.current, status.total);
});
