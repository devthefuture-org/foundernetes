const { createComposer } = require("@foundernetes/blueprint")

const Deferred = require("@foundernetes/std/deferred")

module.exports = async ({ children }) => {
  const dependenciesReadyMap = {}

  return createComposer(async (vars) => {
    const { installers } = children

    const { installer } = vars

    const installerPlay = installers[installer]

    if (!installerPlay) {
      throw new Error(
        `unhandled installer "${installer}", knowns: "${Object.keys(
          installers
        ).join('","')}"`
      )
    }

    const { name } = vars
    if (!dependenciesReadyMap[name]) {
      dependenciesReadyMap[name] = new Deferred()
    }
    let { needs } = vars
    if (needs) {
      if (!Array.isArray(needs)) {
        needs = [needs]
      }
      for (const dep of needs) {
        if (!dependenciesReadyMap[dep]) {
          dependenciesReadyMap[dep] = new Deferred()
        }
      }
      await Promise.all(needs.map((dep) => dependenciesReadyMap[dep].promise))
    }

    const result = await installerPlay({ ...vars, ...(vars[installer] || {}) })

    dependenciesReadyMap[name].resolve(result)

    return result
  })
}

Object.assign(module.exports, {
  installers: require("./installers"),
})
