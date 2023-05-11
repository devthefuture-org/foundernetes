const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) =>
  createComposer(async (vars) => {
    const { groupname, gid } = vars
    await children.group({ groupname, gid })

    const { username, uid, home, shell, password } = vars
    await children.user({ username, uid, gid, home, shell, password })
  })

Object.assign(module.exports, {
  group: require("./group"),
  user: require("./user"),
})
