# helmix

dropin replacement for helm in argocd that will allow to use custom `post-renderer` and `values` executables if present in the chart repository path

# features

- post-renderer
- values
- embeded @founderenetes/sniper
  can be used to develop quick javascript plugins in post-renderer and values
  call it with: `#!/usr/bin/env sniper`

# overcome the limitations of argocd helm rendering

see also:
- https://github.com/argoproj/argo-cd/issues/3698