const ctx = require("~/ctx")

const async = require("~/lib/async")

const collectionMethodsList = require("./collection-methods-list")

const {
  simpleMethods: collectionSimpleMethods,
  limitMethods: collectionLimitMethods,
  reducerMethods: collectionReducerMethods,
} = collectionMethodsList

const createMiddlewareComposition = require("./create-middleware-composition")

module.exports = (params = {}) => {
  const iterator = {}

  const collectionMethodNames = [
    ...collectionSimpleMethods,
    ...collectionLimitMethods,
    ...collectionReducerMethods,
  ]

  const collectionMethods = collectionMethodNames.reduce((acc, methodName) => {
    const func = async[methodName]

    const inCollectionSimpleMethods =
      collectionSimpleMethods.includes(methodName)

    let iterateeIndex
    if (inCollectionSimpleMethods) {
      iterateeIndex = 0
    } else {
      iterateeIndex = 1
    }
    const method = async (coll, ...args) => {
      const collectionFunc = async (...collectionArgs) => {
        let collectionName
        if (typeof collectionArgs[collectionArgs.length - 1] === "string") {
          collectionName = collectionArgs.pop()
        }

        ctx.set("collection", {
          collection: collectionArgs[0],
          methodName,
          collectionName,
        })

        const collectionComposition = createMiddlewareComposition(
          "collection",
          iterator.middlewares
        )
        let collection = await collectionComposition(...collectionArgs)
        if (collection === undefined) {
          ;[collection] = collectionArgs
        }
        collectionArgs[0] = collection

        const result = await func(...collectionArgs)
        const abortSignal = ctx.require("abortSignal")
        abortSignal.throwIfAborted()
        return result
      }

      return ctx.fork(async () => {
        const iterationComposition = createMiddlewareComposition(
          "iteration",
          iterator.middlewares
        )

        ctx.set("iteratorSerie", methodName.endsWith("Series"))

        const iteratorCallback = args[iterateeIndex]
        args[iterateeIndex] = async.ensureAsync(async (...iteratorArgs) =>
          ctx.fork(async () => {
            const abortSignal = ctx.require("abortSignal")
            if (abortSignal.aborted) {
              return
            }

            const [, index] = iteratorArgs
            let [item] = iteratorArgs
            ctx.set("iteration", {
              item,
              index,
              methodName,
            })

            item = await iterationComposition(...iteratorArgs)
            if (item === undefined) {
              ;[item] = iteratorArgs
            }
            iteratorArgs[0] = item

            const result = await iteratorCallback(...iteratorArgs)
            return result
          })
        )

        return collectionFunc(coll, ...args)
      })
    }

    acc[methodName] = method
    return acc
  }, {})

  Object.assign(iterator, collectionMethods)

  iterator.middlewares = [...(params.middlewares || [])]
  iterator.use = (...middlewares) => {
    for (let middleware of middlewares) {
      if (!Array.isArray(middleware)) {
        middleware = [middleware]
      }
      iterator.middlewares.push(...middleware)
    }
  }

  return iterator
}
