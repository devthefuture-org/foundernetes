# fail2ban cheatsheet

## Pour voir la liste des adresses IP bloquées par fail2ban :

```sh
sudo iptables -L
```

## ou pour un jail en particulier (postfix par exemple):

```sh
sudo iptables -L fail2ban-postfix
```

## avec les lignes numérotées :

```sh
sudo iptables -L fail2ban-postfix --line-numbers
```

##  Pour supprimer une adresses IP de la liste des adresses bloquées par fail2ban

Par exemple, pour supprimer l'adresse IP 192.168.1.2 bloquée par le service fail2ban-ssh

```sh
sudo iptables -D fail2ban-ssh -s 192.168.1.2 -j DROP
```

## ou avec son numéro obtenu grâce à la commande iptables -L --line-numbers

```sh
sudo iptables -D fail2ban-ssh 5
```

## Pour ajouter une adresse IP à la liste des adresses bloquées (pour le jail postfix par exemple)

```sh
iptables -I fail2ban-postfix 1 -s 1.163.149.165 -j DROP
```

## ou une plage d'adresses

```sh
iptables -I fail2ban-postfix 1 -s 118.160.0.0/16 -j DROP
```