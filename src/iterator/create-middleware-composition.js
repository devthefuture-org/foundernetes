const composeReducer = require("~/utils/compose-reducer")

module.exports = (key, middlewares) => {
  const composers = middlewares.map(
    (middleware) =>
      (...args) =>
        middleware(key, args)
  )
  return composeReducer(...composers)
}
