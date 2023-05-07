const path = require("path")
const fs = require("fs-extra")

const { createComposer } = require("@foundernetes/blueprint")
const listFilesRecursive = require("@foundernetes/std/list-files-recursive")
const ctx = require("~/ctx")

module.exports = async ({ mod }) => {
  return createComposer(async ({ ...vars }) => {
    let { target: targetMain } = vars
    let { source: sourceMain } = vars

    if (targetMain === undefined || targetMain === null) {
      if (!sourceMain.startsWith("/")) {
        targetMain = sourceMain
      } else {
        targetMain = "."
      }
      vars.target = targetMain
    }

    sourceMain = path.resolve(sourceMain)

    const isDirMain = (await fs.stat(sourceMain)).isDirectory()
    if (sourceMain && isDirMain) {
      await mod.uploadDir(vars)
    } else {
      await mod.uploadFile(vars)
    }

    const {
      uid: uidMain,
      gid: gidMain,
      mode: modeMain,
      uidRecursive = false,
      gidRecursive = false,
      modeRecursive = false,
      uidFromLocal = false,
      gidFromLocal = false,
      modeFromLocal = !modeRecursive,
      uidMap = {},
      gidMap = {},
      modeMap = {},
    } = vars

    if (uidRecursive && uidFromLocal) {
      throw new Error("Cannot use both uidRecursive and uidFromLocal")
    }
    if (gidRecursive && gidFromLocal) {
      throw new Error("Cannot use both gidRecursive and gidFromLocal")
    }
    if (vars.uid === undefined && uidRecursive) {
      throw new Error("Cannot use uidRecursive without uid")
    }
    if (vars.gid === undefined && gidRecursive) {
      throw new Error("Cannot use gidRecursive without gid")
    }

    const files = isDirMain
      ? await listFilesRecursive(sourceMain, true)
      : [sourceMain]

    const iterator = ctx.getIterator()

    const relativeFiles = files.map((file) => file.slice(sourceMain.length + 1))

    await iterator.eachSeries(relativeFiles, async (file) => {
      const targetFile = file ? `${targetMain}/${file}` : targetMain
      const sourceFile = file ? `${sourceMain}/${file}` : sourceMain

      let stat

      let uid
      if (uidMap[file]) {
        uid = uidMap[file]
      } else if (uidMain && uidRecursive) {
        uid = uidMain
      } else if (uidFromLocal) {
        stat = stat || (await fs.stat(sourceFile))
        uid = stat.uid
      }

      let gid
      if (gidMap[file]) {
        gid = gidMap[file]
      } else if (gidMain && gidRecursive) {
        gid = gidMain
      } else if (gidFromLocal) {
        stat = stat || (await fs.stat(sourceFile))
        gid = stat.gid
      }

      let mode
      if (modeMap[file]) {
        mode = modeMap[file]
      } else if (modeMain && modeRecursive) {
        mode = modeMain
      } else if (modeFromLocal) {
        stat = stat || (await fs.stat(sourceFile))
        mode = stat.mode.toString(8).slice(-3)
      }

      if (uid !== undefined && uid !== null) {
        await mod.fileUid({ file: targetFile, uid })
      }
      if (gid !== undefined && gid !== null) {
        await mod.fileGid({ file: targetFile, gid })
      }
      if (mode !== undefined && mode !== null) {
        await mod.fileMode({ file: targetFile, mode })
      }
    })

    const { delete: deleteUnlisted = true } = vars
    if (isDirMain && deleteUnlisted) {
      const targetFiles = relativeFiles.map((file) => `${targetMain}/${file}`)
      const targetDirs = [
        targetMain,
        ...targetFiles.filter((file) => file.endsWith("/")),
      ]
      await iterator.eachSeries(targetDirs, async (dir) => {
        await mod.deleteUnlisted({ dir, files: targetFiles })
      })
    }
  })
}
