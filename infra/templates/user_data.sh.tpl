#!/bin/bash
set -euo pipefail

# Register this instance with the ECS cluster.
echo "ECS_CLUSTER=${ecs_cluster_name}" >> /etc/ecs/ecs.config

# 1GB swap: this box runs the ECS agent + dockerd + 3 app containers + Caddy
# on a free-tier t3.micro's 1GB RAM. This absorbs transient spikes -- it is
# not a substitute for right-sized container memory reservations.
if [ ! -f /swapfile ]; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

# Caddy, installed as a static binary (not a package -- Amazon Linux 2's
# repos don't reliably carry one) and run natively via systemd, not as an
# ECS task. Terminates TLS on 80/443 via a free Let's Encrypt cert for
# public_domain (e.g. a DuckDNS subdomain). NOT the EC2 instance's own
# AWS-assigned public DNS name -- Let's Encrypt categorically refuses to
# issue certificates for *.amazonaws.com identifiers ("forbidden by
# policy", confirmed via a real rejected ACME order), so this domain must
# point at the Elastic IP via its own DNS provider instead.
CADDY_VERSION="2.8.4"
curl -fsSL "https://github.com/caddyserver/caddy/releases/download/v$CADDY_VERSION/caddy_$${CADDY_VERSION}_linux_amd64.tar.gz" -o /tmp/caddy.tar.gz
tar -xzf /tmp/caddy.tar.gz -C /usr/local/bin caddy
chmod +x /usr/local/bin/caddy
rm -f /tmp/caddy.tar.gz

mkdir -p /etc/caddy
cat > /etc/caddy/Caddyfile <<CADDYFILE
${public_domain} {
	reverse_proxy /webhooks/* localhost:4000
	reverse_proxy /health* localhost:4000
	reverse_proxy * localhost:3000
}
CADDYFILE

cat > /etc/systemd/system/caddy.service <<'UNIT'
[Unit]
Description=Caddy web server
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/caddy run --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=512
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE
Restart=on-failure

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable caddy
systemctl start caddy
