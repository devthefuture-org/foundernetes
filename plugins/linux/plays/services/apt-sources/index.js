const path = require("path")

const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ loaders, plays }) =>
  createComposer(async () => {
    const osRelease = await loaders.services.osRelease()

    await plays.std.confDir({
      source: path.join(__dirname, "keyrings"),
      target: "/usr/share/keyrings",
      templateVars: {
        osRelease,
      },
      sudoWrite: true,
      convention: true,
    })

    await plays.std.confDir({
      source: path.join(__dirname, "sources.list.d"),
      target: "/etc/apt/sources.list.d",
      templateVars: {
        osRelease,
      },
      sudoWrite: true,
      convention: true,
    })

    if (osRelease.id === "debian") {
      await plays.std.lineInFile(
        {
          file: "/etc/apt/sources.list",
          find: "deb cdrom:*",
          line: (line) => `# ${line}`,
          create: false,
          sudoWrite: true,
        },
        { tags: ["packages", "apt"] }
      )
    }
  })
