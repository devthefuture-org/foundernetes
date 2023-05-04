const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { groupname, gid } = vars
      const group = await loaders.services.group({ group: groupname })
      return group.gid === gid
    },

    async run(vars) {
      const { groupname, gid } = vars
      await $(`groupmod -g ${gid} ${groupname}`)
    },
  })
