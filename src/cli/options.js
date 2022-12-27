const { Option } = require("commander")

module.exports.configSet = new Option(
  "--config-set <pair...>",
  "update value key or subkey, syntax is --config-set foo.bar=jo, you can call it multiple times"
)

module.exports.inlineConfig = new Option(
  "--inline-config <yaml>",
  "deep override of config"
)

module.exports.gracefullShutdownTimeout = new Option(
  "--gracefull-shutdown-timeout <duration>",
  "gracefull shutdown timeout, default 30s"
)

module.exports.cwd = new Option("--cwd <path>", "set current working directory")

module.exports.debug = new Option("--debug, -d", "enable debugging loglevel")
