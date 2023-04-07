function callsites() {
  const _prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_, stack) => stack
  const { stack } = new Error()
  Error.prepareStackTrace = _prepareStackTrace
  return stack
}

function getStackTrace() {
  const stack = callsites()
    .map((callsite) => {
      const fileName = callsite.getFileName()
      const lineNumber = callsite.getLineNumber()
      const columnNumber = callsite.getColumnNumber()
      const functionName = callsite.getFunctionName()
      const typeName = callsite.getTypeName()
      const methodName = callsite.getMethodName()
      return {
        fileName,
        lineNumber,
        columnNumber,
        functionName,
        typeName,
        methodName,
      }
    })
    .filter(({ fileName }) => fileName && fileName !== __filename)

  const stackTrace = stack.map((step) => {
    const {
      fileName,
      lineNumber,
      columnNumber,
      functionName,
      typeName,
      methodName,
    } = step
    let funcName = ""
    if (typeName) {
      funcName += `${typeName}`
    }
    if (methodName) {
      funcName += `.${methodName}`
    }
    if (functionName && functionName !== methodName) {
      funcName += `${functionName}`
    }
    if (funcName) {
      funcName = ` (${funcName})`
    }
    const display = `${fileName}:${lineNumber}:${columnNumber}${funcName}`
    return display
  })
  return stackTrace.reverse()
}

const create = () => {
  const dbug = (...args) => {
    if (args.length === 1) {
      ;[args] = args
    }
    const trace = getStackTrace()
    const source = trace[trace.length - 1]
    console.dir({ source, var: args, trace }, dbug.inspectOptions)
    return dbug
  }

  // https://nodejs.org/api/util.html#utilinspectobject-options
  dbug.inspectOptions = { depth: Infinity, maxArrayLength: null }

  dbug.here = () => {
    const stackTrace = getStackTrace()
    console.dir(stackTrace)
    return dbug
  }

  dbug.hr = () => {
    const stackTrace = getStackTrace()
    const source = stackTrace[stackTrace.length - 1]
    console.dir(source)
    return dbug
  }
  dbug.h = dbug.hr

  dbug.nvar = (f) => {
    const varName = f.toString().replace(/[ |()=>]/g, "")
    const varValue = f()
    process.stdout.write(`${varName}: `)
    console.dir(varValue, dbug.inspectOptions)
    return dbug
  }
  dbug.nv = dbug.nvar

  dbug.var = (...args) => {
    if (args.length === 1) {
      ;[args] = args
    }
    console.dir(args, dbug.inspectOptions)
    return dbug
  }
  dbug.v = dbug.var

  dbug.kill = (exitCode = 0) => {
    process.exit(exitCode)
  }
  dbug.k = dbug.kill

  dbug.create = create

  dbug.registerGlobal = () => {
    global.dbug = dbug
    return dbug
  }

  return dbug
}

const dbug = create()

module.exports = dbug
