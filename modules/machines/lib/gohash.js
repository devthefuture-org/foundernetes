const path = require("path")

const { $ } = require("@foundernetes/blueprint")

const goshashBin = path.join(__dirname, "../bin/gohash")

module.exports = async (file) => {
  const { stdout: localOutput } = await $(`${goshashBin} ${file}`)
  const [sum] = localOutput?.split(" ") || []
  return sum
}
