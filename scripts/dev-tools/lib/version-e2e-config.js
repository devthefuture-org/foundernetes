module.exports = {
  common: {
    paths: ["./"],
    recursive: true,
    silent: false,
    exclude: "*.md,node_modules",
  },
  replacers: [
    {
      regex: "devthejo/foundernetes(.*)(:|@)([a-zA-Z0-9-.]+)",
      replacementFactory: (version) => `devthejo/foundernetes$1$2${version}`,
    },
  ],
}
