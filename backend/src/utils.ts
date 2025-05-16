import { logger } from './logger'
import { FastifyReply } from 'fastify'
import { writeFileSync, unlinkSync, readFileSync } from 'fs'
import { DATA_DIR_PWD } from './config'

type SendReply = {
  body: string | Record<string, any>
  reply: FastifyReply
  status?: number
  error?: boolean
}

export const sendReply = ({ body, status, error, reply }: SendReply) => {
  const statusCode = status ?? (error ? 400 : 200)
  const replyMessage = error
    ? { status: statusCode, error: body }
    : { status: statusCode, body }

  if (error) {
    logger.error({ statusCode, response: body })
  } else {
    logger.info({ statusCode, response: body })
  }

  reply.status(statusCode).send(replyMessage)
}

export const writeFileRelative = (relPath: string, text: string) => writeFileSync(`${DATA_DIR_PWD}${relPath}`, text)

export const unlinkSyncRelative = (relPath: string) => unlinkSync(`${DATA_DIR_PWD}${relPath}`)

export const readFileRelative = (relPath: string) => readFileSync(`${DATA_DIR_PWD}${relPath}`)
