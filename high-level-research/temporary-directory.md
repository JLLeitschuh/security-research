# Java Vulnerabilities Involving the System Temporary Directory

## 1. Temporary Directory Hijacking

This vulnerability has the highest impact when it comes to vulnerabilities surrounding the Java temp directory.

### Example 1

```

```

## 2. Temporary File Information Disclosure

These vulnerabilities disclose the contents of those files to other users on the system.

### Vulnerability Examples

```java
File tempVuln = File.createTempFile("random", "file");
// temVuln contents are viewable by all other users
```
```java
File tempVuln = File.createTempFile("random", "file", null);
// temVuln contents are viewable by all other users
```
```java
File tempDir = new File(System.getProperty("java.io.tmpdir"));
File tempVuln = File.createTempFile("random", "file", tempDir);
// temVuln contents are viewable by all other users
```
```java
File tempDirChildVuln = new File(System.getProperty("java.io.tmpdir"), "/child.txt");
Files.write(tempDirChildVuln.toPath(), Arrays.asList("secret"), StandardCharsets.UTF_8, StandardOpenOption.CREATE);
// tempDirChildVuln contents are viewable by all other users
```
```java
Path tempDirChild = new File(System.getProperty("java.io.tmpdir"), "/child-output-stream.txt").toPath();
var fileOutputStream = Files.newOutputStream(tempDirChild);
// Anything written to fileOutputStream is viewable by all other users
```
```java
File tempDirChildVuln = new File(System.getProperty("java.io.tmpdir"), "/child-create-file.txt");
Files.createFile(tempDirChildVuln.toPath());
// tempDirChildVuln contents are viewable by all other users
```

## 3. Temporary Directory Information Disclosure

These vulnerabilities don't allow for the hijacking of the temporary directory being created.
But the contents of this directory can be read by all other local users on the system.

### Vulnerability Examples

```java
File tempDirVuln = com.google.common.io.Files.createTempDir();
// tempDirVuln any contents of this directory written is visible to all other users
```
```java
File tempDirChildVuln = new File(System.getProperty("java.io.tmpdir"), "/child");
if (!tempDirChildVuln.mkdir()) {
    throw new IOException("Failed to create temporary directory: " + tempDirChildVuln);
}
// tempDirChildVuln any contents of this directory written is visible to all other users
```
```java
File tempDirChildVuln = new File(System.getProperty("java.io.tmpdir"), "/child");
if (!tempDirChildVuln.mkdirs()) {
    throw new IOException("Failed to create temporary directory: " + tempDirChildVuln);
}
// tempDirChildVuln any contents of this directory written is visible to all other users
```
```java
// TODO: CHECK THIS ONE
File tempDirChild = new File(System.getProperty("java.io.tmpdir"), "/child-create-directory");
Files.createDirectory(tempDirChild.toPath()); // Creates with permissions 'drwxr-xr-x'
```
