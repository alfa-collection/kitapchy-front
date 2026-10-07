# Kitapchy frontend

This is the Next.js frontend for Kitapchy.

## Prerequisites

Choose one installation method:

- Local development: Node.js 24+ and pnpm 12.8.1+.
- Containerized deployment: Docker.

The frontend gets the backend origin only from `NEXT_PUBLIC_API_URL`.

## Local installation

From this `frontend` directory, install dependencies and create your environment file:

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Edit `.env`:

```env
NEXT_PUBLIC_API_URL=http://your-server-ip:1337
```

Start the development server:

```sh
npm run dev
```

Next.js loads `NEXT_PUBLIC_API_URL` directly from `.env` when the development
server starts. Restart the server after changing `.env`.

Open [http://localhost:3000](http://localhost:3000).

To create and run a local production build:

```sh
pnpm build
pnpm start
```

## Docker installation

Build the production image from this `frontend` directory. `NEXT_PUBLIC_API_URL` is a public, browser-facing value and is embedded during the Next.js build, so supply it with `--build-arg`.

```sh
set -a
. ./.env
set +a

docker build \
  --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
  -t kitapchy-frontend .
```

The production image installs nginx in its final Alpine stage. Supervisor runs
the standalone Next.js server internally on port `3000` and nginx on public
port `80`. Nginx acts as the reverse proxy and has buffering disabled so Next.js
streaming responses continue to work.

Run the container by mapping a host port to nginx port `80`:

```sh
docker run --rm --name kitapchy-frontend -p 3000:80 kitapchy-frontend
```

Then open [http://localhost:3000](http://localhost:3000).

Use an API URL that visitors' browsers can reach, such as the public backend domain or a reverse-proxy URL.

The container includes a health check against `http://127.0.0.1/`. To inspect
the two managed processes or follow their output, use:

```sh
docker inspect --format '{{.State.Health.Status}}' kitapchy-frontend
docker logs -f kitapchy-frontend
```

Do not expose the internal Next.js port `3000` from this image. Traffic should
enter through nginx on container port `80`.

### pnpm build-script approval

The project explicitly permits the `unrs-resolver` install script in
`pnpm-workspace.yaml`. It is required during dependency installation and is
approved narrowly rather than enabling lifecycle scripts for every package.

If a Docker build reports `ERR_PNPM_IGNORED_BUILDS`, confirm that the build is
using the committed `pnpm-workspace.yaml`, that the Docker dependency stage
copies it before `pnpm install`, and that it contains:

```yaml
allowBuilds:
  sharp: false
  unrs-resolver: true
```

The corresponding Dockerfile copy step is:

```dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
```

The `Tarball download average speed ... is below 50 KiB/s` message is only a
network-speed warning. The actual failure is the `ERR_PNPM_IGNORED_BUILDS`
message that follows it.

## Commands

```sh
pnpm dev    # Start the development server
pnpm build  # Create a production build
pnpm start  # Serve the production build
pnpm lint   # Run ESLint
```
