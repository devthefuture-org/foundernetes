const ctx = require("@foundernetes/ctx")
const createProgram = require("./program")

const addCommands = [
  require("./commands/playbook"),
  require("./commands/play"),
  require("./commands/loader"),
  require("./commands/init"),
]

module.exports = async (args = process.argv, projectConfig = {}) => {
  return ctx.provide(async () => {
    ctx.set("projectConfig", projectConfig)

    const program = await createProgram(projectConfig)
    const { cliPlugins } = projectConfig
    for (const cliPlugin of cliPlugins) {
      if (cliPlugin.program) {
        await cliPlugin.program(program)
      }
    }

    for (const addCommand of addCommands) {
      const command = await addCommand(program, projectConfig)

      for (const cliPlugin of cliPlugins) {
        const commandName = command.name()
        if (cliPlugin.commands?.[commandName]) {
          await cliPlugin.commands[commandName](command, addCommand)
        }
      }
    }
    return program.parseAsync(args)
  })
}
