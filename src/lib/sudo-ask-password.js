const os = require("os")

const read = require("read")

module.exports = async (options = {}) => {
  const { username } = os.userInfo()
  const { prompt = `[sudo] password for ${username}: ` } = options
  const password = await read({
    prompt,
    silent: true,
  })
  return password
}
