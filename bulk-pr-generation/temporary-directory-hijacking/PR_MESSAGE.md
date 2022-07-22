[SECURITY] Fix Temporary Directory Hijacking or Information Disclosure Vulnerability

# Security Vulnerability Fix

This pull request fixes either 1.) Temporary Directory Hijacking Vulnerability, or 2.) Temporary Directory Information Disclosure Vulnerability, which existed in this project.

## Preamble

The system temporary directory is shared between all users on most unix-like systems (not MacOS, or Windows). Thus, code interacting with the system temporary directory must be careful about file interactions in this directory, and must ensure that the correct file permissions are set.

This PR was generated because the following chain of calls was detected in this repository in a way that leaves this project vulnerable.
`File.createTempFile(..)` -> `file.delete()` -> either `file.mkdir()` or `file.mkdirs()`.

## Temporary Directory Hijacking

This vulnerability exists because the return value from `file.mkdir()` or `file.mkdirs()` is not checked to determine if the call sucseeded. Say, for example, because another local user created the directory before this process.

```java
File tmpDir = File.createTempFile("temp", ".dir"); // Attacker knows the full path of the directory that will be later created
// delete the file that was created
tmpDir.delete(); // Attacker sees file is deleted and begins a race to create their own directory before the java code.
// and makes a directory of the same name
// 🏁 SECURITY VULNERABILITY: Race Condition! - Attacker beats java code and now owns this directory
tmpDir.mkdirs(); // This method returns 'false' because it was unable to create the directory. No exception is thrown.
// Attacker can write any new files to this directory that they wish.
// Attacker can read any files created by this process.
```

### Other Examples

 - [CVE-2021-20202](https://github.com/advisories/GHSA-6xp6-fmc8-pmmr) - Keycloak/Keycloak
 - [CVE-2020-27216](https://github.com/advisories/GHSA-g3wg-6mcf-8jj6) - eclipse/jetty.project

## Temporary Directory Information Disclosure

This vulnerability exists because, although the return values of `file.mkdir()` or `file.mkdirs()` are correctly checked, the permissions of the directory that is created follows the default system `uname` settings. Thus, the directory is created with everyone-readable permissions. As such, any files/directories written into this directory are viewable by all other local users on the system.

```java
File tmpDir = File.createTempFile("temp", ".dir");
tmpDir.delete();
if (!tmpDir.mkdirs()) { // Guard correctly prevents temporary directory hijacking, but directory contents are everyone-readable.
    throw new IOException("Failed to create temporary directory");
}
```

### Other Examples

 - [CVE-2020-15250](https://github.com/advisories/GHSA-269g-pwp5-87pp) - junit-team/junit
 - [CVE-2021-21364](https://github.com/advisories/GHSA-hpv8-9rq5-hq7w) - swagger-api/swagger-codegen
 - [CVE-2022-24823](https://github.com/advisories/GHSA-5mcr-gq6c-3hq2) - netty/netty
 - [CVE-2022-24823](https://github.com/advisories/GHSA-269q-hmxg-m83q) - netty/netty

# ▶️ Vulnerability Disclosure ◀️

👋 Vulnerability disclosure is a super important part of the vulnerability handling process and should not be skipped! This may be completely new to you, and that's okay, I'm here to assist!

First question, do we need to perform vulnerability disclosure? It depends!

 1. Is the vulnerable code only in tests or example code? No disclosure required!
 2. Is the vulnerable code in code shipped to your end users? Vulnerability disclosure is probably required!

## Vulnerability Disclosure How-To

You have a few options options to perform vulnerability disclosure. However, I'd like to suggest the following 2 options:

 1. Request a CVE number from GitHub by creating a repository-level [GitHub Security Advisory](https://docs.github.com/en/code-security/repository-security-advisories/creating-a-repository-security-advisory). This has the advantage that, if you provide sufficient information, GitHub will automatically generate Dependabot alerts for your downstream consumers, resolving this vulnerability more quickly.
 2. Reach out to the team at Snyk to assist with CVE issuance. They can be reached at the [Snyk's Disclosure Email](mailto:report@snyk.io).
