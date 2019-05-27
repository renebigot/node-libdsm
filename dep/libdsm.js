// const Struct = require('ref-struct')
const ffi = require('ffi')
const helpers = require('../helpers')

const libPath = helpers.getLibPath()

// typedef
const {
  bufferRef,
  smbFd,
  smbFdRef,
  smbTid,
  smbTidRef,
  smbShareList,
  smbShareListRef,
  smbStat,
  smbStatList,
  smbSessionRef,
  offT,
  sizeTRef,
  netbiosNsRef
  // netbiosNsEntryRef,
  // opaqueRef
} = require('./smb-types')

// const netbiosNsDiscoverCallbacksRef = Struct({
//   'p_opaque': opaqueRef,
//   'pf_on_entry_added': 'pointer',
//   'pf_on_entry_removed': 'pointer'
// })

module.exports = ffi.Library(libPath, {
  // netbios_ns
  // 'netbios_ns_entry_name': ['string', [netbiosNsEntryRef]],
  // 'netbios_ns_entry_group': ['string', [netbiosNsEntryRef]],
  // 'netbios_ns_entry_ip': ['uint32', [netbiosNsEntryRef]],
  // 'netbios_ns_entry_type': ['char', [netbiosNsEntryRef]],
  'netbios_ns_new': [netbiosNsRef, []],
  'netbios_ns_destroy': ['void', [netbiosNsRef]],
  'netbios_ns_resolve': ['int', [netbiosNsRef, 'string', 'char', 'uint32']],
  // 'netbios_ns_inverse': ['string', [netbiosNsRef, 'uint32']],
  // 'netbios_ns_discover_start': ['int', [netbiosNsRef, 'uint32', netbiosNsDiscoverCallbacksRef]],
  // 'netbios_ns_discover_stop': ['int', [netbiosNsRef]],

  // smb_session
  'smb_session_new': [smbSessionRef, []],
  'smb_session_destroy': ['void', [smbSessionRef]],
  'smb_session_set_creds': ['void', [smbSessionRef, 'string', 'string', 'string']],
  'smb_session_connect': ['int', [smbSessionRef, 'string', 'uint32', 'int']],
  'smb_session_login': ['int', [smbSessionRef]],
  // 'smb_session_logoff': ['int', [smbSessionRef]],
  // 'smb_session_is_guest': ['int', [smbSessionRef]],
  'smb_session_server_name': ['string', [smbSessionRef]],
  // 'smb_session_supports': ['int', [smbSessionRef, 'int']],
  'smb_session_get_nt_status': ['uint32', [smbSessionRef]],

  // smb_dir
  'smb_directory_rm': ['int', [smbSessionRef, smbTid, 'string']],
  'smb_directory_create': ['int', [smbSessionRef, smbTid, 'string']],

  // smb_file
  'smb_fopen': ['int', [smbSessionRef, smbTid, 'string', 'uint32', smbFdRef]],
  'smb_fclose': ['void', [smbSessionRef, smbFdRef]],
  'smb_fread': ['int', [smbSessionRef, smbFd, bufferRef, 'size_t']],
  'smb_fwrite': ['int', [smbSessionRef, smbFd, bufferRef, 'size_t']],
  'smb_fseek': ['int', [smbSessionRef, smbFd, offT, 'int']],
  'smb_file_rm': ['int', [smbSessionRef, smbTid, 'string']],
  // 'smb_file_mv': ['int', [smbSessionRef, smbTid, 'string', 'string']],

  // smb_share
  'smb_share_get_list': ['int', [smbSessionRef, smbShareListRef, sizeTRef]],
  'smb_share_list_count': ['size_t', [smbShareList]],
  'smb_share_list_at': ['string', [smbShareList, 'size_t']],
  'smb_share_list_destroy': ['void', [smbShareList]],
  'smb_tree_connect': ['int', [smbSessionRef, 'string', smbTidRef]],
  'smb_tree_disconnect': ['int', [smbSessionRef, smbTid]],

  // smb_stat
  'smb_find': [smbStatList, [smbSessionRef, smbTid, 'string']],
  // 'smb_fstat': [smbStat, [smbSessionRef, smbTid, 'string']],
  // 'smb_stat_fd': [smbStat, [smbSessionRef, smbFd]],
  'smb_stat_destroy': ['void', [smbStat]],
  'smb_stat_list_count': ['size_t', [smbStatList]],
  // 'smb_stat_list_next': [smbStat, [smbStatList]],
  'smb_stat_list_at': [smbStat, [smbStatList, 'size_t']],
  'smb_stat_list_destroy': ['void', [smbStatList]],
  'smb_stat_name': ['string', [smbStat]],
  'smb_stat_get': ['uint64', [smbStat, 'int']]
})
