const ctx = require("@foundernetes/ctx")

module.exports = () => {
  const indentation = ctx.require("indentation")
  return {
    indentation: indentation * 2,
    indentMultiline: true,
    indentMultilinePadding: true,
  }
}
