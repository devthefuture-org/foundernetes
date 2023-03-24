const wildstring = require("wildstring")

const ctx = require("~/ctx")

module.exports = (tags) => {
  const config = ctx.require("config")
  const { tags: runTags, skipTags } = config
  const log = ctx.require("logger")
  if (
    runTags &&
    !runTags.some((runTag) =>
      tags.some(
        (t) => wildstring.match(t, runTag) || wildstring.match(runTag, t)
      )
    )
  ) {
    log.debug("tags doesn't match, skipping...")
    return false
  }
  if (
    skipTags &&
    skipTags.some((skipTag) =>
      tags.some(
        (t) => wildstring.match(t, skipTag) || wildstring.match(skipTag, t)
      )
    )
  ) {
    log.debug("tags explicitly skipped, skipping...")
    return false
  }
  return true
}
