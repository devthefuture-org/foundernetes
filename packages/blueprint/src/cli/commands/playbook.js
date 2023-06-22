const playbook = require("~/playbook")

const options = require("../options")

const action = async (targets, opts, _command) => {
  try {
    await playbook(opts, targets)
  } catch (err) {
    if (err === "") {
      return
    }
    throw err
  }
}

module.exports = (program, projectConfig) =>
  program
    .command("playbook", {
      isDefault: projectConfig.defaultCommand === "playbook",
    })
    .description("run playbooks")
    .addOption(options.cwd)
    .addOption(options.gracefullShutdownTimeout)
    .addOption(options.defaultPlayRetry)
    .addOption(options.tags)
    .addOption(options.skipTags)
    .option("--parallel, -p", "run playbooks in parallel")
    .argument("[target...]", "playbook name or playbook tags")
    .action(action)

module.exports.action = action
