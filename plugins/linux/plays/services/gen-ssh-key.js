const fs = require("fs-extra")

const { createPlay, $ } = require("@foundernetes/blueprint")
const ctx = require("@foundernetes/ctx")
const passwdUser = require("@foundernetes/std/linux/passwd-user")
const untildify = require("@foundernetes/std/untildify")

module.exports = async () => {
  return createPlay(async (vars = {}) => {
    const config = ctx.getConfig()
    const { username: defaultUsername } = config.user
    const { username = defaultUsername } = vars
    const { homedir } = await passwdUser(username)
    let { keyPath = `${homedir}/.ssh/id_rsa` } = vars
    keyPath = untildify(keyPath)

    return {
      async check() {
        return fs.pathExists(keyPath)
      },
      async run() {
        await $(`ssh-keygen -q -b 4096 -t rsa -N '' -f "${keyPath}"`, {
          input: "\ny",
        })
      },
    }
  })
}
