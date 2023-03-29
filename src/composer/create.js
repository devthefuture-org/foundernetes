const matchTags = require("~/std/match-tags")

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
      const tags = [...createTags, ...playTags]
      if (tags.length === 0) {
        tags.push(...createDefaultTags)
      }
      tags.push(...factoryTags)
      if (!matchTags(tags, vars)) {
        return
      }
      return func(vars)
    })
}
