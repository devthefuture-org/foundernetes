const ctx = require("@foundernetes/ctx")

module.exports = async ({ mod }) => {
  return async (vars) => {
    const {
      configMap,
      separator = " ",
      quote = "",
      lineStartChar = "",
      lineEndChar = "",
      ...lineInFileOptions
    } = vars
    const configLines = Object.entries(configMap).map(([key, value]) => ({
      find: `${lineStartChar}${key}${separator}*`,
      line: `${lineStartChar}${key}${separator}${quote}${value}${quote}${lineEndChar}`,
      all: false,
    }))
    const iterator = ctx.require("iterator")
    await iterator.eachSeries(
      configLines,
      async (configLine) =>
        mod.lineInFile({
          ...configLine,
          ...lineInFileOptions,
        }),
      "config-file"
    )
  }
}
