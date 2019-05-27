const {StatusDescriptions} = require('nt-status')

module.exports = {
  SMBTransports: {
    // SMB with Direct-TCP connection (OSX supports only this)
    SMB_TRANSPORT_TCP: 1,
    // SMB with Netbios over TCP (older mechanism)
    SMB_TRANSPORT_NBT: 2
  },

  SMBSessionStates: {
    // Error state, there was an error somewhere
    SMB_STATE_ERROR: -1,
    // The SMB session has just been created
    SMB_STATE_NEW: 0,
    // A Netbios session has been successfully established.
    SMB_STATE_NETBIOS_OK: 1,
    // Dialect was successfully negotiated
    SMB_STATE_DIALECT_OK: 2,
    // Session Authentication was successfull, you can become nasty
    SMB_STATE_SESSION_OK: 3
  },

  SMBFseekOperations: {
    // Set the read pointer at the given position
    SMB_SEEK_SET: 0,
    // Adjusts the read pointer relatively to the actual position
    SMB_SEEK_CUR: 1
  },

  SMBSessionSupportsWhat: {
    SMB_SESSION_XSEC: 0
  },

  SMBStatTypes: {
    // smb_stat_get() OP: Get file size
    SMB_STAT_SIZE: 0,
    // smb_stat_get() OP: Get file allocation size (Size on disk)
    SMB_STAT_ALLOC_SIZE: 1,
    // smb_stat_get() OP: 0 -> not a directory, != 0 -> directory
    SMB_STAT_ISDIR: 2,
    // smb_stat_get() OP: Get file creation time
    SMB_STAT_CTIME: 3,
    // smb_stat_get() OP: Get file last access time
    SMB_STAT_ATIME: 4,
    // smb_stat_get() OP: Get file last write time
    SMB_STAT_WTIME: 5,
    // smb_stat_get() OP: Get file last moditification time
    SMB_STAT_MTIME: 6
  },

  SMBFileAccessRights: {
    // Flag for smb_file_open. Request right for reading
    SMB_MOD_READ: 1 << 0,
    // Flag for smb_file_open. Request right for writing
    SMB_MOD_WRITE: 1 << 1,
    // Flag for smb_file_open. Request right for appending
    SMB_MOD_APPEND: 1 << 2,
    // Flag for smb_file_open. Request right for extended read (?)
    SMB_MOD_READ_EXT: 1 << 3,
    // Flag for smb_file_open. Request right for extended write (?)
    SMB_MOD_WRITE_EXT: 1 << 4,
    // Flag for smb_file_open. Request right for execution (?)
    SMB_MOD_EXEC: 1 << 5,
    // Flag for smb_file_open. Request right for child removal (?)
    SMB_MOD_RMCHILD: 1 << 6,
    // Flag for smb_file_open. Request right for reading file attributes
    SMB_MOD_READ_ATTR: 1 << 7,
    // Flag for smb_file_open. Request right for writing file attributes
    SMB_MOD_WRITE_ATTR: 1 << 8,
    // Flag for smb_file_open. Request right for removing file
    SMB_MOD_RM: 1 << 16,
    // Flag for smb_file_open. Request right for reading ACL
    SMB_MOD_READ_CTL: 1 << 17,
    // Flag for smb_file_open. Request right for writing ACL
    SMB_MOD_WRITE_DAC: 1 << 18,
    // Flag for smb_file_open. Request right for changing owner
    SMB_MOD_CHOWN: 1 << 19,
    // Flag for smb_file_open. (??)
    SMB_MOD_SYNC: 1 << 20,
    // Flag for smb_file_open. (??)
    SMB_MOD_SYS: 1 << 24,
    // Flag for smb_file_open. (??)
    SMB_MOD_MAX_ALLOWED: 1 << 25,
    // Flag for smb_file_open. Request all generic rights (??)
    SMB_MOD_GENERIC_ALL: 1 << 28,
    // Flag for smb_file_open. Request generic exec right (??)
    SMB_MOD_GENERIC_EXEC: 1 << 29,
    // Flag for smb_file_open. Request generic read right (??)
    SMB_MOD_GENERIC_READ: 1 << 30,
    // Flag for smb_file_open. Request generic write right (??)
    SMB_MOD_GENERIC_WRITE: 1 << 31,
    // Flag for smb_file_open. Default R/W mode
    SMB_MOD_RW: 1 << 0 | 1 << 1 | 1 << 2 | 1 << 3 | 1 << 4 | 1 << 7 | 1 << 8 | 1 << 17,
    // @brief Flag for smb_file_open. Default R/O mode
    SMB_MOD_RO: 1 << 0 | 1 << 3 | 1 << 7 | 1 << 17
  },

  SMBNTStatuses: StatusDescriptions,

  SMBDSMResults: {
    DSM_SUCCESS: 0,
    DSM_ERROR_GENERIC: -1,
    DSM_ERROR_NT: -2,
    DSM_ERROR_NETWORK: -3,
    DSM_ERROR_CHARSET: -4
  }
}
