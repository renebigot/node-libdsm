const ref = require('ref-napi')
const ArrayType = require('ref-array-di')(ref)

const bufferRef = ref.refType(ref.types.void)
const smbFd = ref.types.uint32
const smbFdRef = ref.refType(smbFd)
const smbTid = ref.types.uint16
const smbTidRef = ref.refType(smbTid)
const smbShareList = ArrayType(ref.types.CString)
const smbShareListRef = ref.refType(smbShareList)
const smbStat = ref.refType(ref.types.void)
const smbStatList = ref.refType(ref.types.void)
const smbSessionRef = ref.refType(ref.types.void)
const offT = ref.types.long
const sizeTRef = ref.refType(ref.types.size_t)
const netbiosNsRef = ref.refType(ref.types.void)
const netbiosNsEntryRef = ref.refType(ref.types.void)
const opaqueRef = ref.refType(ref.types.void)

module.exports = {
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
  netbiosNsRef,
  netbiosNsEntryRef,
  opaqueRef
}
