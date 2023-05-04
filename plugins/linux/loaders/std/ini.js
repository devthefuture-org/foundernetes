const fs = require("fs-extra")
const ini = require("ini")

const { createLoader } = require("@foundernetes/blueprint")

module.exports = () =>
  createLoader({
    load: async (vars) => {
      const { file } = vars
      const content = await fs.readFile(file, { encoding: "utf-8" })
      return ini.parse(content)
    },
  })
