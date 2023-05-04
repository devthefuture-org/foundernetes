const yaml = require("yaml")

const defaultSchema = { schema: "yaml-1.1" }

const loadObject = (input, schema = defaultSchema) =>
  yaml.parse(input.toString(), schema)

const detect = (input) => {
  if (input.trimStart().slice(0, 1) === "[") {
    return "array"
  }
  const lines = input.split("\n").filter((line) => line.trim().startsWith("#"))
  return lines.some((line) => line.startsWith("---")) ? "array" : "object"
}

const load = (input, schema = defaultSchema, { isArray } = {}) => {
  if (isArray === undefined) {
    isArray = detect(input) === "array"
  }
  return isArray ? yaml.loadAll(input, schema) : loadObject(input, schema)
}

const dump = (input, schema) => yaml.stringify(input, schema)

const dumpAll = (manifests) =>
  manifests.map((manifest) => dump(manifest)).join("---\n")

const loadAll = (input, schema = defaultSchema) => {
  if (input.trimStart().slice(0, 1) === "[") {
    const obj = loadObject(`arr: ${input}`, schema)
    return obj.arr
  }

  const documents = []

  const append = (arr) => {
    const doc = arr.join("\n").trim()
    if (doc.length > 0) {
      const obj = loadObject(doc, schema)
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

const loadValue = (input, schema = defaultSchema) => {
  if (input.includes("\n")) {
    input = `value: |
${input
  .split("\n")
  .map((line) => `  ${line}`)
  .join("\n")}`
  } else {
    input = `value: ${input}`
  }
  const data = load(input, schema)
  return data.value
}

module.exports = {
  parse: yaml.parse,
  load,
  loadObject,
  loadAll,
  loadValue,
  dump,
  dumpAll,
  detect,
  defaultSchema,
}
