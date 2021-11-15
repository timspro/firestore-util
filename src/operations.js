import { query } from "./query.js"
import { chunk } from "./util.js"

export const BATCH_SIZE = 500
export const CONCURRENT_BATCHES = 10
export const OPERATE_LIMIT = BATCH_SIZE * CONCURRENT_BATCHES

async function operate(
  db,
  collection,
  { once = false, limit = OPERATE_LIMIT, operations = 1, ...options },
  callback
) {
  if (!options.where) {
    throw new Error("where must be defined for write operations")
  }

  let count = 0
  let last
  do {
    // eslint-disable-next-line no-await-in-loop
    const docs = await query(db, collection, { ...options, limit, last })
    const batchSize = Math.ceil(BATCH_SIZE / operations)
    const batches = chunk(docs, batchSize).map((subset) => {
      const batch = db.batch()
      for (const element of subset) {
        callback(batch, element.id, element.data())
      }
      return batch
    })
    last = docs[docs.length - 1]
    count += docs.length
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(batches.map((batch) => batch.commit()))
    if (once) {
      break
    }
  } while (last !== undefined)

  return { count }
}

export function update(db, collection, { transform, ...options }) {
  return operate(db, collection, options, (batch, id, data) => {
    batch.update(db.collection(collection).doc(id), transform(data))
  })
}

export function remove(db, collection, options) {
  return operate(db, collection, options, (batch, id) => {
    batch.delete(db.collection(collection).doc(id))
  })
}

export function move(db, collection, dest, options) {
  return operate(db, collection, { ...options, operations: 2 }, (batch, id, data) => {
    batch.delete(db.collection(collection).doc(id))
    batch.set(db.collection(dest).doc(id), data)
  })
}

export function copy(db, collection, dest, options) {
  return operate(db, collection, options, (batch, id, data) => {
    batch.set(db.collection(dest).doc(id), data)
  })
}
