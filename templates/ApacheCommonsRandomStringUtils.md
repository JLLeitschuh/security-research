# CWE-338: Use of Cryptographically Weak Pseudo-Random Number Generator (PRNG)

The [NAME OF LIBRARY OR COMPONENT] uses an insecure source of randomness to [SECURITY SENSITIVE ACTION].
This is because this codebase relies upon apache-commons lang3 RandomStringUtils.

From the documentation on `RandomStringUtils`:

> Caveat: Instances of Random, upon which the implementation of this class relies, are not cryptographically secure.
> - https://commons.apache.org/proper/commons-lang/javadocs/api-3.9/org/apache/commons/lang3/RandomStringUtils.html

Here are the examples of your codebase's use of an insecure PRNG in security-sensitive locations:
 
 -
 -

## Impact

Since your codebase leverages an insecure/factorable source of randomness, [DESCRIBE IMPACT IN THIS CONTEXT].

## Proof Of Concepts Already Exist
There has already been a POC of taking one RNG value generated RandomStringUtils and reversing it to generate all of the past/future RNG values public since March 3rd, 2018.

https://pucarasec.wordpress.com/2020/05/09/the-java-soothsayer-a-practical-application-for-insecure-randomness-includes-free-0day/

POC Repository: https://github.com/alex91ar/randomstringutils

## Similar Vulnerabilities

This vulnerability existed in a code generator, JHipster, and that vulnerability was scored as a CVSSv3 score of 9.8/10.
We believe this vulnerability may be similarly scored.

 - https://nvd.nist.gov/vuln/detail/CVE-2019-16303

This vulnerability was also found in in Apero CAS which was scored as an 8.1/10.

 - https://nvd.nist.gov/vuln/detail/CVE-2019-10754

**This responsible disclosure follows [Google's 90-day vulnerability disclosure policy](https://www.google.com/about/appsecurity/) (I'm not an employee of Google, I just like their policy). Full disclosure will occur either at the end of the 90-day deadline or whenever a patch is made widely available, whichever occurs first.**

Bug Bounties are appreciated but not expected or required.
