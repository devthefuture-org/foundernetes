const ctx = require("@foundernetes/ctx")
const sudoFactory = require("@foundernetes/std/linux/sudo-factory")

module.exports = (options = {}) => {
  const config = ctx.getConfig()
  const { password = config.sudoPassword } = options
  return sudoFactory({ ...options, password })
}
