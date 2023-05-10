const path = require("path")

const fs = require("fs-extra")

const { createLoader } = require("@foundernetes/blueprint")

const matchCondition = require("@foundernetes/match/condition")

module.exports = async ({
  loaders,
  default: fallback,
  dir: defaultDir = "",
  autoDiscoverDir: defaultAutoDiscoverDir = true,
}) =>
  createLoader({
    // retry: 3,
    load: async (vars) => {
      const { file = fallback } = vars
      let localFiles =
        file && (await fs.pathExists(file))
          ? await loaders.std.yaml({ file })
          : []

      let { dir = defaultDir } = vars
      if (dir[0] !== "/") {
        dir = path.join(process.cwd(), dir)
      }

      const { autoDiscoverDir = defaultAutoDiscoverDir } = vars

      if (autoDiscoverDir && (await fs.pathExists(dir))) {
        const files = await fs.readdir(dir)
        localFiles.push(...files.map((dest) => ({ dest, link: "*/${{dest}}" })))
      }

      const { defaultVars } = vars
      localFiles = await loaders.std.eta({
        data: localFiles,
        defaultVars,
        selfRef: true,
        unflatCamelcase: true,
      })

      const { data } = vars
      for (const pkg of Object.values(data)) {
        const foundLink = localFiles.find((localFile) => {
          const f = pkg.file || pkg.download?.url
          if (!f) {
            return false
          }
          return matchCondition(f, localFile.link, {
            defaultKey: "match",
          })
        })
        if (foundLink) {
          let { dest } = foundLink
          if (dest[0] !== "/") {
            dest = path.join(dir, dest)
          }
          pkg.file = dest
        }
      }

      return data
    },
  })
