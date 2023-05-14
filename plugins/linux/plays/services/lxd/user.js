const { createComposer } = require("@foundernetes/blueprint")
const ctx = require("@foundernetes/ctx")
const group = require("@foundernetes/std/linux/group")

module.exports = async ({ plays }) => {
  return createComposer(
    async (vars) => {
      const { groupname = "lxd" } = vars
      let { gid } = vars
      if (!gid) {
        ;({ gid } = await group(groupname))
      }

      const config = ctx.getConfig()
      await plays.services.user.user.gid({
        username: config.user.username,
        gid,
      })
    },
    {
      tags: ["lxd"],
    }
  )
}
