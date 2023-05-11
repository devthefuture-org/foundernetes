const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) => {
  return createComposer(async (vars) => {
    const { groupname, gid } = vars
    await children.exists({ groupname })

    if (gid !== undefined) {
      await children.gid({ groupname, gid })
    }
  })
}

Object.assign(module.exports, {
  exists: require("./exists"),
  gid: require("./gid"),
})
