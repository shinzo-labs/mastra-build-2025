import { Cache } from "./cache"
import { logger } from "../logger"
import { createFinancialAgent } from "../agent/model"
import * as yup from "yup"

const agentCache = new Cache(new Map())

export const queryFinancialAdvisorSchema = yup.object({
  instructions: yup.string().required(),
  messages: yup.array().of(yup.object({
    role: yup.string().required(),
    content: yup.string().default('')
  })).optional()
})

export const queryFinancialAdvisor = async (request: yup.InferType<typeof queryFinancialAdvisorSchema>) => {
  const { instructions, messages } = request
  logger.info({ message: 'Financial agent query', messages })
  const agent = await agentCache.process("financial-agent", createFinancialAgent, instructions)
  const result = await agent.generate(messages)

  logger.info({ message: 'Financial agent result', result: result.text })
  return { response: result.text, status: 200 }
}
