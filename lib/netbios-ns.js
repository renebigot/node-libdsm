const ref = require('ref')
const Libdsm = require('../dep/libdsm')
const {NetbiosNameTypes} = require('../dep/netbios-defs')
const {SMBDSMResults} = require('../dep/smb-defs')
const {inetNtoa} = require('../helpers/network')

class NetbiosNS {
  static resolve (name) {
    return new Promise((resolve, reject) => {
      const nameService = Libdsm.netbios_ns_new()
      const addr = ref.alloc('uint32')
      let shouldStop = false
      const types = Object.values(NetbiosNameTypes)

      while (!shouldStop) {
        const hostType = types.shift()
        if (hostType !== undefined) {
          shouldStop = Libdsm.netbios_ns_resolve(nameService, name, 0, addr) === SMBDSMResults.DSM_SUCCESS

          if (shouldStop) {
            resolve(inetNtoa(addr.deref))
          }
        } else {
          shouldStop = true
          reject(new Error(`Netbios address resolution for ${name} failed.`))
        }
      }

      Libdsm.netbios_ns_destroy(nameService)
    })
  }
}

module.exports = NetbiosNS
