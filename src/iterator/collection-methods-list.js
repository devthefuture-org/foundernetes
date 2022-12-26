const limitMethods = [
  "concatLimit",
  "detectLimit",
  "eachLimit",
  "eachOfLimit",
  "everyLimit",
  "filterLimit",
  "filterOfLimit", // addon
  "groupByLimit",
  "mapLimit",
  "mapOfLimit", // addon
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
  "filterOf", // addon
  "filterSeries",
  "filterOfSeries", // addon
  "groupBy",
  "groupBySeries",
  "map",
  "mapOf", // addon
  "mapSeries",
  "mapOfSeries", // addon
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
