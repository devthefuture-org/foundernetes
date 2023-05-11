const path = require("path")

const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async (vars) => {
    const { authorizedKeysFile } = vars

    await plays.std.chmod({
      file: path.dirname(authorizedKeysFile),
      mode: "700",
      sudo: true,
    })
  })
