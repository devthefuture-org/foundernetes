const fs = require("fs-extra")
const deepmerge = require("@foundernetes/std/deepmerge")
const traverseAsync = require("@foundernetes/std/traverse-async")
const { render } = require("@foundernetes/eta")

const { yaml, createLoader } = require("@foundernetes/blueprint")

module.exports = () =>
  createLoader({
    load: async (vars) => {
      const { file, files = [file], isArray } = vars

      const data = {}
      for (const f of files) {
        const content = await fs.readFile(f, { encoding: "utf-8" })
        const mergeData = yaml.load(content, { isArray })
        deepmerge(data, mergeData)
      }

      await traverseAsync(data, async (value) =>
        typeof value !== "string"
          ? value
          : render(value, data, { tags: ["$${{", "}}"] })
      )

      return data
    },
  })
