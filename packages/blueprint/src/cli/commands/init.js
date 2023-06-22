// const init = require("~/init")

const options = require("../options")

module.exports = (program, projectConfig) =>
  program
    .command("init", { isDefault: projectConfig.defaultCommand === "init" })
    .description("Init project repository with boilerplate")
    .addOption(options.cwd)
    .action(async (_opts, _command) => {
      // await init(opts)
    })
