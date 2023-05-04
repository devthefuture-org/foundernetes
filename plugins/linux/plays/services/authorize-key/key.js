const fs = require("fs-extra")

const { createPlay } = require("@foundernetes/blueprint")

module.exports = async () =>
  createPlay({
    before: async (vars) => {
      const { authorizedKeysFile } = vars

      const authorizedKeysText = await fs.readFile(authorizedKeysFile, {
        encoding: "utf-8",
      })
      const authorizedKeys = authorizedKeysText
        .split("\n")
        .filter((line) => line.trim().length > 0)

      return {
        authorizedKeys,
      }
    },
    async check(vars, common) {
      const { authorizedKeys } = common
      const { publicKey } = vars
      return authorizedKeys.includes(publicKey)
    },
    async run(vars, common) {
      const { publicKey, authorizedKeysFile } = vars
      const { authorizedKeys } = common
      authorizedKeys.push(publicKey)
      const authorizedKeysText = authorizedKeys.join("\n")
      await fs.writeFile(authorizedKeysFile, authorizedKeysText, {
        encoding: "utf-8",
      })
      return true
    },
  })
