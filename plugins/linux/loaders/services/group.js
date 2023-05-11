const os = require("os")

const { createLoader } = require("@foundernetes/blueprint")

module.exports = ({ mod }) => {
  return createLoader({
    load: async (vars = {}) => {
      let { group } = vars
      if (group === undefined || group === null) {
        const userInfos = await os.userInfo()
        group = userInfos.gid
      }
      const groups = await mod.groups()
      return groups.find(
        (g) => g.groupname === group || g.gid === group.toString()
      )
    },
  })
}
