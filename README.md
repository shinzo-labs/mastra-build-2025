# Mastra Build 2025 Hackathon Submission

## Prerequisites
### Docker Deployment
- [Docker](https://docs.docker.com/get-started/#download-and-install-docker)

### Local Deployment
- [pnpm](https://pnpm.io/installation)
- [dotenv](https://www.npmjs.com/package/dotenv)

## Env Configs
Fill out env files with given variables:
- `.env`
- `backend/.env`
- `frontend/.env`

## Dockerized Deployment

### Deploy all services
```bash
docker-compose up --build -d
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

### Contributing

All contributions are welcome! The codebase is still in development, so please contact austin@shinzolabs.com if you have any questions or feedback about the project.
