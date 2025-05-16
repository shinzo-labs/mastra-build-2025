import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { FastifyReply, FastifyRequest } from 'fastify'
import { User } from '../models/main/User'
import { logger } from '../logger'
import { sendReply } from '../utils'
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config'

type JWTPayload = {
  uuid: string
  walletAddress: string
  iat: number
  exp: number
}

export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      uuid: user.uuid,
      walletAddress: user.wallet_address,
    },
    JWT_SECRET as Secret,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  )
}

export const authenticateRequest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      sendReply({
        body: 'No token provided',
        error: true,
        status: 401,
        reply
      })
      return null
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    // Verify user still exists and is active
    const user = await User.findOne({
      where: { uuid: decoded.uuid }
    })

    if (!user) {
      sendReply({
        body: 'User not found',
        error: true,
        status: 401,
        reply
      })
      return null
    }

    // Update last_active
    await user.update({ last_active: new Date() })

    return decoded.uuid

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendReply({
        body: 'Token expired',
        error: true,
        status: 401,
        reply
      })
    } else {
      logger.error('Authentication error:', error)
      sendReply({
        body: 'Invalid token',
        error: true,
        status: 401,
        reply
      })
    }
    return null
  }
}
