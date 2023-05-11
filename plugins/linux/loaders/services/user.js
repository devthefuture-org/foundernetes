const os = require("os")

const { createLoader } = require("@foundernetes/blueprint")

module.exports = ({ mod }) => {
  return createLoader({
    load: async (vars = {}) => {
      let { user } = vars
      if (user === undefined || user === null) {
        const userInfos = await os.userInfo()
        user = userInfos.username
      }
      const users = await mod.users()
      return users.find((u) => u.username === user || u.uid === user.toString())
    },
  })
}
