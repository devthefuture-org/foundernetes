function callsites() {
  const _prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_, stack) => stack
  const stack = new Error().stack.slice(1)
  Error.prepareStackTrace = _prepareStackTrace
  return stack
}

function getCaller({ depth = 0 } = {}) {
  const callers = []
  const callerFileSet = new Set()

  for (const callsite of callsites()) {
    const fileName = callsite.getFileName()
    const hasReceiver = callsite.getTypeName() !== null && fileName !== null

    if (!callerFileSet.has(fileName)) {
      callerFileSet.add(fileName)
      callers.unshift(callsite)
    }

    if (hasReceiver) {
      return callers[depth]
    }
  }
}

module.exports = () => {
  const caller = getCaller()
  return caller.getFileName()
}
