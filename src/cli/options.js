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

module.exports.defaultPlayRetry = new Option(
  "--default-play-retry <retry>",
  "default play retry, default 0"
)

module.exports.cwd = new Option("--cwd <path>", "set current working directory")

module.exports.debug = new Option("--debug, -d", "enable debugging loglevel")

module.exports.tags = new Option(
  "--tags, -t <tag...>",
  "plays tags to run, skipping others"
)

module.exports.skipTags = new Option(
  "--skip-tags, -e <tag...>",
  "plays tags to exclude, take precedence on --tags option"
)
