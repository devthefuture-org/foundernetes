const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createPlay(async (vars = {}) => {
    const {
      name,
      min,
      max,
      value,
      file = "/etc/sysctl.d/99-foundernetes.conf",
      ...configFileOptions
    } = vars
    const getCurrent = async () => {
      const { stdout } = await $(`sysctl -n ${name}`)
      const current = parseInt(stdout, 10)
      if (Number.isNaN(current)) {
        throw new Error(`${current} is not a number`)
      }
      return current
    }
    const sysctlFileSet = async (val) => {
      await plays.std.configFile({
        file,
        configMap: {
          [name]: val,
        },
        separator: "=",
        sudoWrite: true,
        ...configFileOptions,
      })
    }

    return {
      async check() {
        const current = await getCurrent()
        if (min !== undefined && current < min) {
          return false
        }
        if (max !== undefined && current > max) {
          return false
        }
        if (value !== undefined && current !== value) {
          return false
        }
        return true
      },
      async run() {
        const current = await getCurrent()
        if (min !== undefined && current < min) {
          await sysctlFileSet(min)
        }
        if (max !== undefined && current > max) {
          await sysctlFileSet(max)
        }
        if (value !== undefined && current !== value) {
          await sysctlFileSet(value)
        }
        await $(`sysctl -p ${file}`, { sudo: true })
      },
    }
  })
