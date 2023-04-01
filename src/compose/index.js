const treeFactory = require("~/lib/tree-factory")

const treesToFactories = (composition) => {
  const { loadersTree, playsTree, conditionsTree } = composition

  let { loadersFactory, playsFactory, conditionsFactory } = composition

  if (!loadersFactory && loadersTree) {
    const { loadersTreeOptions = {}, loadersTreeParams = {} } = composition
    loadersFactory = treeFactory(
      "loaders",
      loadersTree,
      loadersTreeParams,
      loadersTreeOptions
    )
  }
  if (!playsFactory && playsTree) {
    const { playsTreeOptions = {}, playsTreeParams = {} } = composition
    playsFactory = treeFactory(
      "plays",
      playsTree,
      playsTreeParams,
      playsTreeOptions
    )
  }
  if (!conditionsFactory && conditionsTree) {
    const { conditionsTreeOptions = {}, conditionsTreeParams = {} } =
      composition
    conditionsFactory = treeFactory(
      "conditions",
      conditionsTree,
      conditionsTreeParams,
      conditionsTreeOptions
    )
  }
  return { loadersFactory, playsFactory, conditionsFactory }
}

module.exports = async (composition = {}) => {
  const { loadersFactory, playsFactory, conditionsFactory } =
    treesToFactories(composition)

  const factories = {
    loaders: loadersFactory.factories,
    plays: playsFactory.factories,
    conditions: playsFactory.factories,
  }

  const loaders = await loadersFactory({
    factories,
  })

  const plays = await playsFactory({
    loaders,
    factories,
  })

  const conditions = await conditionsFactory({
    loaders,
    factories,
  })

  return { loaders, plays, conditions }
}
