const async = require("async")
const nctx = require("nctx")

const collectionSimpleMethods = [
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

const collectionLimitMethods = [
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

const collectionReducerMethods = ["reduce", "reduceRight", "transform"]

const asyncCollCtx = require("./async-coll-ctx")

const foundernetesCollectionMethods = Object.entries(async).reduce(
  (acc, [methodName, func]) => {
    let method = func

    let inCollectionMethods
    const inCollectionSimpleMethods =
      collectionSimpleMethods.includes(methodName)
    if (inCollectionSimpleMethods) {
      inCollectionMethods = true
    } else {
      const inCollectionLimitMethods =
        collectionLimitMethods.includes(methodName)
      if (inCollectionLimitMethods) {
        inCollectionMethods = true
      } else {
        const inCollectionReducerMethods =
          collectionReducerMethods.includes(methodName)
        if (inCollectionReducerMethods) {
          inCollectionMethods = true
        }
      }
    }

    if (inCollectionMethods) {
      let iterateeIndex
      if (collectionSimpleMethods) {
        iterateeIndex = 0
      } else {
        iterateeIndex = 1
      }
      method = async (coll, ...args) =>
        nctx.fork(async () => {
          asyncCollCtx.set("coll", coll)
          const iteratee = args[iterateeIndex]
          args[iterateeIndex] = async.ensureAsync(async (...iterateeArgs) => {
            const asyncCollMiddlewares = asyncCollCtx.get("middlewares") || []
            for (const middleware of asyncCollMiddlewares) {
              if (middleware.iteration) {
                await middleware.iteration(...iterateeArgs)
              }
            }
            return iteratee(...iterateeArgs)
          })
          return func(coll, ...args)
        }, [asyncCollCtx])
    }

    acc[methodName] = method
    return acc
  }
)

module.exports = {
  ...async,
  ...foundernetesCollectionMethods,
}
