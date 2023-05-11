const createContextPlaybook = require("./create-context-playbook")

module.exports = async (definition) => {
  const { playbook } = definition
  return createContextPlaybook(definition, playbook)
}
