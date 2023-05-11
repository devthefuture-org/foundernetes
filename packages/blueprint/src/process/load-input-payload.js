const fs = require("fs-extra")
const yaml = require("@foundernetes/std/yaml")

module.exports = async (option) => {
  const inputOption = option || "-"
  const yamlInput =
    inputOption === "-"
      ? await fs.readFile(process.stdin.fd, { encoding: "utf-8" })
      : inputOption.startWith("{")
      ? inputOption
      : await fs.readFile(inputOption, { encoding: "utf-8" })
  const input = yaml.load(yamlInput)
  return input
}
