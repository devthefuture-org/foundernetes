const { createComposer } = require("@foundernetes/blueprint")
const ctx = require("@foundernetes/ctx")

module.exports = async ({ plays, children }) =>
  createComposer(async (vars = {}) => {
    const { list = [], clean = false } = vars

    const iterator = ctx.require("iterator")
    await iterator.eachSeries(
      list,
      async (line) => {
        const [modname] = line.split(/\s+/)
        return children.modprobe(modname)
      },
      "modprobe"
    )

    if (clean) {
      await plays.std.ensureFile(
        {
          file: "/etc/modules",
          content: list.join("\n"),
          sudoWrite: true,
        },
        { tags: ["kernel", "modules"] }
      )
    } else {
      const configMap = {}
      for (const line of list) {
        const [modname, ...modopts] = line.split(/\s+/)
        configMap[modname] = modopts.join(" ")
      }
      await plays.std.configFile(
        {
          configMap,
          separator: " ",
          quote: "",
          commentStartChar: "#",
          file: "/etc/modules",
          sudoWrite: true,
        },
        { tags: ["kernel", "modules"] }
      )
    }
  })

Object.assign(module.exports, {
  modprobe: require("./modprobe"),
})
