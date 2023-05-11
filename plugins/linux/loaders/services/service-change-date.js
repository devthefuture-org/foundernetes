const { createLoader } = require("@foundernetes/blueprint")

module.exports = ({ loaders }) =>
  createLoader({
    load: async (vars) => {
      const { name } = vars
      const stateTimestamp = await loaders.services.serviceInfos({
        name,
        field: "StateChangeTimestamp",
      })
      const [, day, time, tz] = stateTimestamp.split(" ")
      const date = new Date(`${day} ${time} (${tz})`)
      return date
    },
  })
