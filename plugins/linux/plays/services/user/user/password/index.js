const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) => {
  return createComposer(async (vars) => {
    const { username } = vars

    const { encryptedPassword } = vars
    if (encryptedPassword !== undefined) {
      await children.encryptedPassword({ username, encryptedPassword })
    }

    const { changed } = vars
    if (changed !== undefined) {
      await children.changed({ username, changed })
    }

    const { inactive } = vars
    if (inactive !== undefined) {
      await children.inactive({ username, inactive })
    }

    const { accountExpires } = vars
    if (accountExpires !== undefined) {
      await children.accountExpires({ username, accountExpires })
    }

    const { minDays } = vars
    if (minDays !== undefined) {
      await children.minDays({ username, minDays })
    }

    const { maxDays } = vars
    if (maxDays !== undefined) {
      await children.maxDays({ username, maxDays })
    }

    const { warnDays } = vars
    if (warnDays !== undefined) {
      await children.warnDays({ username, warnDays })
    }
  })
}

Object.assign(module.exports, {
  encryptedPassword: require("./encrypted-password"),
  changed: require("./changed"),
  inactive: require("./inactive"),
  accountExpires: require("./account-expires"),
  minDays: require("./min-days"),
  maxDays: require("./max-days"),
  warnDays: require("./warn-days"),
})
