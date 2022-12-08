module.exports = (key) => {
  key = key.replace(/^(([\d.]+)-)/, "")
  return key
}
