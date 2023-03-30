module.exports = (o, callback) =>
  Object.keys(o)
    .sort(callback)
    .reduce((acc, key) => {
      acc[key] = o[key]
      return acc
    }, {})
