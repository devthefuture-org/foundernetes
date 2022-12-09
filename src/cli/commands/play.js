const playbook = require("~/playbook")

const options = require("../options")

module.exports = (program) =>
  program
    .command("play")
    .description("run playbooks")
    .addOption(options.cwd)
    .option("--parallel, -p", "run playbooks in parallel")
    .argument("[target...]", "playbook name or tags")
    .action(async (targets, opts, _command) => {
      await playbook(opts, targets)
    })
