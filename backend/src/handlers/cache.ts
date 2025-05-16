import { createHash } from 'crypto'
import { logger } from '../logger'

export class Cache {
  constructor(private readonly cache: Map<string, any>) {}

  getKey(methodName: string, params?: any) {
    const hash = createHash('sha256')
    hash.update(methodName)
    if (params) hash.update(JSON.stringify(params))
    return hash.digest('hex')
  }

  async process(methodName: string, method: (params: any) => Promise<any>, params: any) {
    const key = this.getKey(methodName, params)
    if (this.cache.has(key)) {
      logger.info({ msg: `Cache hit for ${methodName}`, key })
      return this.cache.get(key)
    }
    logger.info({ msg: `Cache miss for ${methodName}`, key })
    const result = await method(params)
    this.cache.set(key, result)
    return result
  }
}
