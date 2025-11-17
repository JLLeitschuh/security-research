import { GitHubSecurityAdvisory, ParsedAdvisoryUrl } from "./types.js";

/**
 * Format a date string to human-readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Process an advisory description to add Timeline section if not present
 */
export function processAdvisoryDescription(
  advisory: GitHubSecurityAdvisory,
  originalAdvisoryUrl: string
): string {
  let description = advisory.description || "";

  // Check if Timeline section already exists
  const hasTimeline = /###\s+Timeline/i.test(description);

  if (!hasTimeline) {
    // Add Timeline section at the end
    const formattedDate = formatDate(advisory.created_at);
    const timelineEntry = `### Timeline

- [${formattedDate}]: Vulnerability originally reported: ${originalAdvisoryUrl}`;

    if (description.trim().length > 0) {
      // Append Timeline to existing description
      description = `${description}\n\n${timelineEntry}`;
    } else {
      // Description is empty, create Timeline section only
      description = timelineEntry;
    }
  }

  return description;
}

/**
 * Process advisory by adding Timeline section to description
 */
export function processAdvisory(
  advisory: GitHubSecurityAdvisory,
  originalAdvisoryUrl: string
): GitHubSecurityAdvisory {
  return {
    ...advisory,
    description: processAdvisoryDescription(advisory, originalAdvisoryUrl),
  };
}

/**
 * Build the original advisory URL from parsed URL
 */
export function buildOriginalAdvisoryUrl(parsed: ParsedAdvisoryUrl): string {
  return `https://github.com/${parsed.owner}/${parsed.repo}/security/advisories/${parsed.ghsa_id}`;
}

