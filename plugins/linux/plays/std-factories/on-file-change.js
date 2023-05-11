const { createPlay } = require("@foundernetes/blueprint")

module.exports = async ({ loaders, play, getDate, file: defaultFile }) => {
  return createPlay({
    async check(vars) {
      // console.log({ defaultFile })
      const { file = defaultFile, recursive, exclude } = vars
      const date = await getDate(vars)
      const changed = await loaders.std.fileChangedFrom({
        file,
        date,
        recursive,
        exclude,
      })
      return !changed
    },
    ...play,
    tags: [...(play.tags || []), "yolo-composable"],
  })
}
