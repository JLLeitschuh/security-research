# GHSA Extractor

A TypeScript tool to extract and recreate GitHub Security Advisories (GHSA) from one repository to another.

## Features

- Fetch GitHub Security Advisories by URL
- Recreate advisories in a target repository with all fields copied
- CLI interface for local development and testing
- GitHub Action integration for automated workflow

## Prerequisites

- Node.js 20.6.0 or higher (required for native `.env` file support)
- A GitHub Personal Access Token (PAT) with the following scopes:
  - `repository_advisories:write` - Required to create security advisories
  - `repo` - Required if accessing private repositories

## Installation

1. Clone the repository and navigate to the `ghsa-extractor` directory:

```bash
cd ghsa-extractor
```

2. Install dependencies:

```bash
npm install
```

3. Build the TypeScript project:

```bash
npm run build
```

4. Set up your environment:

Copy the `.env.template` file to `.env` and add your GitHub token:

```bash
cp .env.template .env
```

Edit `.env` and replace `your_github_token_here` with your actual GitHub Personal Access Token.

## Usage

### CLI Commands

#### Fetch an Advisory

Fetch and pretty-print the details of a GitHub Security Advisory:

```bash
npm start fetch <advisory-url>
```

Example:
```bash
npm start fetch https://github.com/microsoft/playwright-mcp/security/advisories/GHSA-r44f-mw4f-2mvw
```

#### Recreate an Advisory

Fetch an advisory and recreate it in a target repository:

```bash
npm start recreate <advisory-url> [--target-repo owner/repo]
```

Example (default target repo):
```bash
npm start recreate https://github.com/microsoft/playwright-mcp/security/advisories/GHSA-r44f-mw4f-2mvw
```

Example (custom target repo):
```bash
npm start recreate https://github.com/microsoft/playwright-mcp/security/advisories/GHSA-r44f-mw4f-2mvw --target-repo myorg/myrepo
```

### GitHub Action

You can use this tool via GitHub Actions by running the `extract-ghsa` workflow manually (workflow_dispatch).

#### Inputs

- `advisory_url` (required): The URL of the GitHub Security Advisory to extract
- `target_repo` (optional): Target repository to create the advisory in (format: `owner/repo`). Defaults to `JLLeitschuh/security-research`
- `mode` (optional): Operation mode - either `fetch` (fetch only) or `recreate` (fetch and recreate). Defaults to `recreate`

#### Secrets

- `GITHUB_TOKEN` (required): A GitHub Personal Access Token with the `repository_advisories:write` scope. 
  - The workflow uses `secrets.GITHUB_TOKEN` which is the default GitHub Actions token. 
  - If the default token doesn't have sufficient permissions, you may need to add your own PAT as a repository secret and update the workflow to use it instead.

#### Example Workflow Usage

1. Go to the Actions tab in your repository
2. Select the "Extract GHSA" workflow
3. Click "Run workflow"
4. Fill in the inputs:
   - Advisory URL: `https://github.com/microsoft/playwright-mcp/security/advisories/GHSA-r44f-mw4f-2mvw`
   - Target Repo: `JLLeitschuh/security-research` (or leave default)
   - Mode: `recreate` (or leave default)
5. Click "Run workflow"

## How It Works

1. **URL Parsing**: The tool parses the GitHub Security Advisory URL to extract:
   - Repository owner
   - Repository name
   - GHSA ID

2. **Advisory Fetching**: Uses the GitHub REST API to fetch the full advisory details including:
   - Summary and description
   - Severity level
   - CVSS vector string (if available)
   - CWE IDs
   - Vulnerability details (package ecosystem, version ranges, etc.)

3. **Advisory Creation**: Creates a new advisory in the target repository with all the same fields:
   - All metadata is copied
   - Vulnerabilities are recreated with the same details
   - New advisory starts in `temporary` state

## API Reference

The tool uses the following GitHub REST API endpoints:

- **GET** `/repos/{owner}/{repo}/security-advisories/{ghsa_id}` - Fetch an advisory
- **POST** `/repos/{owner}/{repo}/security-advisories` - Create an advisory

See the [GitHub API documentation](https://docs.github.com/en/rest/security-advisories/repository-advisories) for more details.

## Development

### Project Structure

```
ghsa-extractor/
├── src/
│   ├── action.ts          # GitHub Action entry point
│   ├── advisory-parser.ts # URL parsing logic
│   ├── cli.ts             # CLI implementation
│   ├── github-client.ts   # GitHub API client
│   ├── index.ts           # Main exports
│   └── types.ts           # TypeScript type definitions
├── dist/                  # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.template
└── README.md
```

### Building

```bash
npm run build
```

This compiles TypeScript files from `src/` to `dist/`.

### Development Mode

Watch for changes and rebuild automatically:

```bash
npm run dev
```

## License

ISC

