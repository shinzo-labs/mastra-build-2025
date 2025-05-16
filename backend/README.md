# Shinzo Backend

The Shinzo application uses a backend API server to handle requests from the web app. It can authenticate users for requests and query data from the database and other stored data to resolve requests.

## Prerequisites
- Database set up with actions in [db/README.md](../db/README.md)
- User volume created with path specified in `.env` as `${DATA_DIR_PWD}`

## Operations

Install packages:
```bash
pnpm i
```

Test server:
```bash
pnpm test
```

Build server:
```bash
pnpm build
```

Start server:
```bash
pnpm start
```

Start server as production:
```bash
pnpm start:prod
```
