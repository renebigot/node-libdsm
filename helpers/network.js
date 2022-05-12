const dns = require('dns')

module.exports = {
  inetAton (address) {
    const buffer = Buffer.from(address.split('.').reduce((final, current) => {
      final.push(parseInt(current))
      return final
    }, []))
    buffer.type = 'uint32'
    return buffer.deref()
  },

  inetNtoa (address) {
    return `${(address & 0x000000FF) >> 0}.${(address & 0x0000FF00) >> 8}.${(address & 0x00FF0000) >> 16}.${(address & 0xFF000000) >> 24}`
  },

  dnsResolve (name) {
    return new Promise((resolve, reject) => {
      dns.resolve(name, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res[0])
        }
      })
    })
  }
}
