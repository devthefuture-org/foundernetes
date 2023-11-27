# @foundernetes/dbug

A simple debug helper to replace tedious console.log, that use the power of native javascript util.inspect.

## install

```sh
yarn add -D @foundernetes/dbug
# or
npm i --save-dev @foundernetes/dbug
```

## usage

index.js
```js
const dbug = require("@foundernetes/dbug")

const main = ()=>{
  const foo = "bar"
  dbug(foo)
}

main()
```

output:
```
{
  source: '/path/to/my-project/index.js:5:3 (main)',
  var: 'bar',
  trace: [
    'node:internal/modules/run_main:81:12 (Function.runMainexecuteUserEntryPoint)',
    'node:internal/modules/cjs/loader:930:12 (Function._loadModule._load)',
    'node:internal/modules/cjs/loader:1089:32 (Module.loadModule.load)',
    'node:internal/modules/cjs/loader:1280:10 (Object..jsModule._extensions..js)',
    'node:internal/modules/cjs/loader:1226:14 (Module._compileModule._compile)',
    '/path/to/my-project/index.js:8:1 (Object)',
    '/path/to/my-project/index.js:5:3 (main)'
  ]
}
```

### features:

- stack trace (asc ordered)
- var name (using nvar)
- pipe calls
- kill
- context file, line, column, function name etc...

### more examples:

#### light debug

```js
dbug.var(foo) // alias: dbug.v(foo)
/* output: 'bar' */
```

#### debug pipe

```js
dbug.var(foo).var(foo2)
```

#### debug and kill

```js
dbug(foo).kill() // alias dbug.k()
```

#### debug with variable name in output

```js
dbug.nvar(() => foo) // alias dbug.nv()
/* output:
foo: 'bar'
*/
```

#### debug point of passage

```js
dbug.hr() // alias dbug.h()
```

#### debug stack at point of passage

```js
dbug.here()
```

#### multi instance

```js
const dbug2 = dbug.create()
```

#### register instance of dbug as global

```js
dbug.registerGlobal()
```

#### change inspectOptions

see https://nodejs.org/api/util.html#utilinspectobject-options

here are the defaults:
```js
dbug.inspectOptions = { depth: Infinity, maxArrayLength: null }
```
