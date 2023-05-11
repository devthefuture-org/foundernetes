const fs = require("fs-extra")

const { yaml, createLoader } = require("@foundernetes/blueprint")

module.exports = ({ key = "file", default: fallback = null }) =>
  createLoader({
    load: async (vars) => {
      const file = vars[key] || fallback
      const content = await fs.readFile(file, { encoding: "utf-8" })
      const { isArray } = vars
      return yaml.load(content, { isArray })
    },
  })
