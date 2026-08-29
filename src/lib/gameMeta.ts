// Build metadata written by the extractor (tools/wiki/extract.ts).
// Generated file is gitignored; run `npm run wiki:extract` before dev/build.
import meta from "../data/generated/meta.json";

export interface GameMeta {
  gameCommit: string;
  gameCommitShort: string;
  gameCommitDate: string;
  repoUrl: string;
  builtAt: string;
  counts: Record<string, number>;
}

export const GAME = meta as GameMeta;

/** Link to a source file in the pinned game repo (optionally at a line). */
export function sourceUrl(file: string, line?: number): string {
  return `${GAME.repoUrl}/blob/${GAME.gameCommit}/${file}${line ? `#L${line}` : ""}`;
}
