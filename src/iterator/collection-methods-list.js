const limitMethods = [
  "concatLimit",
  "detectLimit",
  "eachLimit",
  "eachOfLimit",
  "everyLimit",
  "filterLimit",
  "groupByLimit",
  "mapLimit",
  "mapValuesLimit",
  "rejectLimit",
  "someLimit",
]

const simpleMethods = [
  "concat",
  "concatSeries",
  "detect",
  "detectSeries",
  "each",
  "eachOf",
  "eachOfSeries",
  "eachSeries",
  "every",
  "everySeries",
  "filter",
  "filterSeries",
  "groupBy",
  "groupBySeries",
  "map",
  "mapSeries",
  "mapValues",
  "mapValuesSeries",
  "reject",
  "rejectSeries",
  "some",
  "someSeries",
  "sortBy",
]

const reducerMethods = ["reduce", "reduceRight", "transform"]

module.exports = {
  limitMethods,
  simpleMethods,
  reducerMethods,
}
