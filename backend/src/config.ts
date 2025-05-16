import dotenv from 'dotenv'
dotenv.config()

export const DATA_DIR_PWD = process.env.DATA_DIR_PWD ?? ''
export const DATABASE_URL = process.env.DATABASE_URL ?? ''
export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info'
export const LOGIN_MESSAGE = process.env.LOGIN_MESSAGE ?? ''
export const PORT = process.env.PORT ?? '8000'
export const RPC_API_KEY = process.env.RPC_API_KEY ?? ''
export const RPC_API_SECRET = process.env.RPC_API_SECRET ?? ''
export const TZ = process.env.TZ ?? ''
export const JWT_SECRET = process.env.JWT_SECRET ?? 'shinzo_jwt_secret'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1w'
