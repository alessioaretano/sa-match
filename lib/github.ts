import { Octokit } from "@octokit/rest";

export type MandatFiles = {
  metaJson: string;
  descriptionMd: string;
  originalPdf?: Buffer;
  originalDocx?: Buffer;
};

export type CommitMandatInput = {
  slug: string;
  files: MandatFiles;
  authorEmail: string;
};

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`ENV ${name} ist nicht gesetzt.`);
  return v;
}

function getOctokit(): Octokit {
  return new Octokit({ auth: readEnv("GITHUB_TOKEN") });
}

async function putFile(opts: {
  octokit: Octokit;
  owner: string;
  repo: string;
  branch: string;
  path: string;
  contentBase64: string;
  message: string;
}) {
  const { octokit, owner, repo, branch, path, contentBase64, message } = opts;
  // Falls Datei existiert: SHA holen für Update.
  let sha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({ owner, repo, path, ref: branch });
    if (!Array.isArray(existing.data) && "sha" in existing.data) sha = existing.data.sha;
  } catch (err) {
    // 404 = neue Datei, OK.
    const e = err as { status?: number };
    if (e.status !== 404) throw err;
  }
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    branch,
    path,
    message,
    content: contentBase64,
    sha,
  });
}

export async function commitMandat({ slug, files, authorEmail }: CommitMandatInput): Promise<{ commitUrl: string }> {
  const owner = readEnv("GITHUB_REPO_OWNER");
  const repo = readEnv("GITHUB_REPO_NAME");
  const branch = process.env.GITHUB_REPO_BRANCH ?? "main";
  const octokit = getOctokit();

  const baseMessage = `mandate: add ${slug} (by ${authorEmail})`;

  await putFile({
    octokit,
    owner,
    repo,
    branch,
    path: `mandates/${slug}/meta.json`,
    contentBase64: Buffer.from(files.metaJson, "utf-8").toString("base64"),
    message: baseMessage,
  });

  await putFile({
    octokit,
    owner,
    repo,
    branch,
    path: `mandates/${slug}/description.md`,
    contentBase64: Buffer.from(files.descriptionMd, "utf-8").toString("base64"),
    message: baseMessage,
  });

  if (files.originalPdf) {
    await putFile({
      octokit,
      owner,
      repo,
      branch,
      path: `mandates/${slug}/original.pdf`,
      contentBase64: files.originalPdf.toString("base64"),
      message: baseMessage,
    });
  }
  if (files.originalDocx) {
    await putFile({
      octokit,
      owner,
      repo,
      branch,
      path: `mandates/${slug}/original.docx`,
      contentBase64: files.originalDocx.toString("base64"),
      message: baseMessage,
    });
  }

  return { commitUrl: `https://github.com/${owner}/${repo}/tree/${branch}/mandates/${slug}` };
}
