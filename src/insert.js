import { BATCH_LIMIT, OPERATIONS_LIMIT } from "./operations.js"

class InsertState {
  constructor(db) {
    this.db = db
    this.count = 0
    this.resetBatches()
  }

  addOperation(idRef, element) {
    if (this.operationCount % BATCH_LIMIT === 0 && this.operationCount !== 0) {
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
    await Promise.all(this.batches.map((b) => b.commit()))
    this.resetBatches()
  }
}

export async function insert(db, collection, data, { limit = OPERATIONS_LIMIT } = {}) {
  const state = new InsertState(db)
  for (const [id, element] of data) {
    if (state.operationCount >= limit) {
      // eslint-disable-next-line no-await-in-loop
      await state.commit()
    }
    state.addOperation(db.collection(collection).doc(id), element)
  }
  await state.commit()
  return { count: state.count }
}
