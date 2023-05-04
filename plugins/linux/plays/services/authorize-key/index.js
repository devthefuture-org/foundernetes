const path = require("path")

const fs = require("fs-extra")

const ctx = require("@foundernetes/ctx")
const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ loaders, children }) =>
  createComposer(async (vars) => {
    vars = { ...vars }

    if (!vars.user) {
      const config = ctx.require("config")
      vars.user = config.user.username
    }

    const { user } = vars

    const { publicKeyFile } = vars
    let { publicKey } = vars
    if (!publicKey && publicKeyFile) {
      publicKey = await fs.readFile(publicKeyFile, { encoding: "utf-8" })
      vars.publicKey = publicKey
    }

    await children.validate({ input: publicKey })

    let { authorizedKeysFile } = vars
    if (!authorizedKeysFile) {
      const { homedir } = await loaders.services.user({ user })
      const sshDir = path.join(homedir, ".ssh")
      authorizedKeysFile = path.join(sshDir, "authorized_keys")
      vars.authorizedKeysFile = authorizedKeysFile
    }

    await children.dir(vars)
    await children.file(vars)
    await children.key(vars)
  })

Object.assign(module.exports, {
  key: require("./key"),
  file: require("./file"),
  dir: require("./dir"),
  validate: require("./validate"),
})
