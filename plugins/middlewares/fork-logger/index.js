const ctx = require("~/ctx")

const playbook = require("./playbook")
const play = require("./play")
const loader = require("./loader")
const collection = require("./collection")
const iteration = require("./iteration")

const handlers = {
  playbook,
  play,
  loader,
  collection,
  iteration,
}

module.exports = () => ({
  hook: async (mixed, pluginType) => {
    ctx.replace("indentation", (indent = -1) => ++indent)
    if (handlers[pluginType]) {
      await handlers[pluginType](mixed)
    }
  },
})
