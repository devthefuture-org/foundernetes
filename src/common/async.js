const async = require("async")
const nctx = require("nctx")

const composeMutable = require("~/utils/compose-mutable")

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

const asyncLoopCtx = require("./async-coll-ctx")

const nullFunc = async () => {}

const createMiddlewareComposition = (key) => {
  const asyncCollMiddlewares = asyncLoopCtx.get("middlewares") || []
  const middlewares = asyncCollMiddlewares.filter(
    (middleware) => typeof middleware[key] === "function"
  )
  if (middlewares.length === 0) {
    middlewares.push({ [key]: nullFunc })
  }
  const composers = middlewares.map((middleware) => middleware[key])
  return composeMutable(...composers)
}

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
      let iteratorIndex
      if (collectionSimpleMethods) {
        iteratorIndex = 0
      } else {
        iteratorIndex = 1
      }
      method = async (coll, ...args) => {
        const collectionFunc = async (...collectionArgs) => {
          const collectionComposition =
            createMiddlewareComposition("collection")
          const collection = await collectionComposition(...collectionArgs)
          if (collection !== undefined) {
            collectionArgs[0] = collection
          }
          return func(...collectionArgs)
        }

        return nctx.fork(async () => {
          // asyncLoopCtx.set("item", coll)
          const iterationComposition = createMiddlewareComposition("iteration")

          const iterator = args[iteratorIndex]
          args[iteratorIndex] = async.ensureAsync(async (...iteratorArgs) => {
            const item = await iterationComposition(...iteratorArgs)
            if (item !== undefined) {
              iteratorArgs[0] = item
            }
            // console.log("iteratorArgs", iteratorArgs)
            const result = await iterator(...iteratorArgs)
            // console.log("result", result)
            return result
          })

          return collectionFunc(coll, ...args)
        }, [asyncLoopCtx])
      }
    }

    acc[methodName] = method
    return acc
  }
)

module.exports = {
  ...async,
  ...foundernetesCollectionMethods,
}
