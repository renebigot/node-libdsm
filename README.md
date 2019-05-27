# node-libdsm

`node-libdsm` is a nodejs library to connect to SMB shares (Windows or Samba shared folders). It's a nice alternative to [samba-client](https://www.npmjs.com/package/samba-client). Instead of using `smbclient` to connect to remote hosts, `node-libdsm` use Videolabs' [libdsm](https://github.com/videolabs/libdsm), which is much efficient than spawning and listening to `smbclient`.

## Requirements

`node-libdsm` is WIP only compatible with macOS. Support is coming soon for Windows and Linux.


## Installation


`npm install libdsm`

or 

`yarn add libdsm`

## Content

This lib exports 3 classes : 

* `SMBSession`: Used to connect to a remote host
* `SMBShare`: Manage actions on shared folders
* `NetbiosNS`: Netbios hepers

Raw access to libdsm is given through the `Libdsm` exported property.

## How to use

###  `new SMBSession(opts)`

* `opts` (`<object>`): Session parameters :
  * `host` (`<string>`): Remote host name or IP address.
  * `user` (`<string>`): Username to connect to host.
  * `password` (`<string>`): User's password.
  * `domain` (`<string>`): Remote host Active Directory domain (optional).

Creates a new `Session` to a remote host.

```javascript
const {SMBSession} = require('libdsm')
const opts = {
  domain: 'MYDOMAIN',  // Active Directory domain
  server: '10.0.0.1', // hostname or IP
  user: 'users',
  password: 'P@s5w0rd'
}

const session = new SMBSession(opts)
session.connect()
  .then(() => {
    console.log('Connected to server')
  })
```

### `session.connectToSharedFolder(name)`

* `name` (`<string>`): name of the shared folder you want to connect to.

* Returns a `<Promise>` which is resolved with a `<SMBShare>`.

Connect to one of the host shared folder.

```javascript
session.connect()
  .then(() => {
    return session.connectToSharedFolder('C$')
  })
  .then(share => {
    console.log('Connected to shared folder C$')
  })
```

### `session.disconnect()`

* Returns a `<Promise>` which is resolved with no argument.

Disconnect from remote host, opened shares or files will be closed.

```javascript
const session = new SMBSession(opts)
session.connect()
  .then(() => {
    console.log('Connected to server')
  })
  .then(() => {
   // Every connected folders will be disconnected
   // Every opened files will be closed
    session.disconnec()
  })
```

### `share.listFiles([[path], fileFilter])`

* `path` (`<string>`): path of the directory. Pass `undefined`, `null`, `false` or `''` to get share root directory content.

* `fileFilter` (`<RegExp>` | `<Function>`): used to test if a file should be added to directory content listing.

* Returns a `<Promise>` which is resolved with a list of `<string>` representing directory content.

List remote directory content.

```javascript
share.listFiles('my-folder')    // list content of the folder my-folder in the share
// Output example : ['my-folder\file.txt', 'my-folder\Picture.jpg']
```

or

```javascript 
share.listFiles()    // list content of the share root
// Output example : ['file.txt', 'Picture.jpg']
```

Output contains full path information.

`listFiles` can filter results by passing a `<RegExp>` or `<Function>` as second argument.

```javascript
// Returns only files ending with .txt (case insensitive)
share.listFiles('my-folder', /\.txt$/i)

// Returns only files wich name contains 'foo'
share.listFiles('my-folder', file => file.indexOf('foo') >= 0)
```

### `share.listFilesRecursively([[path], [fileFilter, [directoryFilter, [depth]]]])`

* `path` (`<string>`): path of the directory. Pass `undefined`, `null`, `false` or `''` to get share root directory content.

* `fileFilter` (`<RegExp>` | `<Function>`): used to test if a file should be added to the content listing.

* `directoryFilter` (`<RegExp>` | `<Function>`): used to test if a directory content should be 
added to the content listing.

* `depth` (`<number>`): Recursion depth. Default to `Infinity`.

* Returns a `<Promise>` which is resolved with a list of `<string>` representing directory content.

Recursively list directory content.

```javascript
// List all files and folders contained inside the share root folder
share.listFilesRecursively()

// List all .txt files of the share, only if path contains log
share.listFilesRecursively('', /\.txt$/i, /log/i)
// Output example : ['logs\file.txt', 'logs\http\file.txt', 'logo\readme.txt']
```

### `share.getFileContent(path)`

* `path` (`<string>`): Path of the file to read.

* Returns a `<Promise>` which is resolved with a `<Buffer>`, the raw file content.

Read a remote file content.

```javascript
share.getFileContent('my-file.txt')
  .then(contentBuffer => console.log(contentBuffer.toString()))
```

### `share.writeFileContent(path, content)`

* `path` (`<string>`): Path of the file to write.

* `content` (`<buffer>` | `<string>`): content to write to remote file.

* Returns a `<Promise>` which is resolved with no argument.

Write content to a remote file.

```javascript
share.writeFileContent('out.txt')
  .then(contentBuffer => console.log('write OK'))
```

<!--### Open file

closeFile

closeAllFiles
-->

### `share.removeFile(path)`

* `path` (`<string>`): Path of the file to remote.

* Returns a `<Promise>` which is resolved with no argument.

Remove a file from the remote share.


```javascript
share.removeFile('foo.txt')
```

### `share.createDirectory(path)`

* `path` (`<string>`): Path of the directory to create.

* Returns a `<Promise>` which is resolved with no argument.

Create a directory inside the remote share

```javascript
share.createDirectory('new-directory')
```

### `share.removeEmptyDirectory(path)`

* `path` (`<string>`): Path of the directory to remove.

* Returns a `<Promise>` which is resolved with no argument.

Remove a directory. The directory must be empty.

```javascript
share.removeEmptyDirectory('new-directory')
```

### `share.removeDirectory(path)`

* `path` (`<string>`): Path of the directory to remove.

* Returns a `<Promise>` which is resolved with no argument.

Recursively delete directory content, then remove direcory.

```javascript
share.removeDirectory('new-directory')
```

### `share.copyLocalFileToRemote(in, out)`

* `in` (`<string>`): Path of the local source file.

* `out` (`<string>`): Path of the remote file destination.

* Returns a `<Promise>` which is resolved with no argument.

Copy a local file to the remote host.

```javascript
share.copyLocalFileToRemote('in.txt', 'folder/out.txt')
```

### `share.copyRemoteFileToRemote(in, out)`

* `in` (`<string>`): Path of the remote source file.

* `out` (`<string>`): Path of the remote file destination.

* Returns a `<Promise>` which is resolved with no argument.

Copy a remote file to the remote host.

```javascript
share.copyRemoteFileToRemote('some/folder/in.txt', 'some/other/folder/out.txt')
```

### `share.copyRemoteFileToLocal(in, out)`

* `in` (`<string>`): Path of the remote source file.

* `out` (`<string>`): Path of the local file destination.

* Returns a `<Promise>` which is resolved with no argument.

Copy a remote file locally.

```javascript
share.copyRemoteFileToLocal('some/folder/in.txt', 'some/other/folder/out.txt')
```
