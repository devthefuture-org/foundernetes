module.exports = (str) => {
  const [integer] = str.match(/\d+/g)
  return [parseInt(integer, 10), str.slice(integer.length)]
}
