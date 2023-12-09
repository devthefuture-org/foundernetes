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


# install to argocd

```sh
kubectl -n argocd patch deployment argocd-repo-server --type strategic --patch-file argocd-server-helmix.patch.yaml
```

argocd-server-helmix.patch.yaml :
```yaml
# https://argo-cd.readthedocs.io/en/stable/operator-manual/custom_tools/
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      volumes:
      - name: custom-tools
        emptyDir: {}
      - name: local-foundernetes
        emptyDir: {}
      initContainers:
      - name: download-tools
        image: curlimages/curl
        securityContext:
          runAsUser: 1000
        command:
        - sh
        - -c
        - |
          curl -L -f -o /custom-tools/helm https://codeberg.org/devthefuture/matryoshka-boilerplate/media/branch/main/bin/helmix \
            && chmod +x /custom-tools/helm
        volumeMounts:
        - mountPath: /custom-tools
          name: custom-tools
      containers:
      - name: repo-server
        volumeMounts:
        - mountPath: /usr/local/bin/helm
          name: custom-tools
          subPath: helm
        - mountPath: /home/argocd/.foundernetes
          name: local-foundernetes

```