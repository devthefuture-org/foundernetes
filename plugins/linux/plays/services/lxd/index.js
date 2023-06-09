const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children, plays }) =>
  createComposer(
    async (vars = {}) => {
      const { storageDir = "/storage" } = vars
      await plays.std.ensureDir(
        {
          dir: storageDir,
          sudoWrite: true,
        },
        { tags: ["lxd"] }
      )

      await children.host({}, { tags: ["lxd"] })
      const { preseed } = vars
      await children.user({}, { tags: ["lxd"] })
      await children.init({ preseed }, { tags: ["lxd"] })
      const { instances } = vars
      await children.instances({ instances }, { tags: ["lxd"] })
    },
    { tags: ["lxd"] }
  )

Object.assign(module.exports, {
  init: require("./init"),
  host: require("./host"),
  user: require("./user"),
  instance: require("./instance"),
  instances: require("./instances"),
})
