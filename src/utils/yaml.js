const yaml = require("yaml")
const jsYaml = require("js-yaml")

const loadObject = (input, { retroCompat = true } = {}) =>
  retroCompat
    ? yaml.parse(input.toString(), { schema: "yaml-1.1" })
    : jsYaml.load(input)

const detect = (input) => {
  if (input.trimStart().slice(0, 1) === "[") {
    return "array"
  }
  const lines = input.split("\n").filter((line) => line.trim().startsWith("#"))
  return lines.some((line) => line.startsWith("---")) ? "array" : "object"
}

const load = (input, { isArray, retroCompat = true } = {}) => {
  if (isArray === undefined) {
    isArray = detect(input) === "array"
  }
  return isArray
    ? yaml.loadAll(input, { retroCompat })
    : loadObject(input, { retroCompat })
}

// module.exports.dump = (input) => yaml.stringify(input)
const dump = (input) => jsYaml.dump(input)

const dumpAll = (manifests) =>
  manifests.map((manifest) => dump(manifest)).join("---\n")

const loadAll = (input, { retroCompat = true } = {}) => {
  if (input.trimStart().slice(0, 1) === "[") {
    const obj = loadObject(`arr: ${input}`, { retroCompat })
    return obj.arr
  }

  const documents = []

  const append = (arr) => {
    const doc = arr.join("\n").trim()
    if (doc.length > 0) {
      const obj = loadObject(doc, { retroCompat })
      if (obj !== null) {
        documents.push(obj)
      }
    }
  }

  let currentDoc = []
  for (const line of input.split("\n")) {
    if (line.startsWith("---")) {
      append(currentDoc)
      currentDoc = []
    } else {
      currentDoc.push(line)
    }
  }
  append(currentDoc)

  return documents
}

module.exports = {
  parse: yaml.parse,
  load,
  loadObject,
  loadAll,
  dump,
  dumpAll,
  detect,
}
