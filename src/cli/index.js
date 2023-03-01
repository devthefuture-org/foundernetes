const ctx = require("~/ctx")
const createProgram = require("./program")

const addCommands = [require("./commands/play"), require("./commands/init")]

module.exports = async (args = process.argv, staticDefinitions = {}) => {
  ctx.provide()
  ctx.set("staticDefinitions", staticDefinitions)
  const program = createProgram()
  addCommands.forEach((addCommand) => addCommand(program))
  return program.parseAsync(args)
}
