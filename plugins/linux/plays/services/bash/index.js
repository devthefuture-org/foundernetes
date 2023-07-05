const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) =>
  createComposer(async (_vars = {}) => {
    await children.completionKeyboardSugar()
  })

Object.assign(module.exports, {
  completionKeyboardSugar: require("./completion-keyboard-sugars"),
})
