const os = require("os")

const { createLoader } = require("@foundernetes/blueprint")

module.exports = ({ mod }) => {
  return createLoader({
    load: async (vars = {}) => {
      let { username } = vars
      if (username === undefined || username === null) {
        const userInfos = await os.userInfo()
        username = userInfos.username
      }
      const users = await mod.passwords()
      return users.find((u) => u.username === username)
    },
  })
}
