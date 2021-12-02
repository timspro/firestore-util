import { query } from "./query.js"
import { chunk } from "./util.js"

export const BATCH_LIMIT = process.env.BATCH_LIMIT || 500
export const CONCURRENCY = process.env.CONCURRENCY || 10
export const OPERATIONS_LIMIT = BATCH_LIMIT * CONCURRENCY

async function operate(
  db,
  collection,
  { transform = (_) => _, opCount = 1, once = false, limit = OPERATIONS_LIMIT, ...options },
  callback
) {
  if (!options.where) {
    throw new Error("where must be defined for write operations")
  }

  let count = 0
  let last
  do {
    const queryOptions = { ...options, limit: limit / opCount, last }
    // eslint-disable-next-line no-await-in-loop
    const docs = await query(db, collection, queryOptions)
    const batchSize = Math.ceil(BATCH_LIMIT / opCount)
    const batches = chunk(docs, batchSize).map((subset) => {
      const batch = db.batch()
      for (const element of subset) {
        callback(batch, element.id, transform(element.data()))
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

export function update(db, collection, options) {
  return operate(db, collection, { ...options, opCount: 1 }, (batch, id, data) => {
    if (Object.keys(data).length) {
      batch.update(db.collection(collection).doc(id), data)
    }
  })
}

export function remove(db, collection, options) {
  return operate(db, collection, { ...options, opCount: 1 }, (batch, id) => {
    batch.delete(db.collection(collection).doc(id))
  })
}

export function move(db, collection, dest, { name = ($, _) => _, ...options } = {}) {
  return operate(db, collection, { ...options, opCount: 2 }, (batch, id, data) => {
    batch.delete(db.collection(collection).doc(id))
    const newId = name(data, id)
    if (collection !== dest || id !== newId) {
      batch.set(db.collection(dest).doc(newId), data)
    }
  })
}

export function copy(db, collection, dest, { name = ($, _) => _, ...options } = {}) {
  return operate(db, collection, { ...options, opCount: 1 }, (batch, id, data) => {
    const newId = name(data, id)
    if (collection !== dest || id !== newId) {
      batch.set(db.collection(dest).doc(newId), data)
    }
  })
}
