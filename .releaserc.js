const path = require("path")
const { promisify } = require("util")
const readFileAsync = promisify(require("fs").readFile)

const TEMPLATE_DIR = path.join(
  __dirname,
  "node_modules",
  "semantic-release-gitmoji",
  "lib",
  "assets",
  "templates"
)

// the *.hbs template and partials should be passed as strings of contents
const template = readFileAsync(path.join(TEMPLATE_DIR, "default-template.hbs"))
const commitTemplate = readFileAsync(
  path.join(TEMPLATE_DIR, "commit-template.hbs")
)

module.exports = {
  branches: [
    "master",
    "main",
    "next",
    "next-major",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ],
  plugins: [
    [
      "semantic-release-gitmoji",
      {
        releaseRules: {
          major: [":boom:"],
          minor: [":sparkles:"],
          patch: [":bug:", ":ambulance:", ":lock:"],
        },
        releaseNotes: {
          template,
          partials: { commitTemplate },
          helpers: {
            async datetime(format = "UTC:yyyy-mm-dd") {
              const dateFormat = await import("dateformat")
              return dateFormat(new Date(), format)
            },
          },
          issueResolution: {
            template: "{baseUrl}/{owner}/{repo}/issues/{ref}",
            baseUrl: "https://github.com",
            source: "github.com",
          },
        },
      },
    ],
    "@semantic-release/changelog",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore(release): ${nextRelease.version}",
      },
    ],
    [
      "@semantic-release/exec",
      {
        publishCmd: "yarn version-e2e:commit",
      },
    ],
    [
      "@semantic-release/exec",
      {
        publishCmd:
          "yarn version-major-branch:up && yarn version-major-branch:push",
      },
    ],
    "@semantic-release/npm",
    "@semantic-release/github",
  ],
}
