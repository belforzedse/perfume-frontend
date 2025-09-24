## Development quickstart

Run the development server with hot reloading:

```bash
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

## Environment variables

The frontend consumes the Strapi API and needs its base URL at runtime. Create a `.env.local` file with:

```bash
NEXT_PUBLIC_STRAPI_BASE_URL=http://localhost:1337
NEXT_PUBLIC_STRAPI_TOKEN= # optional bearer token when the API requires auth
```

You can override `NEXT_PUBLIC_STRAPI_BASE_URL` per environment without rebuilding the app. When the variable is omitted the client will default to `http://localhost:1337`.

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development mode. |
| `npm run build` | Generate a production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint against the project. |
