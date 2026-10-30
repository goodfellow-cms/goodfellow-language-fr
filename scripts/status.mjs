// What the pack says, against the English of the Goodfellow release
// package-lock.json names: how many strings are current, and each that's
// missing, out of date or can't be used, with its English, to translate next.
import { readFile } from "node:fs/promises";
import { goodfellowAdminTextSources, languageStatus, sourceState } from "@goodfellow-cms/admin/text";
import { LANGUAGE_PACK_MANIFEST } from "@goodfellow-cms/core";

const manifest = JSON.parse(await readFile(new URL(`../${LANGUAGE_PACK_MANIFEST}`, import.meta.url), "utf8"));
const sources = goodfellowAdminTextSources();
const status = languageStatus(manifest, sources);
console.log(
  `${status.current} of ${status.total} strings are current, ${status.reviewed} of them read by someone who speaks the language.`,
);
for (const state of ["missing", "outdated", "unusable"]) {
  const found = sources.filter((source) => sourceState(manifest, source) === state);
  if (found.length === 0) continue;
  console.log(`\n${found.length} ${state}:`);
  for (const source of found) console.log(`  ${source.key}\t${source.english.replace(/\n/g, "\\n")}`);
}
