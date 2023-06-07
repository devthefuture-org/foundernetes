const { createPlay, $ } = require("@foundernetes/blueprint")
const isEqual = require("lodash/isEqual")
const loadLines = require("./utils/load-lines")

module.exports = async () => {
  return createPlay(async (vars) => {
    const {
      file,
      startLine = "### FOUNDERNETES-START ###",
      endLine = "### FOUNDERNETES-END ###",
    } = vars
    let { lines = [] } = vars
    if (!Array.isArray(lines)) {
      lines = lines.split("\n")
    }

    return {
      defaultTags: ["*"],
      async check() {
        const allLines = await loadLines(vars)
        const startLineIndex = allLines.indexOf(startLine)
        const endLineIndex = allLines.indexOf(endLine)
        if (startLineIndex === -1) {
          return false
        }
        if (endLineIndex === -1) {
          return false
        }
        const currentLines = allLines.slice(startLineIndex + 1, endLineIndex)
        return isEqual(currentLines, lines)
      },
      async run() {
        const allLines = await loadLines(vars)
        const startLineIndex = allLines.indexOf(startLine)
        const endLineIndex = allLines.indexOf(endLine)
        if (startLineIndex === -1 || endLineIndex === -1) {
          if (startLineIndex !== -1) {
            allLines.splice(startLineIndex, 1)
          }
          if (endLineIndex !== -1) {
            allLines.splice(endLineIndex, 1)
          }
          allLines.push(startLine, ...lines, endLine)
        } else {
          allLines.splice(
            startLineIndex + 1,
            endLineIndex - startLineIndex - 1,
            ...lines
          )
        }

        const newContent = allLines.join("\n")

        const { sudo, sudoWrite = sudo } = vars
        await $(`tee ${file}`, {
          sudo: sudoWrite,
          input: newContent,
          logStdout: false,
        })
      },
    }
  })
}
