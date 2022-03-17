# Java Vulnerabilities Involving the System Temporary Directory

On unix like systems, the system's temporary directory is shared between all users on that system. As such, files written to that directory without setting the correct file permissions can allow other users on that system to view the contents of the files written to those temporary files.

### Prerequisites

This vulnerability impacts Unix-like systems, and very old versions of Mac OSX and Windows as they all share the system temporary directory between all users.

### Workarounds

Setting the `java.io.tmpdir` system environment variable to a directory that is exclusively owned by the executing user will fix this vulnerability for all operating systems.


## 1. Temporary Directory Hijacking

This vulnerability has the highest impact when it comes to vulnerabilities surrounding the Java temp directory.

### Vunlerability Examples

```java
tmpDir = File.createTempFile(temp, ".dir", parent); // Attacker knows the full path of the file that will be generated
// delete the file that was created
tmpDir.delete(); // Attacker sees file is deleted and begins a race to create their own directory before Jetty.
// and make a directory of the same name
// SECURITY VULNERABILITY: Race Condition! - Attacker beats java code and now owns this directory
tmpDir.mkdirs(); // This method returns 'false' because it was unable to create the directory. No exception is thrown.
// Attacker can write any new files to this directory that they wish.
// Attacker can read any files created by this process.
```

## 2. Temporary File Hijacking

### Vulnerabity Examples

```java
File tempDirChildVuln = new File(System.getProperty("java.io.tmpdir"), "/child.txt");
Files.write(tempDirChildVuln.toPath(), Arrays.asList("secret"), StandardCharsets.UTF_8, StandardOpenOption.CREATE); // File has permissions `-rw-r--r--`. Doesn't check if the file already exists.
// tempDirChildVuln contents are viewable by all other users
```

```java
Path tempDirChild = new File(System.getProperty("java.io.tmpdir"), "/child-output-stream.txt").toPath();
var fileOutputStream = Files.newOutputStream(tempDirChild); // File has permissions `-rw-r--r--`. Doesn't check if the file already exists.
// Anything written to fileOutputStream is viewable by all other users
```

## 3. Temporary File Information Disclosure

These vulnerabilities disclose the contents of those files to other users on the system.

### Vulnerability Examples

```java
File tempVuln = File.createTempFile("random", "file"); // File has permissions `-rw-r--r--`
// temVuln contents are viewable by all other users
```
```java
File tempVuln = File.createTempFile("random", "file", null); // File has permissions `-rw-r--r--`
// temVuln contents are viewable by all other users
```
```java
File tempDir = new File(System.getProperty("java.io.tmpdir"));
File tempVuln = File.createTempFile("random", "file", tempDir); // File has permissions `-rw-r--r--`
// temVuln contents are viewable by all other users
```
```java
File tempDirChildVuln = new File(System.getProperty("java.io.tmpdir"), "/child.txt");
Files.write(tempDirChildVuln.toPath(), Arrays.asList("secret"), StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW); // File has permissions `-rw-r--r--`. Throws `FileAlreadyExistsException` if it already exists.
// tempDirChildVuln contents are viewable by all other users
```
```java
File tempDirChildVuln = new File(System.getProperty("java.io.tmpdir"), "/child-create-file.txt");
Files.createFile(tempDirChildVuln.toPath()); // File has permissions `-rw-r--r--`. Throws `FileAlreadyExistsException` if it already exists.
// tempDirChildVuln contents are viewable by all other users
```

## 4. Temporary Directory Information Disclosure

These vulnerabilities don't allow for the hijacking of the temporary directory being created.
But the contents of this directory can be read by all other local users on the system.

### Vulnerability Examples

```java
File tempDirVuln = com.google.common.io.Files.createTempDir(); // Directory has permissions `drwxr-xr-x`
// tempDirVuln any contents of this directory written is visible to all other users
```
```java
File tempDirChildVuln = new File(System.getProperty("java.io.tmpdir"), "/child");
if (!tempDirChildVuln.mkdir()) { // Directory has permissions `drwxr-xr-x`
    throw new FileAlreadyExistsException(tempDirChildVuln);
}
// tempDirChildVuln any contents of this directory written is visible to all other users
```
```java
File tempDirChildVuln = new File(System.getProperty("java.io.tmpdir"), "/child");
if (!tempDirChildVuln.mkdirs()) { // Directory `child` has permissions `drwxr-xr-x`
    throw new FileAlreadyExistsException(tempDirChildVuln);
}
// tempDirChildVuln any contents of this directory written is visible to all other users
```
```java
// TODO: CHECK THIS ONE
File tempDirChild = new File(System.getProperty("java.io.tmpdir"), "/child-create-directory");
Files.createDirectory(tempDirChild.toPath()); // Directory has permissions `drwxr-xr-x`. Throws `FileAlreadyExistsException` if it already exists.
```
