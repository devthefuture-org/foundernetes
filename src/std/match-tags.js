const wildstring = require("wildstring")

const ctx = require("~/ctx")

module.exports = (tags, vars) => {
  const config = ctx.require("config")
  const logger = ctx.require("logger")

  const { tags: runTags, skipTags } = config

  tags = tags.map((t) => (typeof t === "function" ? t(vars) : t))

  if (
    runTags &&
    !runTags.some((runTag) =>
      tags.some(
        (t) => wildstring.match(t, runTag) || wildstring.match(runTag, t)
      )
    )
  ) {
    logger.debug("tags doesn't match, skipping...", { tags })
    return false
  }

  if (
    skipTags &&
    skipTags.some((skipTag) => tags.some((t) => wildstring.match(skipTag, t)))
  ) {
    logger.debug("tags explicitly skipped, skipping...", { tags })
    return false
  }

  return true
}
