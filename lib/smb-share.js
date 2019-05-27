const Libdsm = require('../dep/libdsm')
const ref = require('ref')
const {debugLog} = require('../helpers/index')
const {
  smbTid,
  smbFd
} = require('../dep/smb-types')
const {
  SMBStatTypes,
  SMBFileAccessRights,
  SMBDSMResults,
  SMBNTStatuses
} = require('../dep/smb-defs')
const fs = require('fs')

class SMBShare {
  static connect (parent, session, path) {
    debugLog(`Create a new connection to the shared folder '\\\\${parent.server}\\${path}'`)
    if (!session) {
      const description = 'Trying to connect to a share without connection to the remote server'
      debugLog(description)
      return Promise.reject(new Error(description))
    }

    const share = new this(parent, session, path)
    share.connect()
    return share
  }

  constructor (parent, session, shareName) {
    this._parent = parent
    this._session = session
    this._shareName = shareName
    this._cFds = []
  }

  _getNtStatus (session, description) {
    // On error, get NT Status
    const statusCode = Libdsm.smb_session_get_nt_status(this._session)
    const status = SMBNTStatuses[statusCode]
    return `${description}. Reason (0x${statusCode.toString(16)}): ${status}`
  }

  connect () {
    debugLog(`Connecting to shared folder '\\\\${this._parent.server}\\${this._shareName}'.`)

    return new Promise((resolve, reject) => {
      // Connect to the shared folder
      const cTid = ref.alloc(smbTid)
      const result = Libdsm.smb_tree_connect(this._session, this._shareName, cTid)
      this._tid = cTid.deref()

      if (result === SMBDSMResults.DSM_SUCCESS && this._tid) {
        debugLog(`Connected to shared folder '\\\\${this._parent.server}\\${this._shareName}'.`)
      } else {
        const description = `Unable to connect to share '\\\\${this._parent.server}\\${this._shareName}'`
        const status = this._getNtStatus(this._session, description)
        debugLog(status)
        return reject(new Error(status))
      }

      resolve(this)
    })
  }

  disconnect () {
    debugLog(`Disconnecting from shared folder '\\\\${this._parent.server}\\${this._shareName}'.`)
    this.closeAllFiles()
    const result = Libdsm.smb_tree_disconnect(this._session, this._tid)
    debugLog('Tree disconnect result:', result)
    debugLog(`Disconnected from shared folder '\\\\${this._parent.server}\\${this._shareName}'.`)
  }

  async listFilesRecursively (path, fileFilter, directoryFilter, depth = Infinity) {
    const fileIsValid = (fileFilter && typeof fileFilter.test === 'function')
      ? path => fileFilter.test(path)
      : fileFilter

    const directoryIsValid = (directoryFilter && typeof directoryFilter.test === 'function')
      ? path => directoryFilter.test(path)
      : directoryFilter

    const _listFiles = (_path, _depth) => {
      const _fullPath = `\\${this._shareName}\\${_path && `${_path}\\`}`

      if (_depth <= 0) {
        return []
      }
      --_depth

      debugLog(`Listing files at '\\\\${this._parent.server}${_fullPath}'.`)

      const files = Libdsm.smb_find(this._session, this._tid, `\\${_path}\\*`)
      if (!files) {
        const description = `An error has occurred while listing files at '\\\\${this._parent.server}${_fullPath}'.`
        debugLog(description)
        throw new Error(description)
      }

      let results = []
      const filesCount = Libdsm.smb_stat_list_count(files)

      debugLog(`  Found ${filesCount} files`)

      for (let f = 0; f < filesCount; ++f) {
        const file = Libdsm.smb_stat_list_at(files, f)
        const filename = Libdsm.smb_stat_name(file)
        if (filename && filename !== '.' && filename !== '..') {
          let fullpath = `${_path}\\${filename}`
          let shouldPush = false

          if (Libdsm.smb_stat_get(file, SMBStatTypes.SMB_STAT_ISDIR)) {
            if (!directoryIsValid || directoryIsValid(fullpath)) {
              fullpath += '\\'
              results.push(..._listFiles(`${_path}\\${filename}`, _depth))
              shouldPush = true
            }
          } else {
            console.log(filename)
            console.log(fileIsValid)

            if (!fileIsValid || fileIsValid(filename)) {
              shouldPush = true
            }
          }
          if (shouldPush) {
            debugLog(`    ${fullpath}`)
            results.push(`${fullpath}`)
          }
        }
      }

      if (!files.isNull()) {
        Libdsm.smb_stat_destroy(files)
      }

      return results
    }

    return new Promise((resolve, reject) => {
      path = (path || '').replace(/\//g, '\\').replace(/\\+$/, '')

      try {
        resolve(_listFiles(path, depth))
      } catch (e) {
        reject(e)
      }
    })
  }

  listFiles (path, fileFilter) {
    return this.listFilesRecursively(path || path, fileFilter, null, 1)
  }

  openFile (filepath, mode) {
    return new Promise((resolve, reject) => {
      const cFd = ref.alloc(smbFd)

      if (Libdsm.smb_fopen(this._session, this._tid, filepath, mode, cFd) === SMBDSMResults.DSM_SUCCESS) {
        this._cFds.push(cFd)
        debugLog(`Opened file '\\\\${this._parent.server}\\${this._shareName}\\${filepath}' (FD: ${cFd.deref()}).`)
        resolve(cFd)
      } else {
        const description = `Unable to open file '\\\\${this._parent.server}\\${this._shareName}\\${filepath}'`
        const status = this._getNtStatus(this._session, description)
        debugLog(status)
        return reject(new Error(status))
      }
    })
  }

  closeFile (cFd) {
    const fd = cFd.deref()
    if (fd > 0) {
      debugLog(`Closing file (FD: ${fd}).`)
      this._cFds = this._cFds.filter(el => el !== cFd)
      Libdsm.smb_fclose(this._session, cFd)
    }
  }

  closeAllFiles () {
    debugLog(`Closing all files from '\\\\${this._parent.server}\\${this._shareName}'.`)
    this._cFds.forEach(cFd => {
      this.closeFile(cFd)
    })
  }

  getFileContent (filepath) {
    debugLog(`Getting content for '\\\\${this._parent.server}\\${this._shareName}\\${filepath}'.`)
    filepath = filepath.replace(/\//g, '\\')
    let cFd = null

    return this.openFile(filepath, SMBFileAccessRights.SMB_MOD_READ)
      .then(_cFd => {
        cFd = _cFd
        const fd = cFd.deref()
        const bufferLength = 65535 // Seems to be the maximum limit
        let readBuffer = Buffer.alloc(bufferLength)
        const buffers = []
        let total = 0

        let length = Libdsm.smb_fread(this._session, fd, readBuffer, readBuffer.length)
        total += length
        while (length > 0) {
          // Buffer needs to be resized to the actual length
          // (otherwise, final will content unwanted memory data)
          buffers.push(readBuffer.slice(0, length))
          readBuffer = Buffer.alloc(bufferLength)
          length = Libdsm.smb_fread(this._session, fd, readBuffer, readBuffer.length)
          total += length
        }

        const final = Buffer.concat(buffers, total)
        debugLog(`Read ${total} bytes from '\\\\${this._parent.server}\\${this._shareName}\\${filepath}'.`)

        this.closeFile(cFd)

        if (total >= 0) {
          return final
        } else {
          const description = `Unable to read file '\\\\${this._parent.server}\\${this._shareName}\\${filepath}'`
          const status = this._getNtStatus(this._session, description)
          debugLog(status)
          throw new Error(status)
        }
      })
  }

  writeFileContent (filepath, content) {
    if (typeof content === 'string') {
      content = Buffer.from(content)
    }

    debugLog(`Writing ${content.length} bytes to '\\\\${this._parent.server}\\${this._shareName}\\${filepath}'.`)
    filepath = filepath.replace(/\//g, '\\')
    let cFd = null

    return this.openFile(filepath, SMBFileAccessRights.SMB_MOD_RW)
      .then(async _cFd => {
        cFd = _cFd
        const fd = cFd.deref()
        const bufferLength = 65471 // Seems to be the maximum writable length
        let start = 0
        let written = 0

        while (start < content.length && written >= 0) {
          const subBufferLength = Math.min(bufferLength, content.length - start)
          const subBuffer = content.slice(start, start + subBufferLength)
          written = Libdsm.smb_fwrite(this._session, fd, subBuffer, subBufferLength)
          start += written
        }

        this.closeFile(cFd)

        if (written < 0) {
          const description = `Unable to write to file '\\\\${this._parent.server}\\${this._shareName}\\${filepath}'`
          const status = this._getNtStatus(this._session, description)
          debugLog(status)
          throw new Error(status)
        } else {
          debugLog(`Wrote ${start} bytes to '\\\\${this._parent.server}\\${this._shareName}\\${filepath}'.`)
        }
      })
  }

  removeFile (filePath) {
    filePath = filePath.replace(/\//g, '\\')
    return new Promise((resolve, reject) => {
      if (Libdsm.smb_file_rm(this._session, this._tid, filePath) === SMBDSMResults.DSM_SUCCESS) {
        debugLog(`Removed file '\\\\${this._parent.server}\\${this._shareName}\\${filePath}'.`)
        resolve()
      } else {
        const description = `Unable to remove file '\\\\${this._parent.server}\\${this._shareName}\\${filePath}'`
        const status = this._getNtStatus(this._session, description)
        debugLog(status)
        reject(new Error(status))
      }
    })
  }

  createDirectory (dirPath) {
    dirPath = dirPath.replace(/\//g, '\\')
    return new Promise((resolve, reject) => {
      if (Libdsm.smb_directory_create(this._session, this._tid, dirPath) === SMBDSMResults.DSM_SUCCESS) {
        debugLog(`Created directory '\\\\${this._parent.server}\\${this._shareName}\\${dirPath}'.`)
        resolve()
      } else {
        // On error, get NT Status
        const description = `Unable to create directory '\\\\${this._parent.server}\\${this._shareName}\\${dirPath}'`
        const status = this._getNtStatus(this._session, description)
        debugLog(status)
        return reject(new Error(status))
      }
    })
  }

  removeEmptyDirectory (dirPath) {
    return new Promise((resolve, reject) => {
      if (Libdsm.smb_directory_rm(this._session, this._tid, dirPath) === SMBDSMResults.DSM_SUCCESS) {
        debugLog(`Removed empty directory '\\\\${this._parent.server}\\${this._shareName}\\${dirPath}'.`)
        resolve()
      } else {
        // On error, get NT Status
        const description = `Unable to remove empty directory '\\\\${this._parent.server}\\${this._shareName}\\${dirPath}'`
        const status = this._getNtStatus(this._session, description)
        debugLog(status)
        return reject(new Error(status))
      }
    })
  }

  removeDirectory (dirPath) {
    dirPath = dirPath.replace(/\//g, '\\')
    return this.listFilesRecursively(dirPath)
      .then(async files => {
        for (let f = 0; f < files.length; ++f) {
          const file = files[f]

          if (/\\$/.test(file)) {
            await this.removeEmptyDirectory(file)
          } else {
            await this.removeFile(file)
          }
        }
      })
      .then(() => {
        return this.removeEmptyDirectory(dirPath)
      })
  }

  copyLocalFileToRemote (localSourcePath, remoteDestinationPath) {
    return new Promise((resolve, reject) => {
      fs.readFile(localSourcePath, (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    })
      .then(content => {
        return this.writeFileContent(remoteDestinationPath, content)
      })
  }

  copyRemoteFileToRemote (remoteSourcePath, remoteDestinationPath) {
    return this.getFileContent(remoteSourcePath)
      .then(content => {
        return this.writeFileContent(remoteDestinationPath, content)
      })
  }

  copyRemoteFileToLocal (remoteSourcePath, localDestinationPath) {
    return this.getFileContent(remoteSourcePath)
      .then(fileContent => {
        fs.writeFileSync(localDestinationPath, fileContent)
      })
  }
}

module.exports = SMBShare
