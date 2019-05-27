module.exports = {
  SMBSession: require('./lib/smb-session'),
  SMBShare: require('./lib/smb-share'),
  NetbiosNS: require('./lib/netbios-ns'),

  // Raw libdsm functions
  Libdsm: require('./dep/libdsm')
}
