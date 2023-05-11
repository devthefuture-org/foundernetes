const ctx = require("@foundernetes/ctx")
const conditions = require("~/std/conditions")
const matchTags = require("~/std/match-tags")
const mergeTags = require("~/std/merge-tags")
const treeName = require("~/tree/name")

module.exports = async (func) => {
  const {
    tags: createTags = [],
    defaultTags: createDefaultTags = [],
    if: createIfConditions = [],
  } = func
  const composer = async (vars = {}, options = {}) =>
    ctx.fork(async () => {
      const { tags: playTags = [] } = options
      const tags = await mergeTags({
        func: composer,
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
            ...(composer.if || []),
            ...(options.if || []),
          ],
          {
            func,
            name: composer.name,
            tags,
            options,
          }
        ))
      ) {
        return
      }
      return func(vars)
    })
  composer.name = treeName(composer)
  return composer
}
