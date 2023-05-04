const path = require("path")

const fs = require("fs-extra")
const ctx = require("@foundernetes/ctx")
const { async } = require("@foundernetes/blueprint")

const omit = require("lodash.omit")
const { render } = require("@foundernetes/eta")
const removeExtname = require("@foundernetes/std/remove-extname")

module.exports = async ({ plays }) => {
  return async (vars) => {
    const {
      source,
      target,
      template = true,
      templateVars = {},
      templateVarsByGroup = {},
      filterHiddenFiles = true,
      sudo,
      sudoRead,
      sudoWrite,
      mode,
      validateFile,
    } = vars

    const ensureFileOptions = omit(vars, [
      "source",
      "target",
      "template",
      "templateVars",
      "templateVarsByGroup",
      "filterHiddenFiles",
      "removeUnlistedFiles",
      "removeUnlistedFilesMatch",
      "rename",
      "convention",
      "sudo",
      "sudoRead",
      "sudoWrite",
    ])

    let {
      removeUnlistedFiles = false,
      removeUnlistedFilesMatch = ["*"],
      rename = false,
      convention = false,
    } = vars
    if (convention) {
      if (convention === true) {
        convention = "f8n-"
      }
      if (vars.removeUnlistedFiles === undefined) {
        removeUnlistedFiles = true
      }
      if (vars.removeUnlistedFilesMatch === undefined) {
        removeUnlistedFilesMatch = (filename) =>
          path.basename(filename).startsWith(convention)
      }
      if (vars.rename === undefined) {
        rename = (filename) =>
          path.join(
            path.dirname(filename),
            `${convention}${path.basename(filename)}`
          )
      }
    }

    const iterator = ctx.require("iterator")

    const renameFile = async (filename) => {
      if (typeof rename === "function") {
        return rename(filename)
      }
      if (typeof rename === "string") {
        return render(rename, { filename })
      }
      return filename
    }

    let files = []
    if (await fs.pathExists(source)) {
      files = await fs.readdir(source)
      if (filterHiddenFiles) {
        files = files.filter((file) => !file.startsWith("."))
      }
    }

    if (removeUnlistedFiles) {
      await plays.std.ensureDir({
        dir: target,
        files: await async.mapSeries(files, renameFile),
        sudo,
        sudoRead,
        sudoWrite,
        include: removeUnlistedFilesMatch,
      })
    }

    await iterator.each(files, async (file) => {
      const variables = {
        confDir: { prefix: convention || "" },
        ...templateVars,
        ...(templateVarsByGroup[removeExtname(file)] || {}),
      }

      const dest = await renameFile(file)

      const destFile = path.join(target, dest)

      await plays.std.ensureFile({
        file: destFile,
        contentFile: path.join(source, file),
        template,
        templateVars: variables,
        sudo,
        sudoRead,
        sudoWrite,
        validateFile,
        ...ensureFileOptions,
      })

      if (mode) {
        await plays.std.chmod({
          file: destFile,
          mode,
          sudo,
          sudoRead,
          sudoWrite,
        })
      }
    })
  }
}
