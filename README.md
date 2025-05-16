# Mastra Build 2025 - Shinzo AI Crypto Financial Advisor

## Summary

As Shinzo Labs' submission to the Mastra Build 2025 Hackathon, the Crypto Financial Advisor is your all-in-one tool to analyze transactional history and token balance data for any EVM network address. Simply copy your address of choice into the app and submit to receive a full transaction history, as well as personalized financial advice and clarifications from an agent connected to other financial tools like CoinMarketCap, Infura, and Etherscan.

For a limited time, check it out at [https://www.shinzo.app](https://www.shinzo.app)!

<p align="center"><img height="512" src=https://github.com/user-attachments/assets/74b80c21-bac2-44f3-baae-75b580ca8739></p>


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
