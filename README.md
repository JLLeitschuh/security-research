# Jonathan Leitschuh - Security Research

Public disclosure channel for disclosing security vulnerabilities I've discovered.

[Take me to the research!](https://github.com/JLLeitschuh/security-research/security/advisories)

## Why

I report a relatively high number of security vulnerabilities. Particularly to OSS projects.

Unfortunately, I've discovered that I'm spending a lot of my time chasing down maintainers, asking them to open GitHub Security Advisories, or trying to make contact via email. I've realized that this "making contact" phase is where a majority of my time/resources/energy was being spent. Additionally, my time/resources are spent ensuring the maintainers follow up on fixes and that disclosure occurs. I find that I'm not spending time on actual security research.

The goal of this repository is to invert the relationship. I create advisories, and invite the maintainers to participate in the advisory.

Should the maintainer wish to move the discussion/fix/disclosure to a GitHub Security Advisory against their own repository, I'm happy to do that.
However, this channel provides an easy way for me to enforce my disclosure policy in a consistent and fair way.

## Coordinated Disclosure Process

1. When a vulnerability is uncovered, that vulnerability is written up as a [GHSA here](https://github.com/JLLeitschuh/security-research/security/advisories). This advisory is written for public consumption and communicates both the impact of the vulnerability and the source locations impacted.
2. An attempt to contact the maintainer is made via email or other communication channel (eg. HackerOne, BugCrowd, Twitter, ect...). The maintainer is invited to the newly created GHSA. The initial contact contains a high-level description of the vulnerability but no more. Disclosure and communication about the vulnerability happens via GHSA. If the maintainer would like to open a GHSA against their own GitHub repository, this is also acceptable and the contents of the original GHSA will be copied over.
   1. If the maintainer chooses not to accept the vulnerability disclosure via GHSA, or can't be reached via issue/email or other communication channels, the top 6 contributors to the project from the past 3 years are added to the GHSA.
      If no one confirms the vulnerability after 30 days, the vulnerability is automatically disclosed publicly.
   2. If the maintainer chooses not to accept the vulnerability disclosure via GHSA, the vulnerability is automatically publicly disclosed and a CVE will be requested.
4. Collaboration on the GHSA between myself and the maintainer over the disclosure contents occurs via the GHSA.
5. Disclosure occurs when the disclosure conditions are met, either from the maintainers GHSA or the original GHSA.

## My Disclosure Policy

**My vulnerability disclosure follows the OpenSource Security Foundation (OpenSSF) Outbound Vulnerability Disclosure Policy [90-day vulnerability disclosure policy](https://openssf.org/about/vulnerability-disclosure-policy/). Full disclosure will occur either at the end of the 90-day deadline or whenever a patch is made widely available, whichever occurs first.**
