const ctx = require("~/ctx")

const remoteFile = ".foundernetes/machines/bin/gohash"

module.exports = async (file, ssh = ctx.getSSH()) => {
  const result = await ssh.execCommand(`${remoteFile} ${file}`)
  const [sum] = result.stdout?.split(" ") || []
  return sum
}
