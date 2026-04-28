import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SKILL_DIR = path.join(process.cwd(), "skill");

export type SkillContext = {
  systemMd: string;
  scoringMd: string;
  templateHtml: string;
  version: string;
};

let cached: SkillContext | null = null;

export async function loadSkillContext(): Promise<SkillContext> {
  if (cached) return cached;

  const [systemMd, scoringMd, templateHtml] = await Promise.all([
    fs.readFile(path.join(SKILL_DIR, "SKILL.md"), "utf-8"),
    fs.readFile(path.join(SKILL_DIR, "references", "scoring-logic.md"), "utf-8"),
    fs.readFile(path.join(SKILL_DIR, "assets", "template.html"), "utf-8"),
  ]);

  const version = crypto
    .createHash("sha256")
    .update(systemMd + scoringMd + templateHtml)
    .digest("hex")
    .slice(0, 12);

  cached = { systemMd, scoringMd, templateHtml, version };
  return cached;
}
