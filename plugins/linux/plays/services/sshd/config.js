const ctx = require("@foundernetes/ctx")
const { createComposer } = require("@foundernetes/blueprint")

// upperFirst, not capitalize: capitalize lowercases the rest of the key
// (X11Forwarding -> X11forwarding), and sshd-config matches keys by exact
// case, so it appended a second line that sshd ignored (first one wins)
const upperFirst = require("lodash/upperFirst")

module.exports = async ({ plays, mod }) =>
  createComposer(async (vars) => {
    const iterator = ctx.require("iterator")

    const { sshdConfigFile = "/etc/ssh/sshd_config" } = vars
    let { config: configSet = {} } = vars

    configSet = {
      AuthorizedKeysFile: ".ssh/authorized_keys", // many OpenSSH versions also look for ssh/authorized_keys2, avoid this vector of attack enforcing the default one path
      ListenAddress: "0.0.0.0",
      PasswordAuthentication: "no",
      AuthenticationMethods: "publickey",
      ChallengeResponseAuthentication: "yes",
      HostbasedAuthentication: "no",
      IgnoreRhosts: "yes",
      PermitRootLogin: "no",
      Subsystem: "sftp /usr/lib/openssh/sftp-server",
      SyslogFacility: "AUTH",
      Port: 54567, // 49152–65535 https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
      ...Object.entries(configSet).reduce((acc, [key, value]) => {
        acc[upperFirst(key)] = value
        return acc
      }, {}),
    }

    await iterator.eachOfSeries(
      configSet,
      async (value, key) =>
        mod.configSet({ value, key, filename: sshdConfigFile }),
      "sshd-config"
    )
    await plays.services.serviceReloadOnFileChange({
      file: sshdConfigFile,
      serviceName: "ssh",
    })
  })
