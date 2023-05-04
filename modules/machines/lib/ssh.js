const untildify = require("untildify")
const { NodeSSH } = require("node-ssh")

module.exports = async (options = {}) => {
  const ssh = new NodeSSH()
  const { address, user, port, password, tryKeyboard } = options
  let { keyPath } = options
  if (keyPath) {
    keyPath = untildify(keyPath)
  }
  await ssh.connect({
    host: address,
    username: user,
    port,
    privateKeyPath: keyPath,
    password,
    tryKeyboard,
  })
  return ssh
}
