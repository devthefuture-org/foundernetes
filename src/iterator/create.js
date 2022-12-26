const ctx = require("~/ctx")
const async = require("./async-addons")

const collectionMethodsList = require("./collection-methods-list")

const {
  simpleMethods: collectionSimpleMethods,
  limitMethods: collectionLimitMethods,
  reducerMethods: collectionReducerMethods,
} = collectionMethodsList

const createMiddlewareComposition = require("./create-middleware-composition")

module.exports = (params = {}) => {
  const { middlewares = [] } = params
  const iterator = { middlewares }
  const collectionMethods = Object.entries(async).reduce(
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
            const collectionComposition = createMiddlewareComposition(
              "collection",
              iterator.middlewares
            )
            let collection = await collectionComposition(...collectionArgs)
            if (collection === undefined) {
              ;[collection] = collectionArgs
            }
            collectionArgs[0] = collection

            let collectionName
            if (typeof collectionArgs[collectionArgs.length - 1] === "string") {
              collectionName = collectionArgs.pop()
            }

            const collectionHookParam = {
              collection,
              methodName,
              collectionName,
            }
            for (const middleware of middlewares) {
              if (middleware.hook) {
                await middleware.hook(collectionHookParam, "collection")
              }
            }

            return func(...collectionArgs)
          }

          return ctx.fork(async () => {
            const iterationComposition = createMiddlewareComposition(
              "iteration",
              iterator.middlewares
            )

            const iteratorCallback = args[iteratorIndex]
            args[iteratorIndex] = async.ensureAsync(async (...iteratorArgs) =>
              ctx.fork(async () => {
                let item = await iterationComposition(...iteratorArgs)
                if (item === undefined) {
                  ;[item] = iteratorArgs
                }
                iteratorArgs[0] = item

                const [, index] = iteratorArgs
                const iterationHookParam = {
                  item,
                  index,
                  methodName,
                }
                for (const middleware of middlewares) {
                  if (middleware.hook) {
                    await middleware.hook(iterationHookParam, "iteration")
                  }
                }

                const result = await iteratorCallback(...iteratorArgs)
                return result
              })
            )

            return collectionFunc(coll, ...args)
          })
        }
      }

      acc[methodName] = method
      return acc
    }
  )
  Object.assign(iterator, collectionMethods)
  return iterator
}
