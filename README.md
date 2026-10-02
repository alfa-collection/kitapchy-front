# Kitapchy frontend

This is the Next.js frontend for Kitapchy.

## Prerequisites

Choose one installation method:

- Local development: Node.js 24+ and pnpm 12.8.1+.
- Containerized deployment: Docker.

The frontend needs the URL of the backend API. Set it in `NEXT_PUBLIC_API_URL`, for example `http://localhost:1337`.

## Local installation

From this `frontend` directory, install dependencies and create your environment file:

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:1337
```

Start the development server:

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

To create and run a local production build:

```sh
pnpm build
pnpm start
```

## Docker installation

Build the production image from this `frontend` directory. `NEXT_PUBLIC_API_URL` is a public, browser-facing value and is embedded during the Next.js build, so supply it with `--build-arg`.

```sh
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:1337 \
  -t kitapchy-frontend .
```

Run the container:

```sh
docker run --rm --name kitapchy-frontend -p 3000:3000 kitapchy-frontend
```

Then open [http://localhost:3000](http://localhost:3000).

Use an API URL that visitors' browsers can reach, such as the public backend domain or a reverse-proxy URL.

## Commands

```sh
pnpm dev    # Start the development server
pnpm build  # Create a production build
pnpm start  # Serve the production build
pnpm lint   # Run ESLint
```
