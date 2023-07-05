const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async (_vars = {}) => {
    await plays.std.ensureFile({
      file: "/etc/bash_completion.d/keyboard-sugars.sh",
      content: `if [ -t 1 ]; then
bind '"\\e[6~": menu-complete' 2>/dev/null
bind '"\\e[5~": menu-complete-backward' 2>/dev/null
bind '"\\e[A": history-search-backward' 2>/dev/null
bind '"\\e[B": history-search-forward' 2>/dev/null
bind '"\\eOA": history-search-backward' 2>/dev/null
bind '"\\eOB": history-search-forward' 2>/dev/null
fi`,
      sudoWrite: true,
    })
  })
