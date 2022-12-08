module.exports =
  (create) =>
  (definition) =>
  async (override = {}) => {
    if (typeof override === "function") {
      override = await override(override)
    }
    if (typeof definition === "function") {
      definition = await definition(override)
    }
    return create({ ...definition, ...override })
  }
