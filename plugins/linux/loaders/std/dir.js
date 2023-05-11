const { createLoader, $ } = require("@foundernetes/blueprint")
const shellQuote = require("shell-quote")

const micromatch = require("micromatch")
const wildstring = require("wildstring")
const removePrefix = require("@foundernetes/std/remove-prefix")

module.exports = async () =>
  createLoader({
    // retry: 3,
    load: async (vars) => {
      const { dir, recursive, sudo, glob, match } = vars
      let filesJSON
      if (recursive) {
        const { stdout } = await $("find . -name '*'", {
          cwd: dir,
          sudo,
          logStd: false,
        })
        const args = shellQuote.parse(stdout)
        filesJSON = JSON.stringify(args)
      } else {
        const { stdout } = await $(`echo *`, {
          cwd: dir,
          sudo,
          shell: true,
          logStd: false,
        })
        const args = shellQuote.parse(stdout)
        filesJSON = JSON.stringify(args)
      }
      let files = JSON.parse(filesJSON)
      files = files
        .map((file) => removePrefix(file, "./"))
        .filter((file) => file !== ".")

      if (glob) {
        files = files.filter((f) => !micromatch.isMatch(f, glob))
      }
      if (match) {
        for (const pattern of Array.isArray(match) ? match : [match]) {
          files = files.filter((f) => !wildstring.match(pattern, f))
        }
      }
      return files
    },
  })
