const playbook = require("~/playbook")

const options = require("../options")

module.exports = (program) =>
  program
    .command("play", { isDefault: true })
    .description("run playbooks")
    .addOption(options.cwd)
    .addOption(options.gracefullShutdownTimeout)
    .addOption(options.defaultPlayRetry)
    .option("--parallel, -p", "run playbooks in parallel")
    .argument("[target...]", "playbook name or tags")
    .action(async (targets, opts, _command) => {
      try {
        await playbook(opts, targets)
      } catch (err) {
        if (err === "") {
          return
        }
        throw err
      }
    })
