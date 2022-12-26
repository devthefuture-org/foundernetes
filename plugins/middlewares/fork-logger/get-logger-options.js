const ctx = require("~/ctx")

module.exports = () => {
  const indentation = ctx.require("indentation")
  return { indentation: indentation * 2 }
}
