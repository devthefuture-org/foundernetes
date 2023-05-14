const { createLoader } = require("@foundernetes/blueprint")
const groups = require("@foundernetes/std/linux/groups")

module.exports = () => {
  return createLoader({
    load: async () => {
      return groups()
    },
  })
}
