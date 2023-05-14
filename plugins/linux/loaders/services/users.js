const { createLoader } = require("@foundernetes/blueprint")
const passwd = require("@foundernetes/std/linux/passwd")

module.exports = () => {
  return createLoader({
    load: async () => {
      return passwd()
    },
  })
}
