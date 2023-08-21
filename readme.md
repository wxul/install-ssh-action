# Install SSH Config Action

Install SSH Config Action

## Release

1. Clone
2. `npm i`
3. Install `@vercel/ncc` : `npm i -g @vercel/ncc` (skip if installed)
4. `npm run build`
5. Push

## Inputs

## Example usage

``` yml
uses: wxul/install-ssh-action@v1
with:
  name: 'id_rsa_example' ## id_rsa file name
  ssh_key: ${{ secrets.PRIVATE_SSH_KEY }} ## private ssh key put in id_rsa_example
  known_hosts: ${{ secrets.KNOWN_HOSTS }} ## known_hosts
  if_exist: 'ignore' ## ignore | fail | override
  config: |
    Host example
      HostName xx.xx.xx.xx
      User ubuntu
      IdentityFile ~/.ssh/id_rsa_example
```
