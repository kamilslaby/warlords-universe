import { execSync } from "node:child_process";

let lastCommit: Date | null | undefined;

export function getLastCommitDate(): Date {
  if (lastCommit === undefined) {
    try {
      const out = execSync("git log -1 --format=%cI", {
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim();
      const date = new Date(out);
      lastCommit = isNaN(date.getTime()) ? null : date;
    } catch {
      lastCommit = null; // no git available
    }
  }
  return lastCommit ?? new Date(); // fall back to the build date
}