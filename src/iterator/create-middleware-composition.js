const compose = require("~/utils/compose")

module.exports = (key, middlewares) => {
  const composers = middlewares.map(
    (middleware) =>
      (...args) =>
        middleware(key, args)
  )
  return compose(...composers)
}
