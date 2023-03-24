const async = require("~/lib/async")

const runContextCommand = require("~/process/run-context-command")

module.exports = async (options, targets = []) => {
  const callback = async (playbooks) => {
    const parallel = options.P
    const method = parallel ? async.parallel : async.series
    await method(playbooks)
  }

  await runContextCommand({
    targets,
    callback,
  })
}
