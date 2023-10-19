const config = require('./config')
const logger = $require('loaders/logger')

const redis = $require('loaders/redis')
const TicketStoreService = $require('services/ticketStore')
const JobSercice = $require('services/jobService')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function start() {
  await $require('loaders')()

  const ticketStoreService = new TicketStoreService(redis)
  const jobSerivce = new JobSercice(redis, config.job)

  logger.info(`
    🛡️ Job Started 🛡️
  `)

  while (1) {
    try {
      logger.info(`🛡️ Job Running 🛡️`)
    } catch (e) {
      logger.error(`🛡️ Job Error Occured 🛡️`)
      logger.error(err)
    } finally {
      await sleep(config.job.inteval)
    }
  }
}

start()
