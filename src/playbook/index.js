const async = require("~/lib/async")

const runContextCommand = require("~/process/run-context-command")
const logPlaybook = require("./log-playbook")

module.exports = async (options, targets = []) => {
  const callback = async (playbooks) => {
    const parallel = options.P

    logPlaybook.startAll(playbooks, { parallel })

    const method = parallel ? async.parallel : async.series
    await method(playbooks)

    logPlaybook.endAll(playbooks)
  }

  await runContextCommand({
    targets,
    callback,
  })
}
