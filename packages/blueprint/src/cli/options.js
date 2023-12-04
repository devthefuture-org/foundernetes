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

module.exports.playbook = new Option(
  "--playbook, -b <playbook>",
  "playbook name or playbook tags"
)

module.exports.payload = new Option(
  "--playload, -i <payload>",
  "json input value or filename or - for stdin (yaml), default to -"
)

module.exports.output = new Option(
  "--output, -o <format>",
  "output format: yaml (default), json"
).choices(["yaml", "json"])

module.exports.dryRun = new Option(
  "--dry-run",
  "don't exec the run function from plays and bypass postCheck"
)

module.exports.breakpoint = new Option(
  "--breakpoint <breakpoint>",
  "specify a breakpoint in the playbook to stop the execution"
)
