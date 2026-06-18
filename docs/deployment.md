# Deploying to a VM (Docker + nginx + Let's Encrypt)

A step-by-step runbook to host this app 24/7 on a Linux VM, behind your existing nginx,
with a custom domain and HTTPS. Written for **Ubuntu/Debian**. It's deliberately generic so
you can reuse it for other Dockerized apps — just change the variables in step 0.

## Architecture

```
                          (DNS A record: APP_DOMAIN -> VM public IP)
                                            |
  Internet ── HTTPS :443 ──► nginx (host, TLS) ── HTTP ──► 127.0.0.1:3001
                                                               │  (published, localhost-only)
                                                               ▼
                                                   app container  :3000
                                                               │
                                          host.docker.internal:5432  (Docker host-gateway)
                                                               ▼
                                          PostgreSQL (on the VM host, systemd service)
```

- The app runs in Docker (`docker-compose.yml`), published on **127.0.0.1:3001** so only nginx
  can reach it.
- PostgreSQL runs **on the VM host**; the container reaches it via `host.docker.internal`
  (provided by `extra_hosts: host-gateway` in the compose file).
- nginx terminates TLS and reverse-proxies to the app.
- `restart: always` (container) + the Postgres systemd service mean both survive reboots.

---

## 0. Variables (fill these in once)

Pick your values. Shell steps below assume you've `export`ed these in your VM session;
for config files (nginx, pg_hba) substitute the values literally.

```bash
export APP_DOMAIN="timetracker.example.com"          # the (sub)domain for this app
export APP_DIR="/opt/time-tracker-v2"                # where the repo will live on the VM
export APP_PORT="3001"                               # host port the container publishes
export REPO_URL="git@github.com:YOURUSER/time-tracker-v2.git"
export DB_NAME="time_tracker"
export DB_USER="timetracker"
export DB_PASS="$(openssl rand -hex 24)"             # URL-safe (hex = no special chars)
echo "DB_PASS=$DB_PASS"                              # copy this somewhere safe now
```

> Using a hex password avoids URL-encoding headaches in the `DATABASE_URL`. If you choose
> your own password with special characters (`@ : / # ? space`), URL-encode them.

## Prerequisites

- A VM with sudo, and **nginx already installed** (you have this).
- **Docker Engine + Compose plugin** (step 2 if not installed).
- A **DNS A record**: `APP_DOMAIN` → your VM's public IP (step 1).
- Inbound **80** and **443** open in your firewall / cloud security group (step 9).

---

## 1. Point DNS at the VM

In your DNS provider, add an **A record**: `APP_DOMAIN` → VM public IP. Verify it resolves
before requesting a certificate:

```bash
dig +short "$APP_DOMAIN"      # should print your VM's public IP
```

## 2. Install Docker (skip if already installed)

```bash
# Official Docker repo + engine + compose plugin
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# (optional) run docker without sudo
sudo usermod -aG docker "$USER" && newgrp docker

docker --version && docker compose version
```

## 3. Install & configure PostgreSQL on the host

### 3a. Install and create the database + app user

```bash
sudo apt-get install -y postgresql

# Create a dedicated, non-superuser role and a database it owns:
sudo -u postgres psql <<SQL
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
SQL
```

(We apply the schema in step 4b, after the repo is cloned, so `schema.sql` is available.)

### 3b. Allow the Docker container to connect

The container connects from the Docker bridge subnet (in Docker's default `172.16.0.0/12`
pool) to the host. Tell Postgres to listen on that interface and accept those connections.

Find your Postgres version/config dir (e.g. `16`):

```bash
PG_CONF_DIR=$(sudo -u postgres psql -tAc "SHOW config_file" | xargs dirname)
echo "$PG_CONF_DIR"     # e.g. /etc/postgresql/16/main
```

Set `listen_addresses` so Postgres also listens on the Docker bridge:

```bash
sudo sed -i "s/^#\?listen_addresses.*/listen_addresses = '*'/" "$PG_CONF_DIR/postgresql.conf"
```

Allow the Docker subnet to authenticate (password / scram) — append to `pg_hba.conf`:

```bash
echo "# Allow the Time Tracker app container (Docker bridge subnet)" | sudo tee -a "$PG_CONF_DIR/pg_hba.conf"
echo "host    ${DB_NAME}    ${DB_USER}    172.16.0.0/12    scram-sha-256" | sudo tee -a "$PG_CONF_DIR/pg_hba.conf"

sudo systemctl restart postgresql
```

> `listen_addresses = '*'` makes Postgres listen on the public interface too — **step 9's
> firewall is what keeps 5432 private.** Postgres only *accepts* the Docker subnet (pg_hba)
> and localhost, but the firewall must block 5432 from the internet.

## 4. Get the code and apply the schema

### 4a. Clone from GitHub

```bash
sudo mkdir -p "$APP_DIR" && sudo chown "$USER" "$APP_DIR"
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"
```

> Using an SSH repo URL? Add a deploy key or your SSH key to the VM and GitHub first.
> For HTTPS clone of a private repo, use a Personal Access Token.

### 4b. Apply the schema as the app user

```bash
PGPASSWORD="$DB_PASS" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f schema.sql
# verify:
PGPASSWORD="$DB_PASS" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "\dt"
# expect: folders, subtasks, tasks, time_entries
```

## 5. Create the app's environment file

`.env.docker` is **gitignored**, so it is NOT in the cloned repo — create it on the VM.
The compose file reads `DATABASE_URL` from it. Use `host.docker.internal` (not `localhost`):

```bash
cat > "$APP_DIR/.env.docker" <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@host.docker.internal:5432/${DB_NAME}
EOF
chmod 600 "$APP_DIR/.env.docker"
```

## 6. Build and run the app

```bash
cd "$APP_DIR"
docker compose up -d --build

# It should be listening on localhost only:
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:${APP_PORT}/tasks   # expect 200
docker compose logs --tail=20
```

A `200` here means the container built, started, and successfully reached the host Postgres.
If it's not 200, see **Troubleshooting**.

## 7. Add the nginx site (reverse proxy)

Create a new server block alongside your other apps:

```bash
sudo tee /etc/nginx/sites-available/time-tracker > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${APP_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/time-tracker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> If your nginx uses `/etc/nginx/conf.d/*.conf` instead of `sites-available`/`sites-enabled`,
> put the file at `/etc/nginx/conf.d/time-tracker.conf` and skip the symlink.

Verify over plain HTTP before TLS:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: ${APP_DOMAIN}" http://127.0.0.1/tasks  # 200
```

## 8. Enable HTTPS with certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d "$APP_DOMAIN"
```

Certbot will obtain the cert and **rewrite your nginx site** to add the `443` server block and
an HTTP→HTTPS redirect. Choose "redirect" when prompted. Then confirm auto-renewal works:

```bash
sudo certbot renew --dry-run
```

Renewal is handled automatically by the `certbot.timer` systemd unit (renews ~60 days in).

## 9. Firewall

Open web ports, keep Postgres private, allow the Docker subnet to reach Postgres locally:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 172.16.0.0/12 to any port 5432 proto tcp   # Docker -> host Postgres
sudo ufw --force enable
sudo ufw status verbose
```

There is **no** `allow 5432` for the world — the default-deny keeps it closed to the internet.
(If you use a cloud security group instead of ufw, mirror the same: allow 22/80/443, deny 5432.)

## 10. Verify end-to-end

```bash
curl -sI "https://${APP_DOMAIN}/tasks" | head -n 1     # HTTP/2 200
```

Open `https://APP_DOMAIN` in a browser — the app loads straight to **/tasks** (no login), and
the dashboard renders. Create a folder/task and start a timer to confirm DB writes.

---

## Updating / redeploying (after pushing to GitHub)

```bash
cd "$APP_DIR"
git pull
docker compose up -d --build      # rebuilds the image and recreates the container
docker compose logs --tail=20
```

If you changed `schema.sql`, apply the new statements to the live DB (write a small migration
`.sql` and run it with `psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f migration.sql`).

## Backups

```bash
# One-off dump
PGPASSWORD="$DB_PASS" pg_dump -h localhost -U "$DB_USER" "$DB_NAME" > backup_$(date +%F).sql

# Restore into an empty DB
PGPASSWORD="$DB_PASS" psql -h localhost -U "$DB_USER" -d "$DB_NAME" < backup_YYYY-MM-DD.sql
```

For automated nightly backups, add a cron job running the `pg_dump` line above.

---

## Troubleshooting

**App returns 500 / logs show `ECONNREFUSED` or `no pg_hba.conf entry`:**
The container can't reach Postgres. Check, in order:
- `docker compose logs` for the exact error.
- The connection works from a throwaway container with the real network:
  ```bash
  docker run --rm --add-host=host.docker.internal:host-gateway postgres:17-alpine \
    psql "$(grep ^DATABASE_URL "$APP_DIR/.env.docker" | cut -d= -f2-)" -c "select 1"
  ```
- `no pg_hba.conf entry for host "172.x.x.x"` → your Docker subnet isn't in `pg_hba.conf`.
  Find it with `docker network inspect $(basename "$APP_DIR")_default | grep Subnet` and add a
  matching `host` line (step 3b), then `sudo systemctl restart postgresql`.
- `could not connect` → `listen_addresses` not applied, or ufw is blocking the Docker subnet
  (step 9), or Postgres isn't running (`systemctl status postgresql`).

**nginx 502 Bad Gateway:** the app isn't up on `127.0.0.1:$APP_PORT`. Check
`docker compose ps` and `curl http://127.0.0.1:$APP_PORT/tasks`.

**certbot fails to validate:** DNS A record not propagated yet (`dig +short APP_DOMAIN`), or
port 80 blocked (step 9), or `server_name` doesn't match the domain.

**`host.docker.internal` not resolving in the container:** ensure the
`extra_hosts: ["host.docker.internal:host-gateway"]` line is present in `docker-compose.yml`
(it is) and you're on Docker Engine 20.10+.

---

## Reuse checklist for the next app

1. Set the **variables** (domain, dir, port, repo, DB name/user/pass).
2. DNS A record → VM.
3. Create DB + user; apply its schema; add the Docker subnet to `pg_hba.conf` (once per DB).
4. `git clone`, create `.env.docker`, `docker compose up -d --build` (publish on `127.0.0.1:<port>`).
5. nginx site → `proxy_pass http://127.0.0.1:<port>;` → `nginx -t && reload`.
6. `certbot --nginx -d <domain>`.
7. Firewall: 80/443 open, app port localhost-only, DB port private.
