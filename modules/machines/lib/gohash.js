const { $ } = require("@foundernetes/blueprint")

module.exports = async (file) => {
  const { stdout } = await $(`gohash ${file}`)
  const [sum] = stdout?.split(" ") || []
  return sum
}
