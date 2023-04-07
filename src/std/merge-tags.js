const treeTags = require("~/tree/tags")

module.exports = async ({
  func,
  createDefaultTags = [],
  createTags = [],
  playTags = [],
}) => {
  let tags

  if (typeof playTags === "function") {
    tags = await playTags(createTags)
  } else {
    // optout-able providing a function at playbook run time
    tags = [...createTags, ...playTags]
  }

  // optout-able providing more than zero tags
  if (tags.length === 0) {
    tags.push(...createDefaultTags)
  }

  // not optout-able, conventioned
  tags.push(...treeTags(func))

  return tags
}
