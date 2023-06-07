const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async (vars) => {
    const { file, rules } = vars
    if (!rules) {
      return
    }
    const lines = []
    for (const [type, list] of Object.entries(rules)) {
      lines.push(`*${type}`, ...list, "COMMIT")
    }
    await plays.std.configBlock({
      file,
      sudo: true,
      lines,
    })
  })
