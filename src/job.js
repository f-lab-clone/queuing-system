const config = require('./config')
const logger = $require('loaders/logger')

const redis = $require('loaders/redis')
const TicketStoreService = $require('services/ticketStore')
const JobSercice = $require('services/jobService')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function start() {
  await $require('loaders')()

  const ticketStoreService = new TicketStoreService(redis)
  const jobSerivce = new JobSercice(ticketStoreService, config.job)

  logger.info(`
    ----------------------------------------------
    🛡️  JOB Started                              🛡️
        NODE_ENV: ${config.NODE_ENV}
    ----------------------------------------------
  `)

  while (1) {
    try {
      logger.info(`🛡️ Job Running 🛡️`)
      await jobSerivce.removeExpiredQueue()
      await jobSerivce.removeExpiredTicket()
      for (const { eventId } of await jobSerivce.getEventList()) {
        await jobSerivce.moveEventToRunning(eventId)
      }
    } catch (e) {
      logger.error(`🛡️ Job Error Occured 🛡️`)
      logger.error(err)
    } finally {
      await sleep(config.job.intevalPerSec * 1000)
    }
  }
}

start()
