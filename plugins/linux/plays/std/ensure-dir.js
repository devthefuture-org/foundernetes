const path = require("path")
const { createPlay, $ } = require("@foundernetes/blueprint")

const matchClude = require("@foundernetes/match/clude")

module.exports = async ({ loaders }) =>
  createPlay({
    defaultTags: ["*"],
    async check(vars) {
      const {
        dir,
        remove,
        files,
        sudo = false,
        sudoRead = sudo,
        recursive = true,
        include = ["*"],
        exclude = [],
      } = vars
      const { exitCode: dirExistsExitCode } = await $(`test -d ${dir}`, {
        sudo: sudoRead,
        logStd: false,
        reject: false,
        stripFinalNewline: false,
      })
      if (dirExistsExitCode !== 0) {
        if (remove) {
          return true
        }
        return false
      }
      if (files) {
        let actualFiles = await loaders.std.dir({
          dir,
          recursive,
          sudo: sudoRead,
        })
        actualFiles = actualFiles.filter((f) =>
          matchClude(f, { include, exclude })
        )
        for (const actualFile of actualFiles) {
          if (!files.includes(actualFile)) {
            return false
          }
        }
      }
      return true
    },
    async run(vars) {
      const {
        dir,
        files,
        sudo = false,
        sudoRead = sudo,
        sudoWrite = sudo,
        recursive = true,
        remove,
        removeRecursive = false,
        include = ["*"],
        exclude = [],
      } = vars
      const { exitCode: dirExistsExitCode } = await $(`test -d ${dir}`, {
        sudo: sudoRead,
        logStd: false,
        reject: false,
        stripFinalNewline: false,
      })
      if (dirExistsExitCode !== 0) {
        if (remove) {
          await $(`rm -${removeRecursive ? "r" : ""}f ${dir}`, {
            sudo: sudoWrite,
          })
          return
        }
        return false
      }
      if (files) {
        let actualFiles = await loaders.std.dir({
          dir,
          recursive,
          sudo: sudoRead,
        })
        actualFiles = actualFiles.filter((f) =>
          matchClude(f, { include, exclude })
        )
        for (const actualFile of actualFiles) {
          if (!files.includes(actualFile)) {
            const filePath = path.join(dir, actualFile)
            await $(`rm -${removeRecursive ? "r" : ""}f ${filePath}`, {
              sudo: sudoWrite,
            })
          }
        }
      }
    },
  })
