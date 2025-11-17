import { Octokit } from "@octokit/rest";
import { GitHubSecurityAdvisory, CreateAdvisoryRequest, ParsedAdvisoryUrl } from "./types.js";

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    if (!token) {
      throw new Error("GitHub token is required");
    }
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Fetch a security advisory from a repository
   */
  async fetchAdvisory(owner: string, repo: string, ghsa_id: string): Promise<GitHubSecurityAdvisory> {
    try {
      const response = await this.octokit.rest.securityAdvisories.getRepositoryAdvisory({
        owner,
        repo,
        ghsa_id,
      });

      // Convert the API response to our type, handling type mismatches
      return {
        ...response.data,
        description: response.data.description ?? null,
        severity: response.data.severity as "critical" | "high" | "medium" | "low" | "moderate" | null,
        identifiers: [...response.data.identifiers],
      } as unknown as GitHubSecurityAdvisory;
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Advisory ${ghsa_id} not found in ${owner}/${repo}`);
      }
      throw new Error(`Failed to fetch advisory: ${error.message}`);
    }
  }

  /**
   * Create a new security advisory in a repository
   */
  async createAdvisory(
    owner: string,
    repo: string,
    advisory: CreateAdvisoryRequest
  ): Promise<GitHubSecurityAdvisory> {
    try {
      // Map vulnerabilities - note: severity is NOT a valid field for vulnerabilities in create request
      // Severity is set at the advisory level, not per vulnerability
      const apiVulnerabilities = advisory.vulnerabilities.map(vuln => ({
        package: vuln.package,
        vulnerable_version_range: vuln.vulnerable_version_range,
        patched_versions: vuln.patched_versions || undefined,
      }));

      // Build the request body - GitHub API doesn't allow both severity and cvss_vector_string
      // Prefer cvss_vector_string if present, otherwise use severity
      const requestBody: any = {
        owner,
        repo,
        summary: advisory.summary,
        description: advisory.description,
        cwe_ids: advisory.cwe_ids || [],
        vulnerabilities: apiVulnerabilities as any,
      };

      if (advisory.cvss_vector_string) {
        // If CVSS vector string is present, use it (GitHub will derive severity from CVSS)
        requestBody.cvss_vector_string = advisory.cvss_vector_string;
      } else {
        // Otherwise, use the severity field directly
        // Map severity: "moderate" -> "medium" for API compatibility
        const apiSeverity = advisory.severity === "moderate" ? "medium" : advisory.severity;
        requestBody.severity = apiSeverity as "critical" | "high" | "medium" | "low";
      }

      const response = await this.octokit.rest.securityAdvisories.createRepositoryAdvisory(requestBody);

      // Convert the API response to our type
      return {
        ...response.data,
        description: response.data.description ?? null,
        severity: (response.data.severity === "medium" ? "moderate" : response.data.severity) as "critical" | "high" | "medium" | "low" | "moderate" | null,
        identifiers: [...response.data.identifiers],
      } as unknown as GitHubSecurityAdvisory;
    } catch (error: any) {
      throw new Error(`Failed to create advisory: ${error.message}`);
    }
  }

  /**
   * Fetch an advisory from a parsed URL
   */
  async fetchAdvisoryFromUrl(parsed: ParsedAdvisoryUrl): Promise<GitHubSecurityAdvisory> {
    return this.fetchAdvisory(parsed.owner, parsed.repo, parsed.ghsa_id);
  }

  /**
   * Update an existing security advisory in a repository
   */
  async updateAdvisory(
    owner: string,
    repo: string,
    ghsa_id: string,
    advisory: CreateAdvisoryRequest
  ): Promise<GitHubSecurityAdvisory> {
    try {
      // Map vulnerabilities - note: severity is NOT a valid field for vulnerabilities in update request
      // Severity is set at the advisory level, not per vulnerability
      const apiVulnerabilities = advisory.vulnerabilities.map(vuln => ({
        package: vuln.package,
        vulnerable_version_range: vuln.vulnerable_version_range,
        patched_versions: vuln.patched_versions || undefined,
      }));

      // Build the request body - GitHub API doesn't allow both severity and cvss_vector_string
      // Prefer cvss_vector_string if present, otherwise use severity
      const requestBody: any = {
        owner,
        repo,
        ghsa_id,
        summary: advisory.summary,
        description: advisory.description,
        cwe_ids: advisory.cwe_ids || [],
        vulnerabilities: apiVulnerabilities as any,
      };

      if (advisory.cvss_vector_string) {
        // If CVSS vector string is present, use it (GitHub will derive severity from CVSS)
        requestBody.cvss_vector_string = advisory.cvss_vector_string;
      } else {
        // Otherwise, use the severity field directly
        // Map severity: "moderate" -> "medium" for API compatibility
        const apiSeverity = advisory.severity === "moderate" ? "medium" : advisory.severity;
        requestBody.severity = apiSeverity as "critical" | "high" | "medium" | "low";
      }

      const response = await this.octokit.rest.securityAdvisories.updateRepositoryAdvisory(requestBody);

      // Convert the API response to our type
      return {
        ...response.data,
        description: response.data.description ?? null,
        severity: (response.data.severity === "medium" ? "moderate" : response.data.severity) as "critical" | "high" | "medium" | "low" | "moderate" | null,
        identifiers: [...response.data.identifiers],
      } as unknown as GitHubSecurityAdvisory;
    } catch (error: any) {
      throw new Error(`Failed to update advisory: ${error.message}`);
    }
  }

  /**
   * Convert a fetched advisory to a create request format
   */
  advisoryToCreateRequest(advisory: GitHubSecurityAdvisory): CreateAdvisoryRequest {
    // Extract CVSS vector string from all possible sources
    // Priority: cvss -> cvss_v3 -> cvss_v4
    let cvss_vector_string: string | undefined = undefined;
    if (advisory.cvss?.vector_string) {
      cvss_vector_string = advisory.cvss.vector_string;
    } else if (advisory.cvss_severities?.cvss_v3?.vector_string) {
      cvss_vector_string = advisory.cvss_severities.cvss_v3.vector_string;
    } else if (advisory.cvss_severities?.cvss_v4?.vector_string) {
      cvss_vector_string = advisory.cvss_severities.cvss_v4.vector_string;
    }

    return {
      summary: advisory.summary,
      description: advisory.description || "",
      severity: advisory.severity || "medium",
      cwe_ids: advisory.cwes?.map(cwe => cwe.cwe_id) || [],
      cvss_vector_string: cvss_vector_string || undefined,
      vulnerabilities: advisory.vulnerabilities.map(vuln => ({
        package: {
          ecosystem: vuln.package.ecosystem,
          name: vuln.package.name || "",
        },
        severity: (vuln.severity || "medium") as "critical" | "high" | "medium" | "low" | "moderate",
        vulnerable_version_range: vuln.vulnerable_version_range || "",
        // Map first_patched_version to patched_versions if patched_versions is not available
        patched_versions: vuln.patched_versions || vuln.first_patched_version || null,
      })),
      state: "temporary", // Start as temporary for new advisories
    };
  }
}

