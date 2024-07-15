module.exports = {
  globals: {
    request: true,
    print: true,
    allow: true,
    atob: true,
    btoa: true,
    create: true,
    deny: true,
    env: true,
    exit: true,
    fetchSync: true,
    get: true,
    import: true,
    list: true,
    mutate: true,
    readFileSync: true,
    remove: true,
    requeue: true,
    sleep: true,
    update: true,
    warn: true,
  },
  rules: {
    "no-restricted-globals": [0],
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["**/*"],
        optionalDependencies: false,
        peerDependencies: false,
      },
    ],
  },
}