module.exports = {
  ...require("@foundernetes/linux/plays"),
  onBoot: require("./on-boot"),
  // linux: require("@foundernetes/linux/plays"),
}
