const os = require("os")
const groups = require("./groups")

module.exports = async (group) => {
  if (group === undefined || group === null) {
    const userInfos = await os.userInfo()
    group = userInfos.gid
  }
  const etcGroups = await groups()
  return etcGroups.find(
    (g) => g.groupname === group || g.gid === group.toString()
  )
}
