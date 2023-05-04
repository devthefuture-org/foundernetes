const { createLoader, $ } = require("@foundernetes/blueprint")

const camelcase = require("lodash.camelcase")

const removeSuffix = require("@foundernetes/std/remove-suffix")
const removePrefix = require("@foundernetes/std/remove-prefix")

module.exports = async () =>
  createLoader({
    load: async () => {
      const { stdout } = await $("cat /etc/os-release", { logStd: false })
      const osRelease = stdout
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .reduce((acc, line) => {
          let [key, value] = line.split("=")
          key = camelcase(key)
          value = removePrefix(value, '"')
          value = removeSuffix(value, '"')
          acc[key] = value
          return acc
        }, {})

      return osRelease
    },
  })
