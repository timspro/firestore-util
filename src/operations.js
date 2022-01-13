import { query } from "./query.js"
import { chunk } from "./util.js"

export const BATCH_LIMIT = process.env.BATCH_LIMIT || 500
export const CONCURRENCY = process.env.CONCURRENCY || 4
export const OPERATIONS_LIMIT = BATCH_LIMIT * CONCURRENCY

function ensureOneSecond() {
  return new Promise((resolve) => {
    setTimeout(1000, resolve)
  })
}

// eslint-disable-next-line max-statements, max-lines-per-function
async function operate(
  db,
  collection,
  {
    transform = (_) => _,
    batchDivisor = 1,
    once = false,
    limit = OPERATIONS_LIMIT,
    // eslint-disable-next-line no-console
    log = console.log,
    logInterval = 10, // seconds
    ...options
  },
  callback
) {
  if (!options.where) {
    throw new Error("where must be defined for write operations")
  }

  let start = Date.now()
  let count = 0
  let last
  // use await to prevent memory overflow
  do {
    const callsPerBatch = limit / batchDivisor
    const queryOptions = { ...options, limit: callsPerBatch, last }
    // eslint-disable-next-line no-await-in-loop
    const docs = await query(db, collection, queryOptions)
    const batchSize = Math.ceil(BATCH_LIMIT / batchDivisor)
    const batches = chunk(docs, batchSize).map((subset) => {
      const batch = db.batch()
      for (const element of subset) {
        const { id } = element
        callback({ batch, id, data: transform(element.data()) })
      }
      return batch
    })
    last = docs[docs.length - 1]
    count += docs.length
    const commits = batches.map((batch) => batch.commit())
    // eslint-disable-next-line no-await-in-loop
    await Promise.all([commits, ensureOneSecond()].flat())
    if (once) {
      break
    }
    if (Date.now() - start >= logInterval * 1000) {
      start = Date.now()
      log(`collection: ${collection}, count: ${count}`)
    }
  } while (last !== undefined)

  return { count }
}

export function update(db, collection, options) {
  if (!options.transform) {
    throw new Error("transform must be provided for update")
  }
  return operate(db, collection, options, ({ batch, id, data }) => {
    if (Object.keys(data).length) {
      const idRef = db.collection(collection).doc(id)
      batch.update(idRef, data)
    }
  })
}

export function remove(db, collection, options) {
  return operate(db, collection, options, ({ batch, id }) => {
    const idRef = db.collection(collection).doc(id)
    batch.delete(idRef)
  })
}

function innerCopy({ db, collection, name, dest, batch, id, data }) {
  const newId = name(data, id)
  if (newId && (collection !== dest || id !== newId)) {
    const newIdRef = db.collection(dest).doc(newId)
    batch.set(newIdRef, data)
  }
}

export function copy(db, collection, dest, { name = (_, $) => $, ...options } = {}) {
  return operate(db, collection, options, ({ batch, id, data }) =>
    innerCopy({ db, collection, name, dest, batch, id, data })
  )
}

export function move(db, collection, dest, { name = (_, $) => $, ...options } = {}) {
  return operate(db, collection, { batchDivisor: 2, ...options }, ({ batch, id, data }) => {
    const idRef = db.collection(collection).doc(id)
    batch.delete(idRef)
    innerCopy({ db, collection, name, dest, batch, id, data })
  })
}
