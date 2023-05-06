const { createPlay, $, async } = require("@foundernetes/blueprint")
const matchCondition = require("@foundernetes/match/condition")
const execFileExists = require("~/lib/exec-file-exists")

module.exports = async () => {
  const loadLines = async ({ file, sudo, sudoRead = sudo }) => {
    const { stdout: actualContent } = await $(`cat ${file}`, {
      sudo: sudoRead,
      logStdout: false,
      stripFinalNewline: false,
    })
    const lines = actualContent.split("\n")
    return lines
  }

  return createPlay(async (vars) => {
    const { normalizer = (line) => line, find, listSeparator = " " } = vars

    let { line } = vars
    if (Array.isArray(line)) {
      line = line.join(listSeparator)
    }
    line = await normalizer(line)
    if (Array.isArray(line)) {
      line = line.join(listSeparator)
    }
    const lineMatch = async (l) => {
      l = await normalizer(l)
      return matchCondition(l, find || line, {
        defaultKey: find ? "match" : "equal",
      })
    }
    const lineEqual = async (l) => {
      let replaceLine = typeof line === "function" ? await line(l) : line
      if (Array.isArray(replaceLine)) {
        replaceLine = replaceLine.join(listSeparator)
      }
      return replaceLine === l
    }

    return {
      defaultTags: ["*"],
      // itemName: ({ file, content }) => `${file}~=${content}`,
      async check() {
        const {
          all = true,
          create = true,
          remove = false,
          sudo,
          sudoRead = sudo,
        } = vars

        const fileExists = await execFileExists(vars.file, { sudo: sudoRead })
        if (!fileExists) {
          if (remove) {
            return true
          }
          return false
        }

        const lines = await loadLines(vars)

        let present
        let equal
        if (all) {
          const matchLines = await async.filterSeries(lines, lineMatch)
          present = matchLines.length > 0
          equal = await async.every(matchLines, lineEqual)
        } else {
          const matchLine = await async.detectSeries(lines, lineMatch)
          present = !!matchLine
          equal = await lineEqual(matchLine)
        }

        if (present) {
          if (remove) {
            return false
          }
          if (!equal) {
            return false
          }
          return true
        }
        if (remove) {
          return true
        }
        if (create) {
          return false
        }
        return true
      },
      async run() {
        const {
          file,
          all = true,
          sudo = false,
          sudoWrite = sudo,
          sudoRead = sudo,
          addLineOnTop = false,
          lineBeforeOnAdd = true,
          lineAfterOnAdd = true,
          remove = false,
          create = true,
          commentFound = false,
          commentFoundStartChar = "#",
          commentFoundEndChar = "",
          createFile = true,
        } = vars

        const fileExists = await execFileExists(file, { sudo: sudoRead })
        if (!fileExists && !createFile) {
          return false
        }

        const lines = fileExists ? await loadLines(vars) : []

        const foundIndexes = []
        if (all) {
          const foundLines = await async.filterOfSeries(lines, lineMatch)

          if (commentFound) {
            for (const [foundLine, index] of foundLines) {
              lines[
                index
              ] = `${commentFoundStartChar}${foundLine}${commentFoundEndChar}`
            }
          } else {
            const indexes = foundLines.map(([_, index]) => index)
            foundIndexes.push(...indexes)
          }
        } else {
          const found = await async.detectOfSeries(lines, lineMatch)
          if (found) {
            const [foundLine, index] = found
            if (commentFound) {
              lines[
                index
              ] = `${commentFoundStartChar}${foundLine}${commentFoundEndChar}`
            } else {
              foundIndexes.push(index)
            }
          }
        }

        for (const index of foundIndexes) {
          if (remove) {
            delete lines[index]
          } else {
            const l = typeof line === "function" ? line(lines[index]) : line
            lines[index] = l
          }
        }

        if (foundIndexes.length === 0 && create) {
          const l = typeof line === "function" ? line() : line
          if (addLineOnTop) {
            if (lineBeforeOnAdd) {
              lines.unshift("")
            }
            lines.unshift(l)
            if (lineAfterOnAdd) {
              lines.unshift("")
            }
          } else {
            if (lineBeforeOnAdd) {
              lines.push("")
            }
            lines.push(l)
            if (lineAfterOnAdd) {
              lines.push("")
            }
          }
        }

        const newContent = lines.join("\n")

        if (newContent.length > 0) {
          await $(`tee ${file}`, {
            sudo: sudoWrite,
            input: newContent,
            logStdout: false,
          })
        } else {
          await $(`truncate --size=0 ${file}`, { sudo: sudoWrite })
        }
      },
    }
  })
}
