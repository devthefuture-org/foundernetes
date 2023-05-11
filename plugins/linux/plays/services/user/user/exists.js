const { createPlay, $ } = require("@foundernetes/blueprint")

const validateUsername = require("../utils/validate-username")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username } = vars
      const user = await loaders.services.user({ user: username })
      return !!user
    },

    async run(vars) {
      const { username } = vars
      const group = await loaders.services.group({ group: username })
      await $(`useradd ${group ? `-g ${group.gid}` : ""} ${username}`, {
        sudo: true,
      })
    },

    validateVars: {
      type: "object",
      properties: {
        username: {
          type: "string",
          validator: [
            validateUsername,
            () => "must be valid username: /^([a-z_][a-z0-9_-]{0,30})$/",
          ],
        },
      },
      required: ["username"],
    },
  })
