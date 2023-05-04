const { createPlay, $ } = require("@foundernetes/blueprint")

const validateUsername = require("../utils/validate-username")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { groupname } = vars
      const group = await loaders.services.group({ group: groupname })
      return !!group
    },

    async run(vars) {
      const { groupname } = vars
      await $(`groupadd ${groupname}`, { sudo: true })
    },

    validateVars: {
      type: "object",
      properties: {
        groupname: {
          type: "string",
          validator: [
            validateUsername,
            () => "must be valid groupname: /^([a-z_][a-z0-9_-]{0,30})$/",
          ],
        },
      },
      required: ["groupname"],
    },
  })
