/**
 * TypeScript interfaces for GitHub Security Advisory API responses
 */

export interface GitHubSecurityAdvisory {
  ghsa_id: string;
  cve_id: string | null;
  url: string;
  html_url: string;
  summary: string;
  description: string | null;
  severity: "critical" | "high" | "medium" | "low" | "moderate" | null;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string | null;
    url: string;
    html_url: string;
    type: string;
    site_admin: boolean;
  } | null;
  publisher: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string | null;
    url: string;
    html_url: string;
    type: string;
    site_admin: boolean;
  } | null;
  identifiers: ReadonlyArray<{
    type: string;
    value: string;
  }>;
  state: "temporary" | "draft" | "published" | "closed";
  created_at: string;
  updated_at: string;
  published_at: string | null;
  closed_at: string | null;
  withdrawn_at: string | null;
  submission: {
    accepted: boolean;
  } | null;
  vulnerabilities: Array<{
    package: {
      ecosystem: "rubygems" | "npm" | "pip" | "maven" | "nuget" | "composer" | "go" | "rust" | "erlang" | "actions" | "pub" | "other" | "swift" | string;
      name: string | null;
    };
    severity: "critical" | "high" | "medium" | "low" | "moderate" | null;
    vulnerable_version_range: string | null;
    first_patched_version?: string | null;
    patched_versions?: string | null;
  }>;
  cvss?: {
    vector_string: string | null;
    score: number | null;
  } | null;
  cvss_severities?: {
    cvss_v3?: {
      vector_string: string | null;
      score: number | null;
    } | null;
    cvss_v4?: {
      vector_string: string | null;
      score: number | null;
    } | null;
  } | null;
  cwes?: Array<{
    cwe_id: string;
    name: string;
  }> | null;
  credits: Array<{
    user: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string | null;
      url: string;
      html_url: string;
      type: string;
      site_admin: boolean;
    } | null;
    type: string;
  }> | null;
}

export interface CreateAdvisoryRequest {
  summary: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "moderate";
  cwe_ids?: string[];
  cvss_vector_string?: string;
  vulnerabilities: Array<{
    package: {
      ecosystem: string;
      name: string;
    };
    severity: "critical" | "high" | "medium" | "low" | "moderate";
    vulnerable_version_range: string;
    patched_versions?: string | null;
  }>;
  state?: "temporary" | "draft" | "published" | "closed";
}

export interface ParsedAdvisoryUrl {
  owner: string;
  repo: string;
  ghsa_id: string;
}

