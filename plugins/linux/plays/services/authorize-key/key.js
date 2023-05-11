const fs = require("fs-extra")

const { createPlay } = require("@foundernetes/blueprint")

module.exports = async () => {
  const getAuthorizedKeys = async (authorizedKeysFile) => {
    const authorizedKeysText = await fs.readFile(authorizedKeysFile, {
      encoding: "utf-8",
    })
    const authorizedKeys = authorizedKeysText
      .split("\n")
      .filter((line) => line.trim().length > 0)
    return authorizedKeys
  }

  return createPlay(async () => {
    let authorizedKeysCache = null
    return {
      async check(vars) {
        const { authorizedKeysFile, publicKey } = vars
        const authorizedKeys = await getAuthorizedKeys(authorizedKeysFile)
        authorizedKeysCache = authorizedKeys
        return authorizedKeys.includes(publicKey)
      },
      async run(vars) {
        const { authorizedKeysFile, publicKey } = vars
        const authorizedKeys =
          authorizedKeysCache || (await getAuthorizedKeys(authorizedKeysFile))
        const content = [...authorizedKeys, publicKey].join("\n")
        await fs.writeFile(authorizedKeysFile, content, {
          encoding: "utf-8",
        })
        authorizedKeysCache = null
        return true
      },
    }
  })
}
