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

### Connect to a remote host

```javascript
const {SMBSession} = require('libdsm')
const opts = {
  domain: 'FOO',  // Active Directory domain
  server: 'bar', // hostname or IP
  user: 'users',
  password: 'password'
}

const session = new SMBSession(opts)
session.connect()
  .then(() => {
    console.log('Connected to server')
  })
```

If the remote host is not part of an AD domain, do not set `domain`.

### Connect to one of the host shared folder

```javascript
session.connect()
  .then(() => {
    return session.connectToSharedFolder('C$')
  })
  .then(share => {
    console.log('Connected to shared folder C$')
  })
```

### List directory content

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

`listFiles` can filter results by passing a `RegExp` or `function` as second argument.

```javascript
// Returns only files ending with .txt (case insensitive)
share.listFiles('my-folder', /\.txt$/i)

// Returns only files wich name contains 'foo'
share.listFiles('my-folder', file => file.indexOf('foo') >= 0)
```

### Recursively directory content list

```javascript
// List all files and folders contained inside the share root folder
share.listFilesRecursively()

// List all .txt files of the share, only if path contains log
share.listFilesRecursively('', /\.txt$/i, /log/i)
// Output example : ['logs\file.txt', 'logs\http\file.txt', 'logo\readme.txt']
```

`share.listFilesRecursively` filters results by passing a `RegExp` or `function` as third argument.

### Read / Write files

```javascript
share.getFileContent('my-file.txt')
  .then(contentBuffer => console.log(contentBuffer.toString()))
```

### Write files

```javascript
share.getFileContent('my-file.txt')
  .then(contentBuffer => console.log(contentBuffer.toString()))
```

<!--### Open file

closeFile

closeAllFiles
-->

### removeFile

```javascript
share.removeFile('foo.txt')
```

### createDirectory

```javascript
share.createDirectory('new-directory')
```

### removeEmptyDirectory

Remove a directory. The directory must be empty.

```javascript
share.removeDirectory('new-directory')
```

### removeDirectory

Recursively delete directory content, then remove direcory.

```javascript
share.removeDirectory('new-directory')
```

### copyLocalFileToRemote

Copy a local file to the remote host.

```javascript
share.copyLocalFileToRemote('in.txt', 'folder/out.txt')
```

### copyRemoteFileToRemote

Copy a remote file to the remote host.

```javascript
share.copyRemoteFileToRemote('some/folder/in.txt', 'some/other/folder/out.txt')
```

### copyRemoteFileToLocal

Copy a remote file locally.

```javascript
share.copyRemoteFileToLocal('some/folder/in.txt', 'some/other/folder/out.txt')
```

### Disconnect from host (disconnection session)

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

