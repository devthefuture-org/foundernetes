const read = require("read")

module.exports = async (options = {}) => {
  const { prompt = "sudo requires your password: " } = options
  const password = await read({
    prompt,
    silent: true,
  })
  return password
}
