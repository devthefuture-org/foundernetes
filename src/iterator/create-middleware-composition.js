const compose = require("~/utils/compose")

module.exports = (key, middlewares) => {
  middlewares = middlewares.filter(
    (middleware) => typeof middleware[key] === "function"
  )
  const composers = middlewares.map((middleware) => middleware[key])
  return compose(...composers)
}
