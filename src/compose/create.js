const matchTags = require("~/std/match-tags")

const ctx = require("~/ctx")

module.exports =
  async (func) =>
  async (vars = {}, options = {}) =>
    ctx.fork(async () => {
      const { tags: playTags = [] } = options
      const tags = [...playTags]
      if (!matchTags(tags, vars)) {
        return
      }
      return func(vars)
    })
