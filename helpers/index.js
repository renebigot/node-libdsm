const fs = require('fs')
const path = require('path')
const {platform, arch} = process
const networkHelpers = require('./network')

module.exports = {
  ...networkHelpers,

  getLibPath () {
    let libPath = path.resolve(__dirname, `../bin/${platform}/${arch}/`)

    if (fs.existsSync(libPath)) {
      switch (platform) {
        case 'darwin':
          libPath += `/libdsm.3.dylib`
          break
        case 'win32':
          libPath += `/cygdsm-3.dll`
          break
      }
    }

    if (fs.lstatSync(libPath).isDirectory()) {
      throw new Error(`Unsupported arch or platform for libdsm ${arch}/${platform}`)
    }

    return libPath
  },

  debugLog () {
    if (process.env.DEBUG === '1') {
      console.log('[LIBDSM]', ...arguments)
    }
  }

}
