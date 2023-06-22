const defaultRequireMap = {
  "@foundernetes/async": () => require("@foundernetes/async"),
  "@foundernetes/ctx": () => require("@foundernetes/ctx"),
  "@foundernetes/dbug": () => require("@foundernetes/dbug"),
  "@foundernetes/execa": () => require("@foundernetes/execa"),
  "@foundernetes/std": () => require("@foundernetes/std"),
}
module.exports = (requireMap = {}) => {
  const reqMap = { ...defaultRequireMap, ...requireMap }
  return (dep) => {
    return reqMap[dep]()
  }
}
