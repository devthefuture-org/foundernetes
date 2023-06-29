const ctx = require("@foundernetes/ctx")
const createProgram = require("./program")

const addCommands = {
  playbook: require("./commands/playbook"),
  play: require("./commands/play"),
  loader: require("./commands/loader"),
  init: require("./commands/init"),
  snippet: require("./commands/snippet"),
}

module.exports = async (args = process.argv, projectConfig = {}) => {
  return ctx.provide(async () => {
    ctx.set("projectConfig", projectConfig)

    const program = await createProgram(projectConfig)
    const { cliPlugins = [] } = projectConfig
    for (const cliPlugin of cliPlugins) {
      if (cliPlugin.program) {
        await cliPlugin.program(program)
      }
    }

    const { customProgram = {} } = projectConfig
    const { enabledCommands = null } = customProgram

    for (const [commandName, addCommand] of Object.entries(addCommands)) {
      if (enabledCommands && !enabledCommands.includes(commandName)) {
        continue
      }
      const command = await addCommand(program, projectConfig)
      // const commandName = command.name()

      for (const cliPlugin of cliPlugins) {
        if (cliPlugin.commands?.[commandName]) {
          await cliPlugin.commands[commandName](command, addCommand, program)
        }
      }
    }
    return program.parseAsync(args)
  })
}
