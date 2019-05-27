const ref = require('ref')
const {
  SMBTransports,
  SMBDSMResults,
  // SMBFileAccessRights,
  SMBNTStatuses
} = require('../dep/smb-defs')
const Libdsm = require('../dep/libdsm')
const SMBShare = require('./smb-share')
const {
  inetAton,
  debugLog,
  netbiosResolve,
  dnsResolve
} = require('../helpers/index')

class SMBSession {
  constructor ({domain, server, user, password}) {
    this.server = server
    this.domain = domain
    this.user = user
    this.password = password
    this._session = null
    this._shares = []
  }

  connect () {
    if (this._session) {
      this.disconnect()
    }

    return new Promise(async (resolve, reject) => {
      // Complete network infos
      if (!this.serverAddress) {
        if (this.server.toLowerCase() === 'localhost') {
          this.server = '127.0.0.1'
        }

        if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(this.server)) {
          this.serverAddress = inetAton(this.server)
        } else {
          const splittedServerName = this.server.split('.')
          this.server = splittedServerName.shift() // server name should not contain domain info

          // keep domain value if exists
          // otherwise get domain name from server extensions
          this.domain = this.domain || splittedServerName.join('.')

          if (this.domain) {
            // domain is defined, use DNS resolve
            this.serverAddress = inetAton(await dnsResolve(`${this.server}.${this.domain}`))
          } else {
            // domain is not defined, use local netbios resolve from libdsm
            this.serverAddress = inetAton(await netbiosResolve(this.server))
          }
        }
      }

      // set domain to server if no domain found
      this.domain = this.domain || this.server

      // Create session
      this._session = Libdsm.smb_session_new()

      if (this._session === null) {
        return reject(new Error('An error has occurred while creating an SMB session.'))
      }

      // Connect to remote
      if (Libdsm.smb_session_connect(this._session,
        this.server,
        this.serverAddress,
        SMBTransports.SMB_TRANSPORT_TCP) !== SMBDSMResults.DSM_SUCCESS) {
        return reject(new Error(`Unable to connect to host '${this.server}' (0x${this.serverAddress.toString(16)}).`))
      }

      // Set connection credentials
      Libdsm.smb_session_set_creds(this._session, this.domain, this.user, this.password)

      // Login
      const result = Libdsm.smb_session_login(this._session)
      if (result === SMBDSMResults.DSM_SUCCESS) {
        if (this._session.guest) {
          debugLog('Logged in as GUEST')
        } else {
          debugLog('Successfully logged in')
        }
      } else {
        // On error, get NT Status
        const reason = SMBNTStatuses[Libdsm.smb_session_get_nt_status(this._session)]
        return reject(new Error(`Authentication failed. Reason: ${reason}`))
      }

      resolve()
    })
  }

  disconnect () {
    this.disconnectAllSharedFolders()
    Libdsm.smb_session_destroy(this._session)
  }

  listSharedFolders () {
    return new Promise((resolve, reject) => {
      const list = []
      const shares = ref.alloc('pointer')
      const sharesCount = ref.alloc('size_t')
      debugLog(`Listing shared folders at '\\\\${this.server}'.`)

      if (Libdsm.smb_share_get_list(this._session, shares, sharesCount) !== SMBDSMResults.DSM_SUCCESS) {
        const description = `An error has occurred while listing shared folders at '\\\\${this._parent.server}'.`
        debugLog(description)
        return reject(new Error(description))
      }

      debugLog(`  Found ${sharesCount.deref()} shared folders`)
      for (let f = 0; f < sharesCount.deref(); ++f) {
        const share = Libdsm.smb_share_list_at(shares.deref(), f)
        if (share) {
          debugLog(`  Found ${share}`)
          list.push(share)
        }
      }

      // Do not smb_share_list_destroy --> malloc error
      // Libdsm.smb_share_list_destroy(shares)
      resolve(list)
    })
  }

  connectToSharedFolder (path) {
    path = path.replace(/\//g, '\\')
    const share = SMBShare.connect(this, this._session, path)
    this._shares.push(share)
    return share
  }

  disconnectAllSharedFolders () {
    this._shares.forEach(share => {
      share.disconnect()
    })
    this._shares = []
  }
}

module.exports = SMBSession
