const fs = require("fs-extra")
const { createPlay, $ } = require("@foundernetes/blueprint")
const { render } = require("@foundernetes/eta")

module.exports = async () =>
  createPlay(async (vars) => {
    const { trailingNewline = false, leadingNewline = false } = vars
    let { content } = vars
    const { contentFile } = vars
    if (!content && contentFile) {
      content = await fs.readFile(contentFile, { encoding: "utf8" })
    }
    const { templateVars = {} } = vars
    content = await render(content, templateVars)
    if (leadingNewline) {
      content = `\n${content}`
    }
    if (trailingNewline) {
      content += "\n"
    }

    return {
      defaultTags: ["*"],
      async check() {
        const { file, sudo = false, sudoRead = sudo } = vars
        const { stdout: actualContent, exitCode } = await $(`cat ${file}`, {
          sudo: sudoRead,
          logStd: false,
          reject: false,
          stripFinalNewline: false,
        })
        if (exitCode !== 0) {
          return false
        }
        return actualContent === content
      },
      async run() {
        const { file, sudo = false, validateFile, sudoWrite = sudo } = vars
        if (validateFile) {
          const validationResult = await validateFile({ content, target: file })
          if (!validationResult) {
            return false
          }
        }
        if (content.length > 0) {
          await $(`tee ${file}`, { sudo: sudoWrite, input: content })
        } else {
          await $(`truncate --size=0 ${file}`, { sudo: sudoWrite })
        }
      },
    }
  })
