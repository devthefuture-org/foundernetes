const { createComposer } = require("@foundernetes/blueprint")
const deepmerge = require("@foundernetes/std/deepmerge")

module.exports = async ({ plays }) =>
  createComposer(
    async (vars = {}) => {
      const { sysctlFile = "/etc/sysctl.d/99-lxd.conf" } = vars

      const systctlConfig = {
        "fs.inotify.max_queued_events": { min: 1048576 },
        "fs.inotify.max_user_instances": { min: 1048576 },
        "fs.inotify.max_user_watches": { min: 1048576 },
        "vm.max_map_count": { min: 262144 },
        "kernel.dmesg_restrict": 1,
        "kernel.keys.maxkeys": { min: 2000 },
        "net.netfilter.nf_conntrack_buckets": { min: 32768 },
        "net.ipv4.neigh.default.gc_thresh3": { min: 8192 },
        "net.ipv6.neigh.default.gc_thresh3": { min: 8192 },
        "net.ipv4.ip_forward": 1,
        "net.ipv4.vs.conntrack": 1,
      }
      deepmerge(systctlConfig, vars.sysctlConfig || {})

      for (const [name, value] of Object.entries(systctlConfig)) {
        await plays.services.sysctlSet(
          {
            name,
            file: sysctlFile,
            ...(typeof value === "object" ? value : { value }),
          },
          { tags: ["lxd"] }
        )
      }
    },
    { tags: ["lxd"] }
  )
