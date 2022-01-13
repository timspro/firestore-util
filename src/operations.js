/* eslint-disable no-await-in-loop */
import { query as _query } from "./query.js"
import { chunk } from "./util.js"

export const BATCH_LIMIT = process.env.BATCH_LIMIT || 500
export const CONCURRENCY = process.env.CONCURRENCY || 4
export const OPERATIONS_LIMIT = BATCH_LIMIT * CONCURRENCY

function ensureOneSecond() {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })
}

// eslint-disable-next-line max-statements, max-lines-per-function
async function operate(
  db,
  collection,
  {
    query = _query,
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
  if (!options.where && query === _query) {
    throw new Error("where must be defined for write operations")
  }

  let start = Date.now()
  let count = 0
  let last
  let oneSecondPromise
  do {
    const callsPerBatch = limit / batchDivisor
    const queryOptions = { ...options, limit: callsPerBatch, last }
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
    await oneSecondPromise
    await Promise.all(commits)
    if (once) {
      break
    }
    if (Date.now() - start >= logInterval * 1000) {
      start = Date.now()
      log(`collection: ${collection}, count: ${count}`)
    }
    oneSecondPromise = ensureOneSecond()
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

export function copy(db, collection, dest, { name = (el, oldId) => oldId, ...options } = {}) {
  return operate(db, collection, options, ({ batch, id, data }) =>
    innerCopy({ db, collection, name, dest, batch, id, data })
  )
}

export function move(db, collection, dest, { name = (el, oldId) => oldId, ...options } = {}) {
  return operate(db, collection, { batchDivisor: 2, ...options }, ({ batch, id, data }) => {
    const idRef = db.collection(collection).doc(id)
    batch.delete(idRef)
    innerCopy({ db, collection, name, dest, batch, id, data })
  })
}

export function insert(db, collection, insertions, { merge = false, ...options } = {}) {
  const boxed = []
  for (const [id, element] of insertions) {
    boxed.push({ id, data: () => element })
  }

  let ith = 0
  function query(_, coll, { limit }) {
    ith += limit
    return boxed.slice(ith - limit, ith)
  }
  options = { ...options, query }

  return operate(db, collection, options, ({ batch, id, data }) => {
    const idRef = db.collection(collection).doc(id)
    if (merge) {
      batch.update(idRef, data)
    } else {
      batch.set(idRef, data)
    }
  })
}
