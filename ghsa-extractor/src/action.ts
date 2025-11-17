/**
 * GitHub Action entry point for extracting and recreating security advisories
 */

import { parseAdvisoryUrl } from "./advisory-parser.js";
import { GitHubClient } from "./github-client.js";
import { processAdvisory, buildOriginalAdvisoryUrl } from "./advisory-processor.js";

async function main() {
  // GitHub Actions inputs are available via environment variables
  // Inputs are prefixed with INPUT_ and converted to uppercase
  const advisoryUrl = process.env.INPUT_ADVISORY_URL;
  const targetRepo = process.env.INPUT_TARGET_REPO || "JLLeitschuh/security-research";
  const mode = process.env.INPUT_MODE || "recreate";
  const githubToken = process.env.GITHUB_TOKEN || process.env.INPUT_GITHUB_TOKEN;

  if (!advisoryUrl) {
    console.error("Error: advisory_url input is required");
    process.exit(1);
  }

  if (!githubToken) {
    console.error("Error: GITHUB_TOKEN secret is required");
    process.exit(1);
  }

  try {
    const parsed = parseAdvisoryUrl(advisoryUrl);
    console.log(`Fetching advisory ${parsed.ghsa_id} from ${parsed.owner}/${parsed.repo}...`);

    const client = new GitHubClient(githubToken);

    // Always fetch the advisory first
    let advisory = await client.fetchAdvisoryFromUrl(parsed);
    console.log(`Successfully fetched advisory: ${advisory.summary}`);

    // Process advisory to add Timeline section if needed
    const originalAdvisoryUrl = buildOriginalAdvisoryUrl(parsed);
    advisory = processAdvisory(advisory, originalAdvisoryUrl);

    // If mode is fetch, just output the advisory details
    if (mode === "fetch") {
      console.log("\n=== Advisory Details ===");
      console.log(`GHSA ID: ${advisory.ghsa_id}`);
      console.log(`Summary: ${advisory.summary}`);
      console.log(`Severity: ${advisory.severity}`);
      console.log(`URL: ${advisory.html_url}`);
      return;
    }

    // Mode is recreate - create the advisory in target repo
    if (mode === "recreate") {
      // Parse target repo
      const targetParts = targetRepo.split("/");
      if (targetParts.length !== 2) {
        throw new Error(`Invalid target_repo format: ${targetRepo}. Expected owner/repo`);
      }
      const [targetOwner, targetRepoName] = targetParts;

      // Convert to create request (advisory already processed with Timeline section)
      const createRequest = client.advisoryToCreateRequest(advisory);

      // Create in target repository
      console.log(`\nCreating advisory in ${targetOwner}/${targetRepoName}...`);
      const newAdvisory = await client.createAdvisory(targetOwner, targetRepoName, createRequest);

      console.log(`\n✓ Successfully created advisory ${newAdvisory.ghsa_id}`);
      console.log(`URL: ${newAdvisory.html_url}`);
      
      // Set output for GitHub Actions
      if (process.env.GITHUB_OUTPUT) {
        const fs = await import("fs/promises");
        const output = `ghsa_id=${newAdvisory.ghsa_id}\nurl=${newAdvisory.html_url}\n`;
        await fs.appendFile(process.env.GITHUB_OUTPUT, output);
      }
    } else {
      throw new Error(`Invalid mode: ${mode}. Expected 'fetch' or 'recreate'`);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

