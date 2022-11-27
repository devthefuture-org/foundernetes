// const play = require("~/play")

const options = require("../options")

module.exports = (program) =>
  program
    .command("play")
    .description("Run the Infra as Code setup")
    .addOption(options.cwd)
    .action(async (_opts, _command) => {
      // await play(opts)
    })
