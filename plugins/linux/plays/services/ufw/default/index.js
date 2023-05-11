const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) =>
  createComposer(async (vars) => {
    const { default: defaultVars = {} } = vars
    const { incoming, outgoing, routed } = defaultVars
    await children.incoming({ incoming })
    await children.outgoing({ outgoing })
    await children.routed({ routed })
  })

Object.assign(module.exports, {
  incoming: require("./incoming"),
  outgoing: require("./outgoing"),
  routed: require("./routed"),
})
