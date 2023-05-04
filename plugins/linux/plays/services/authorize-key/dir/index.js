const path = require("path")

const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ loaders, plays, children }) =>
  createComposer(async (vars) => {
    const { user } = vars
    const userInfos = await loaders.services.user({ user })
    vars = { ...vars, userInfos }
    await plays.std.dirExists({
      dir: path.dirname(vars.authorizedKeysFile),
      sudo: true,
    })
    await children.chown(vars)
    await children.chmod(vars)
  })

Object.assign(module.exports, {
  chown: require("./chown"),
  chmod: require("./chmod"),
})
