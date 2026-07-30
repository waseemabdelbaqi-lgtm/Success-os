import { firstEnv, httpJson, ProviderNotConfiguredError } from "./base.js";

export function githubConfigured() {
  return Boolean(firstEnv(["GITHUB_TOKEN", "GH_TOKEN"]));
}

export async function githubRequest(pathname, { method = "GET", body } = {}) {
  const cred = firstEnv(["GITHUB_TOKEN", "GH_TOKEN"]);
  if (!cred) throw new ProviderNotConfiguredError("github");
  return httpJson(`https://api.github.com${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${cred.value}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "success-os-master-orchestrator",
      "Content-Type": "application/json",
    },
    body,
  });
}

export async function githubRepoStatus() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) return { provider: "github", configured: true, detail: "token present, GITHUB_REPOSITORY unset" };
  const data = await githubRequest(`/repos/${repo}`);
  return {
    provider: "github",
    configured: true,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    private: data.private,
  };
}
