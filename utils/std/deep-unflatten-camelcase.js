const deepUnflatten = require("./deep-unflatten")

module.exports = (obj) =>
  deepUnflatten(obj, (key) =>
    key.replace(/([A-Z])/g, ($1) => `.${$1.toLowerCase()}`)
  )
