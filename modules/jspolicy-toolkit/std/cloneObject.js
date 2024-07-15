module.exports = function cloneObject(o) {
  return JSON.parse(JSON.stringify(o))
}
