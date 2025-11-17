#!/usr/bin/env node

import { Command } from "commander";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import * as readline from "readline/promises";
import { parseAdvisoryUrl } from "./advisory-parser.js";
import { GitHubClient } from "./github-client.js";
import { processAdvisory, buildOriginalAdvisoryUrl } from "./advisory-processor.js";

// Configure marked to use the TerminalRenderer
marked.setOptions({
  renderer: new TerminalRenderer(),
});

const program = new Command();

program
  .name("ghsa-extractor")
  .description("Extract and recreate GitHub Security Advisories")
  .version("1.0.0");

program
  .command("fetch")
  .description("Fetch and pretty-print a GitHub Security Advisory")
  .argument("<advisory-url>", "URL of the GitHub Security Advisory")
  .action(async (advisoryUrl: string) => {
    try {
      const token = process.env.GHSA_GITHUB_TOKEN;
      if (!token) {
        console.error("Error: GHSA_GITHUB_TOKEN environment variable is not set");
        process.exit(1);
      }

      const parsed = parseAdvisoryUrl(advisoryUrl);
      console.log(`Fetching advisory ${parsed.ghsa_id} from ${parsed.owner}/${parsed.repo}...\n`);

      const client = new GitHubClient(token);
      let advisory = await client.fetchAdvisoryFromUrl(parsed);

      // Process advisory to add Timeline section if needed
      const originalAdvisoryUrl = buildOriginalAdvisoryUrl(parsed);
      advisory = processAdvisory(advisory, originalAdvisoryUrl);

      // Pretty print the advisory
      console.log("=".repeat(80));
      console.log(`GHSA ID: ${advisory.ghsa_id}`);
      if (advisory.cve_id) {
        console.log(`CVE ID: ${advisory.cve_id}`);
      }
      console.log(`State: ${advisory.state}`);
      console.log(`Severity: ${(advisory.severity || "unknown").toUpperCase()}`);
      console.log(`\nSummary:\n${advisory.summary}`);
      console.log(`\nDescription:\n${advisory.description ? marked(advisory.description) : "(no description)"}`);
      
      // Display CVSS information - check all possible sources
      let cvssDisplayed = false;
      if (advisory.cvss?.vector_string || advisory.cvss?.score) {
        console.log(`\nCVSS:`);
        if (advisory.cvss.vector_string) {
          console.log(`  Vector: ${advisory.cvss.vector_string}`);
        }
        if (advisory.cvss.score !== null && advisory.cvss.score !== undefined) {
          console.log(`  Score: ${advisory.cvss.score}`);
        }
        cvssDisplayed = true;
      }
      
      if (advisory.cvss_severities?.cvss_v3?.vector_string || advisory.cvss_severities?.cvss_v3?.score) {
        if (!cvssDisplayed) {
          console.log(`\nCVSS:`);
        }
        console.log(`  CVSS v3:`);
        if (advisory.cvss_severities.cvss_v3.vector_string) {
          console.log(`    Vector: ${advisory.cvss_severities.cvss_v3.vector_string}`);
        }
        if (advisory.cvss_severities.cvss_v3.score !== null && advisory.cvss_severities.cvss_v3.score !== undefined) {
          console.log(`    Score: ${advisory.cvss_severities.cvss_v3.score}`);
        }
        cvssDisplayed = true;
      }
      
      if (advisory.cvss_severities?.cvss_v4?.vector_string || advisory.cvss_severities?.cvss_v4?.score) {
        if (!cvssDisplayed) {
          console.log(`\nCVSS:`);
        }
        console.log(`  CVSS v4:`);
        if (advisory.cvss_severities.cvss_v4.vector_string) {
          console.log(`    Vector: ${advisory.cvss_severities.cvss_v4.vector_string}`);
        }
        if (advisory.cvss_severities.cvss_v4.score !== null && advisory.cvss_severities.cvss_v4.score !== undefined) {
          console.log(`    Score: ${advisory.cvss_severities.cvss_v4.score}`);
        }
        cvssDisplayed = true;
      }

      if (advisory.cwes && advisory.cwes.length > 0) {
        console.log("\nCWEs:");
        advisory.cwes.forEach(cwe => {
          console.log(`  - ${cwe.cwe_id}: ${cwe.name}`);
        });
      }

      if (advisory.vulnerabilities && advisory.vulnerabilities.length > 0) {
        console.log("\nVulnerabilities:");
        advisory.vulnerabilities.forEach((vuln, index) => {
          console.log(`  ${index + 1}. ${vuln.package.ecosystem}/${vuln.package.name}`);
          console.log(`     Severity: ${vuln.severity}`);
          console.log(`     Vulnerable Range: ${vuln.vulnerable_version_range}`);
          if (vuln.patched_versions) {
            console.log(`     Patched Versions: ${vuln.patched_versions}`);
          } else if (vuln.first_patched_version) {
            console.log(`     First Patched Version: ${vuln.first_patched_version}`);
          }
        });
      }

      console.log(`\nCreated: ${advisory.created_at}`);
      console.log(`Updated: ${advisory.updated_at}`);
      if (advisory.published_at) {
        console.log(`Published: ${advisory.published_at}`);
      }
      console.log(`\nURL: ${advisory.html_url}`);
      console.log("=".repeat(80));
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command("recreate")
  .description("Fetch an advisory and recreate it in a target repository")
  .argument("<advisory-url>", "URL of the GitHub Security Advisory to fetch")
  .option(
    "--target-repo <owner/repo>",
    "Target repository to create the advisory in (default: JLLeitschuh/security-research)",
    "JLLeitschuh/security-research"
  )
  .action(async (advisoryUrl: string, options: { targetRepo: string }) => {
    try {
      const token = process.env.GHSA_GITHUB_TOKEN;
      if (!token) {
        console.error("Error: GHSA_GITHUB_TOKEN environment variable is not set");
        process.exit(1);
      }

      // Parse target repo
      const targetParts = options.targetRepo.split("/");
      if (targetParts.length !== 2) {
        console.error("Error: target-repo must be in format owner/repo");
        process.exit(1);
      }
      const [targetOwner, targetRepo] = targetParts;

      // Parse source advisory URL
      const parsed = parseAdvisoryUrl(advisoryUrl);
      console.log(`Fetching advisory ${parsed.ghsa_id} from ${parsed.owner}/${parsed.repo}...`);

      const client = new GitHubClient(token);

      // Fetch the advisory
      let advisory = await client.fetchAdvisoryFromUrl(parsed);
      console.log(`Successfully fetched advisory: ${advisory.summary}`);

      // Process advisory to add Timeline section if needed
      const originalAdvisoryUrl = buildOriginalAdvisoryUrl(parsed);
      advisory = processAdvisory(advisory, originalAdvisoryUrl);

      // Convert to create request (will use processed description)
      const createRequest = client.advisoryToCreateRequest(advisory);

      // Create in target repository
      console.log(`\nCreating advisory in ${targetOwner}/${targetRepo}...`);
      const newAdvisory = await client.createAdvisory(targetOwner, targetRepo, createRequest);

      console.log(`\n✓ Successfully created advisory ${newAdvisory.ghsa_id}`);
      console.log(`URL: ${newAdvisory.html_url}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Prompt user for confirmation
 */
async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(`${message} (yes/no): `);
    const normalized = answer.trim().toLowerCase();
    return normalized === "yes" || normalized === "y";
  } finally {
    rl.close();
  }
}

program
  .command("overwrite")
  .description("Fetch an advisory and overwrite an existing advisory with its data")
  .argument("<source-advisory-url>", "URL of the source GitHub Security Advisory to fetch")
  .argument("<target-advisory-url>", "URL of the target GitHub Security Advisory to overwrite")
  .action(async (sourceAdvisoryUrl: string, targetAdvisoryUrl: string) => {
    try {
      const token = process.env.GHSA_GITHUB_TOKEN;
      if (!token) {
        console.error("Error: GHSA_GITHUB_TOKEN environment variable is not set");
        process.exit(1);
      }

      // Parse source and target advisory URLs
      const sourceParsed = parseAdvisoryUrl(sourceAdvisoryUrl);
      const targetParsed = parseAdvisoryUrl(targetAdvisoryUrl);

      console.log(`Fetching source advisory ${sourceParsed.ghsa_id} from ${sourceParsed.owner}/${sourceParsed.repo}...`);

      const client = new GitHubClient(token);

      // Fetch source advisory
      let sourceAdvisory = await client.fetchAdvisoryFromUrl(sourceParsed);
      console.log(`Successfully fetched source advisory: ${sourceAdvisory.summary}`);

      // Process source advisory to add Timeline section if needed
      const originalAdvisoryUrl = buildOriginalAdvisoryUrl(sourceParsed);
      sourceAdvisory = processAdvisory(sourceAdvisory, originalAdvisoryUrl);

      // Fetch target advisory to check repository and summary
      console.log(`\nFetching target advisory ${targetParsed.ghsa_id} from ${targetParsed.owner}/${targetParsed.repo}...`);
      const targetAdvisory = await client.fetchAdvisoryFromUrl(targetParsed);
      console.log(`Target advisory summary: ${targetAdvisory.summary}`);

      // Safeguard 1: Check if target is in JLLeitschuh/security-research
      const expectedOwner = "JLLeitschuh";
      const expectedRepo = "security-research";
      
      if (targetParsed.owner !== expectedOwner || targetParsed.repo !== expectedRepo) {
        const proceed = await promptConfirmation(
          `\n⚠️  WARNING: Target advisory is in ${targetParsed.owner}/${targetParsed.repo}, not ${expectedOwner}/${expectedRepo}.\n   Do you want to proceed with overwriting this advisory?`
        );
        if (!proceed) {
          console.log("Operation cancelled.");
          process.exit(0);
        }
      }

      // Safeguard 2: Check if target advisory is already published
      if (targetAdvisory.state === "published") {
        const proceed = await promptConfirmation(
          `\n⚠️  WARNING: Target advisory ${targetParsed.ghsa_id} is already published (state: ${targetAdvisory.state}).\n   Overwriting a published advisory may affect users who depend on it.\n   Do you want to proceed with overwriting this published advisory?`
        );
        if (!proceed) {
          console.log("Operation cancelled.");
          process.exit(0);
        }
      }

      // Safeguard 3: Check if summaries match
      if (sourceAdvisory.summary !== targetAdvisory.summary) {
        console.log(`\n⚠️  WARNING: Summaries do not match!`);
        console.log(`   Source: ${sourceAdvisory.summary}`);
        console.log(`   Target: ${targetAdvisory.summary}`);
        const proceed = await promptConfirmation(
          `\n   Do you want to proceed with overwriting the target advisory?`
        );
        if (!proceed) {
          console.log("Operation cancelled.");
          process.exit(0);
        }
      }

      // Convert source advisory to create request format (which can also be used for update)
      const updateRequest = client.advisoryToCreateRequest(sourceAdvisory);

      // Update the target advisory
      console.log(`\nOverwriting advisory ${targetParsed.ghsa_id} in ${targetParsed.owner}/${targetParsed.repo}...`);
      const updatedAdvisory = await client.updateAdvisory(
        targetParsed.owner,
        targetParsed.repo,
        targetParsed.ghsa_id,
        updateRequest
      );

      console.log(`\n✓ Successfully updated advisory ${updatedAdvisory.ghsa_id}`);
      console.log(`URL: ${updatedAdvisory.html_url}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();

