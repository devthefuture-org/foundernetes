const { createLoader, $ } = require("@foundernetes/blueprint")

module.exports = () =>
  createLoader({
    load: async (vars) => {
      const { name, field } = vars
      const { stdout } = await $(
        `systemctl show ${name} --no-pager ${field ? `-P ${field}` : ""}`,
        {
          logStd: false,
        }
      )
      return field
        ? stdout
        : stdout.split("\n").reduce((acc, pair) => {
            const [key, ...value] = pair.split("=")
            acc[key] = value.join("=")
            return acc
          }, {})
    },
  })
