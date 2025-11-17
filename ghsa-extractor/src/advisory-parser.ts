import { ParsedAdvisoryUrl } from "./types.js";

/**
 * Parse a GitHub Security Advisory URL to extract owner, repo, and GHSA ID
 * 
 * Example: https://github.com/microsoft/playwright-mcp/security/advisories/GHSA-r44f-mw4f-2mvw
 * Returns: { owner: "microsoft", repo: "playwright-mcp", ghsa_id: "GHSA-r44f-mw4f-2mvw" }
 */
export function parseAdvisoryUrl(url: string): ParsedAdvisoryUrl {
  try {
    const urlObj = new URL(url);
    
    // Parse path like: /microsoft/playwright-mcp/security/advisories/GHSA-r44f-mw4f-2mvw
    const pathParts = urlObj.pathname.split("/").filter(part => part.length > 0);
    
    if (pathParts.length < 5) {
      throw new Error(`Invalid advisory URL format: ${url}`);
    }
    
    // Path should be: [owner, repo, "security", "advisories", ghsa_id]
    if (pathParts[2] !== "security" || pathParts[3] !== "advisories") {
      throw new Error(`Invalid advisory URL format: expected "security/advisories" in path`);
    }
    
    const owner = pathParts[0];
    const repo = pathParts[1];
    const ghsa_id = pathParts[4];
    
    if (!ghsa_id.startsWith("GHSA-")) {
      throw new Error(`Invalid GHSA ID format: ${ghsa_id}`);
    }
    
    return {
      owner,
      repo,
      ghsa_id
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse advisory URL "${url}": ${error.message}`);
    }
    throw error;
  }
}

