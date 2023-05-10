const os = require("os")

const pick = require("lodash/pick")

const { createLoader } = require("@foundernetes/blueprint")

const archAlternatives = {
  x64: "amd64",
}
const archAlternatives2 = {
  x64: "x86_64",
}

const archiveExtensions = [
  "tar.gz",
  "tgz",
  "tar.bz2",
  "tbz",
  "tar.xz",
  "txz",
  "zip",
]

module.exports = async ({ loaders }) =>
  createLoader({
    // retry: 3,
    load: async (vars) => {
      let { packages: data } = vars
      if (!data) {
        const { file } = vars
        if (file) {
          data = await loaders.std.yaml({ file })
        }
      }

      const defaultVars = pick(vars, [
        "platform",
        "arch",
        "archAlt",
        "archAlt2",
      ])

      data = Object.entries(data).reduce((acc, [key, value]) => {
        value = { name: key, ...value }
        const { version, versions = {} } = value
        if (version && versions[version]) {
          Object.assign(value, versions[version])
        }
        acc[key] = value
        return acc
      }, {})

      data = await loaders.std.eta({
        data,
        defaultVars,
        selfRef: true,
        unflatCamelcase: true,
      })

      data = await loaders.std.localFiles({
        // dir: path.join(process.cwd(), "packages"), // embed all files in the dist
        dir: "packages", // keep files out
        data,
        defaultVars,
        autoDiscoverDir: true,
      })

      for (const pkg of Object.values(data)) {
        const file = pkg.file || pkg.download?.url
        if (file && archiveExtensions.some((ext) => file.endsWith(`.${ext}`))) {
          pkg.archive = true
        }
      }

      if (Array.isArray(data)) {
        data = data.reduce((acc, v) => {
          acc[v.name] = v
          return acc
        }, {})
      }

      return data
    },
    validateVars: {
      type: "object",
      properties: {
        packages: {
          type: "object",
        },
        platform: {
          type: "string",
          default: os.platform(),
        },
        archAlt: {
          type: "string",
          default: archAlternatives[process.arch]
            ? archAlternatives[process.arch]
            : process.arch,
        },
        archAlt2: {
          type: "string",
          default: archAlternatives2[process.arch]
            ? archAlternatives2[process.arch]
            : process.arch,
        },
        arch: {
          type: "string",
          default: process.arch,
        },
      },
      additionalProperties: false,
    },
    validateData: {
      type: "object",
      unevaluatedProperties: {
        $ref: "#/$defs/package",
      },
      $defs: {
        package: {
          type: "object",
          properties: {
            name: { type: "string" },
            installer: {
              type: "string",
              default: "install",
              enum: ["apt", "deb", "install", "make", "snap"],
            },
            sha512: { type: "string" },
            enabled: { type: "boolean" },
            download: {
              type: "object",
              properties: {
                url: { type: "string" },
                checksum: {
                  type: "object",
                  properties: {
                    algo: { type: "string" },
                    hash: { type: "string" },
                  },
                },
              },
            },
            extracted: { type: "string" },
            checksum: {
              type: "object",
              properties: {
                algo: { type: "string" },
                hash: { type: "string" },
              },
            },
            check: {
              type: "object",
              properties: {
                command: { type: "string" },
                expectedContain: { type: "string" },
                expectedEqual: { type: "string" },
                expectedRegex: { type: "string" },
              },
            },
          },
          required: ["name", "installer"],
          additionalProperties: true,
        },
      },
    },
    memoizeVars: ["file"],
  })
