import { BATCH_LIMIT, OPERATIONS_LIMIT } from "./operations.js"

class InsertState {
  constructor(db) {
    this.db = db
    this.count = 0
    this.reset()
  }

  operation(idRef, element) {
    this.current().set(idRef, element)
    this.count++
    this.operationCount++
  }

  current() {
    return this.batches[this.batches.length - 1]
  }

  next() {
    this.batches.push(this.db.batch())
  }

  reset() {
    this.operationCount = 0
    this.batches = [this.db.batch()]
  }

  async send() {
    await Promise.all(this.batches.map((b) => b.commit()))
    this.reset()
  }
}

export async function insert(db, collection, data, { limit = OPERATIONS_LIMIT } = {}) {
  const state = new InsertState(db)
  for (const [id, element] of data) {
    if (state.operationCount >= limit) {
      // eslint-disable-next-line no-await-in-loop
      await state.send()
    } else if (state.count % BATCH_LIMIT === 0) {
      state.next()
    }
    state.operation(db.collection(collection).doc(id), element)
  }
  await state.send()
  return { count: state.count }
}
