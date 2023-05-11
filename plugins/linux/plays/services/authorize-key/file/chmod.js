const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async (vars) => {
    const { authorizedKeysFile } = vars

    await plays.std.chmod({
      file: authorizedKeysFile,
      mode: "600",
      sudo: true,
    })
  })
