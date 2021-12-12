import { BATCH_LIMIT, OPERATIONS_LIMIT } from "./operations.js"

class OperationBuffer {
  constructor(db) {
    this.db = db
    this.count = 0
    this.resetBatches()
  }

  addOperation(idRef, element) {
    const atBatchLimit = this.operationCount % BATCH_LIMIT === 0
    if (atBatchLimit && this.operationCount > 0) {
      this.nextBatch()
    }
    this.currentBatch().set(idRef, element)
    this.count++
    this.operationCount++
  }

  currentBatch() {
    return this.batches[this.batches.length - 1]
  }

  nextBatch() {
    this.batches.push(this.db.batch())
  }

  resetBatches() {
    this.operationCount = 0
    this.batches = [this.db.batch()]
  }

  async commit() {
    await Promise.all(this.batches.map((batch) => batch.commit()))
    this.resetBatches()
  }
}

export async function insert(db, collection, data, { limit = OPERATIONS_LIMIT } = {}) {
  const state = new OperationBuffer(db)
  for (const [id, element] of data) {
    if (state.operationCount >= limit) {
      // eslint-disable-next-line no-await-in-loop
      await state.commit()
    }
    const idRef = db.collection(collection).doc(id)
    state.addOperation(idRef, element)
  }
  await state.commit()
  return { count: state.count }
}
