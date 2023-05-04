const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) => {
  return createComposer(async (vars) => {
    const { username } = vars
    await children.exists({ username })

    const { gid } = vars
    if (gid !== undefined) {
      await children.gid({ username, gid })
    }

    const { home } = vars
    if (home !== undefined) {
      await children.home({ username, home })
    }

    const { shell } = vars
    if (shell !== undefined) {
      await children.shell({ username, shell })
    }

    const { password } = vars
    if (password !== undefined) {
      await children.password({ username, ...password })
    }
  })
}

Object.assign(module.exports, {
  exists: require("./exists"),
  gid: require("./gid"),
  home: require("./home"),
  shell: require("./shell"),
  password: require("./password"),
})
