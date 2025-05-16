# Mastra Build 2025 Hackathon Submission

## Prerequisites
### Docker Deployment
- [Docker](https://docs.docker.com/get-started/#download-and-install-docker)

### DB Administration
- [Ubuntu PostgreSQL](https://ubuntu.com/server/docs/databases-postgresql)
- [DB Mate](https://github.com/amacneil/dbmate)

### Local Deployment
- [pnpm](https://pnpm.io/installation)
- [dotenv](https://www.npmjs.com/package/dotenv)

## Env Configs
Fill out env files with given variables:
- `.env`
- `backend/.env`
- `frontend/.env`

## Volumes
Create a volume for user data with path specified in `.env` as DATA_DIR_PWD (include user directory name, for example `data/`)

## Dockerized Deployment

### Add Database
Follow steps in [db/README.md](./db/README.md) to deploy a new `postgres` database instance.

### Reset Database
Run [db/scripts/reset-db.sh](./db/scripts/reset-db.sh):
```bash
./db/scripts/reset-db.sh
```

### Deploy all services
```bash
docker-compose up --build -d
dbmate up
```

### Bring down all services
```bash
docker-compose down
```

### Deploy specific service
```bash
docker-compose up --build -d <backend|frontend>
```

## Troubleshooting
- If you are using `sudo` with `docker-compose`, ensure you use `sudo -E` to keep env vars like `PWD`, especially when creating volumes initially.
- Ensure `pnpm` is up-to-date and all packages are on reasonable versions, or upgraded with:
```bash
pnpm up --latest
```
- If the backend fails to connect to the DB with some error about `ECONNREFUSED`, make sure the DB URL uses 172.17.0.1 instead of localhost. This is a quirk with docker's network configuration.

### Contributing

All contributions are welcome! The codebase is still in development, so please contact austin@shinzolabs.com if you have any questions or feedback about the project.
