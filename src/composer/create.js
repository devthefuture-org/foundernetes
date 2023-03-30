const matchTags = require("~/std/match-tags")
const mergeTags = require("~/std/merge-tags")

const ctx = require("~/ctx")

module.exports = async (func) => {
  const {
    tags: createTags = [],
    factoryTags = [],
    defaultTags: createDefaultTags = [],
  } = func
  return async (vars = {}, options = {}) =>
    ctx.fork(async () => {
      const { tags: playTags = [] } = options
      const tags = await mergeTags({
        factoryTags,
        createDefaultTags,
        createTags,
        playTags,
      })
      if (!matchTags(tags, vars)) {
        return
      }
      return func(vars)
    })
}
