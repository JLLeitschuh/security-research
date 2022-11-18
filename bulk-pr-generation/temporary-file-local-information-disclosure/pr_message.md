[SECURITY] Fix Temporary File Information Disclosure Vulnerability

# Security Vulnerability Fix

This pull request fixes a Temporary File Information Disclosure Vulnerability, which may exist in this project.

Even if you deem, as the maintainer of this project, this is not necessarily fixing a security vulnerability, it is still, most likely, a valid security hardening.

## Preamble

The system temporary directory is shared between all users on most unix-like systems (not MacOS, or Windows). Thus, code interacting with the system temporary directory must be careful about file interactions in this directory, and must ensure that the correct file posix permissions are set.

This PR was generated because a call to `File.createTempFile(..)` was detected in this repository in a way that makes this project vulnerable to local information disclosure.
With the default uname configuration, `File.createTempFile(..)` creates a file with the permissions `-rw-r--r--`. This means that any other user on the system can read the contents of this file.

### Impact

Information in this file is visible to other local users, allowing a malicious actor co-resident on the same machine to view potentially sensitive files.

#### Other Examples

 - [CVE-2020-15250](https://github.com/advisories/GHSA-269g-pwp5-87pp) - junit-team/junit
 - [CVE-2021-21364](https://github.com/advisories/GHSA-hpv8-9rq5-hq7w) - swagger-api/swagger-codegen
 - [CVE-2022-24823](https://github.com/advisories/GHSA-5mcr-gq6c-3hq2) - netty/netty
 - [CVE-2022-24823](https://github.com/advisories/GHSA-269q-hmxg-m83q) - netty/netty

# The Fix

The fix has been to convert the logic above to use the following API that was introduced in Java 1.7.

```java
File tmpDir = Files.createTempFile("temp dir").toFile();
```

The API both creates the file securely, ie. with a random, non-conflicting name, with file permissions that only allow the currently executing user to read or write the contents of this file.
By default, `Files.createTempFile("temp dir")` will create a file with the permissions `-rw-------`, which only allows the user that created the file to view/write the file contents.

# :arrow_right: Vulnerability Disclosure :arrow_left:

:wave: Vulnerability disclosure is a super important part of the vulnerability handling process and should not be skipped! This may be completely new to you, and that's okay, I'm here to assist!

First question, do we need to perform vulnerability disclosure? It depends!

 1. Is the vulnerable code only in tests or example code? No disclosure required!
 2. Is the vulnerable code in code shipped to your end users? Vulnerability disclosure is probably required!

## Vulnerability Disclosure How-To

You have a few options options to perform vulnerability disclosure. However, I'd like to suggest the following 2 options:

 1. Request a CVE number from GitHub by creating a repository-level [GitHub Security Advisory](https://docs.github.com/en/code-security/repository-security-advisories/creating-a-repository-security-advisory). This has the advantage that, if you provide sufficient information, GitHub will automatically generate Dependabot alerts for your downstream consumers, resolving this vulnerability more quickly.
 2. Reach out to the team at Snyk to assist with CVE issuance. They can be reached at the [Snyk's Disclosure Email](mailto:report@snyk.io).

## Detecting this and Future Vulnerabilities

This vulnerability was automatically detected by GitHub's CodeQL using this [CodeQL Query](https://codeql.github.com/codeql-query-help/java/java-local-temp-file-or-directory-information-disclosure/).

You can automatically detect future vulnerabilities like this by enabling the free (for open-source) [GitHub Action](https://github.com/github/codeql-action).

I'm not an employee of GitHub, I'm simply an open-source security researcher.

## Source

This contribution was automatically generated with an [OpenRewrite](https://github.com/openrewrite/rewrite) [refactoring recipe](https://docs.openrewrite.org/), which was lovingly hand crafted to bring this security fix to your repository.

The source code that generated this PR can be found here:
[SecureTempFileCreation](https://github.com/openrewrite/rewrite-java-security/blob/main/src/main/java/org/openrewrite/java/security/SecureTempFileCreation.java)

## Opting-Out

If you'd like to opt-out of future automated security vulnerability fixes like this, please consider adding a file called
`.github/GH-ROBOTS.txt` to your repository with the line:

```
User-agent: JLLeitschuh/security-research
Disallow: *
```

This bot will respect the [ROBOTS.txt](https://moz.com/learn/seo/robotstxt) format for future contributions.

Alternatively, if this project is no longer actively maintained, consider [archiving](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/about-archiving-repositories) the repository.

## CLA Requirements

_This section is only relevant if your project requires contributors to sign a Contributor License Agreement (CLA) for external contributions._

It is unlikely that I'll be able to directly sign CLAs. However, all contributed commits are already automatically signed-off.

> The meaning of a signoff depends on the project, but it typically certifies that committer has the rights to submit this work under the same license and agrees to a Developer Certificate of Origin
> (see [https://developercertificate.org/](https://developercertificate.org/) for more information).
>
> \- [Git Commit Signoff documentation](https://developercertificate.org/)

If signing your organization's CLA is a strict-requirement for merging this contribution, please feel free to close this PR.

## Sponsorship & Support

This contribution is sponsored by HUMAN Security Inc. and the new Dan Kaminsky Fellowship, a fellowship created to celebrate Dan's memory and legacy by funding open-source work that makes the world a better (and more secure) place.

This PR was generated by [Moderne](https://www.moderne.io/), a free-for-open source SaaS offering that uses format-preserving AST transformations to fix bugs, standardize code style, apply best practices, migrate library versions, and fix common security vulnerabilities at scale.

## Tracking

All PR's generated as part of this fix are tracked here: https://github.com/JLLeitschuh/security-research/issues/18
