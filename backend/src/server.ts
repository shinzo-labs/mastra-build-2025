import fastify, { FastifyReply, FastifyRequest } from 'fastify'
import fastifyCors from '@fastify/cors'
import { PORT } from './config'
import { logger, pinoConfig } from './logger'
import { sendReply } from './utils'
import * as yup from 'yup'
import {
  getTxHistory,
  getTxHistorySchema,
  getTokenBalance,
  getTokenBalanceSchema,
  buildContractABIMappingAndExtractTokens,
  buildContractABIMappingAndExtractTokensSchema
} from './handlers/etherscan'
import {
  callContract,
  callContractSchema,
  getNativeGasBalance,
  getNativeGasBalanceSchema
} from './handlers/infura'
import {
  queryFinancialAdvisor,
  queryFinancialAdvisorSchema
} from './handlers/financialAdvisor'
import { Cache } from './handlers/cache'

type Response<ResponseBody extends any> = {
  response: ResponseBody | string
  error?: boolean
  status?: number
}

type RequestHandler<RequestBodySchema extends yup.ISchema<any, any, any, any>, ResponseBody> = (
  request: yup.InferType<RequestBodySchema>
) => Promise<Response<ResponseBody>>

const app = fastify({
  logger: pinoConfig('backend'),
  bodyLimit: 1024 * 1024 * 16, // 16 MiB
})

const requestCache = new Cache(new Map())

const requestMiddleware = <T extends yup.ISchema<any, any, any, any>>(
  methodName: string,
  requestHandler: RequestHandler<T, any>,
  requestBodySchema: T
) => async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { body } = request
    logger.debug({ request: body })

    let validatedBody;
    try {
      validatedBody = await requestBodySchema.validate(body, {
        abortEarly: false,
        stripUnknown: true,
        strict: false
      })
    } catch (error: any) {
      logger.warn({ validation_error: error.message })
      return sendReply({
        body: error.message,
        reply,
        status: 400,
        error: true
      })
    }

    const { response, error, status } = await requestCache.process(methodName, requestHandler, validatedBody)
    sendReply({ body: response, error, status, reply })
  } catch (error: any) {
    logger.error({ message: 'Request error', error })
    sendReply({
      body: 'Internal server error',
      reply,
      status: 500,
      error: true
    })
  }
}

// Route definitions
app.post('/etherscan/getTxHistory', requestMiddleware('getTxHistory', getTxHistory, getTxHistorySchema))
app.post('/etherscan/getTokenBalance', requestMiddleware('getTokenBalance', getTokenBalance, getTokenBalanceSchema))
app.post('/etherscan/buildContractABIMappingAndExtractTokens', requestMiddleware('buildContractABIMappingAndExtractTokens', buildContractABIMappingAndExtractTokens, buildContractABIMappingAndExtractTokensSchema))
app.post('/infura/callContract', requestMiddleware('callContract', callContract, callContractSchema))
app.post('/infura/getNativeGasBalance', requestMiddleware('getNativeGasBalance', getNativeGasBalance, getNativeGasBalanceSchema))
app.post('/financialAdvisor/query', requestMiddleware('queryFinancialAdvisor', queryFinancialAdvisor, queryFinancialAdvisorSchema))

const start = async () => {
  try {
    // Register CORS plugin
    await app.register(fastifyCors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    })

    logger.info({ msg: `Starting service on port ${PORT}` })
    await app.listen({ port: parseInt(PORT), host: '0.0.0.0' })
  } catch (error) {
    logger.error({ message: 'Server startup error', error })
    process.exit(1)
  }
}

start()
