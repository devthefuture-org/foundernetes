const matchTags = require("~/std/match-tags")

const ctx = require("~/ctx")

module.exports = async (func) => {
  const {
    tags: createTags = [],
    defaultTags: createDefaultTags = ["*"], // by default compose are not filtered when using tags option
  } = func
  return async (vars = {}, options = {}) =>
    ctx.fork(async () => {
      const { tags: playTags = [] } = options
      const tags = [...createTags, ...playTags]
      if (tags.length === 0) {
        tags.push(...createDefaultTags)
      }
      if (!matchTags(tags, vars)) {
        return
      }
      return func(vars)
    })
}
