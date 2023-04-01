const conditions = require("~/std/conditions")
const matchTags = require("~/std/match-tags")
const mergeTags = require("~/std/merge-tags")

const ctx = require("~/ctx")

module.exports = async (func) => {
  const {
    tags: createTags = [],
    factoryTags = [],
    defaultTags: createDefaultTags = [],
    if: createIfConditions = [],
    name,
  } = func
  const composeFunc = async (vars = {}, options = {}) =>
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
      if (
        !(await conditions(
          [
            ...createIfConditions,
            ...(composeFunc.if || []),
            ...(options.if || []),
          ],
          {
            func,
            name,
            tags,
            options,
          }
        ))
      ) {
        return
      }
      return func(vars)
    })
  return composeFunc
}
