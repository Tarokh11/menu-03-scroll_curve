# Deploy menu-03-scroll_curve

This project is a standalone Django café menu. It runs in its own Docker Compose project on the shared VPS; it does not share the `vtshop` containers or volumes.

## GitHub Actions

The `production` environment is already created in `Tarokh11/menu-03-scroll_curve`. Add these environment secrets under **Settings → Environments → production**:

| Secret | Value |
| --- | --- |
| `PRODUCTION_HOST` | `94.184.45.92` |
| `PRODUCTION_PORT` | `22` |
| `PRODUCTION_USER` | `root` |
| `PRODUCTION_PATH` | `/opt/menu-03-scroll_curve` |
| `PRODUCTION_SSH_KEY` | Private key authorized for this server |
| `PRODUCTION_KNOWN_HOSTS` | Verified SSH host-key entry for this server |

Pushes to `main` deploy the exact commit. The workflow requires the server's `.env.production` file before checkout/build. Never commit private keys or production env files.

## Prepare the server once

Confirm Docker Compose is installed and choose a free public port. `8084` belongs to `vtshop`; the example below uses `8085`, which must be checked on the server before opening it in the firewall.

```sh
mkdir -p /opt/menu-03-scroll_curve
cp deploy/production.env.example /opt/menu-03-scroll_curve/.env.production
chmod 600 /opt/menu-03-scroll_curve/.env.production
python3 -c 'import secrets; print(secrets.token_urlsafe(64))'
```

Set `DJANGO_SECRET_KEY` in `/opt/menu-03-scroll_curve/.env.production` to the generated value. Set `SHOP_PORT` to the verified free port and `DJANGO_ALLOWED_HOSTS` to the public IP/domain. Do not copy the secret into GitHub or commit `.env.production`.

The app uses Django, Gunicorn, and WhiteNoise. It has no production database or uploaded media. Static assets are collected into the image during build. The Compose project name `menu03` isolates its container from other apps on the VPS.

## Deploy and inspect

The first push to `main` runs **Actions → Deploy café menu**. It builds the image, starts the container, waits for its health check, and runs `manage.py check`.

```sh
cd /opt/menu-03-scroll_curve
docker compose --env-file .env.production -f compose.production.yaml --project-name menu03 ps
docker compose --env-file .env.production -f compose.production.yaml --project-name menu03 logs --tail=100 web
```

The preview is available at `http://94.184.45.92:<SHOP_PORT>/`. For HTTPS, put the app behind the VPS reverse proxy and bind `SHOP_BIND_ADDRESS` to `127.0.0.1`.
