import { PaymentsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { logger } from '@api/configuration/logger'
import { Model } from 'objection'

export async function updatePaymentBankStatusesTask(
  registry: DependencyResolver
) {
  const log = logger.child({ task: 'update-payment-bank-statuses' })
  const payments = registry.get<PaymentsService>(PaymentsService.name)
  const trx = await Model.startTransaction()
  try {
    const updatedBanks = await payments.updatePaymentBankStatuses(trx)
    log.info('updated %d payment bank account statuses', updatedBanks)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to update payment bank account statuses')
  }
}
