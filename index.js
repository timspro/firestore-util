/* eslint-disable no-await-in-loop */

// BATCH_SIZE should be an even number
const BATCH_SIZE = 500

export function query(db, collection, { where = [], limit, last } = {}) {
  if (!Array.isArray(where)) {
    if (typeof where === "object" && where) {
      where = Object.entries(where).map(([key, value]) => [key, "==", value])
    } else {
      throw new Error("where must be an array of clauses or an object to equal")
    }
  }

  let request = db.collection(collection)
  for (const clause of where) {
    request = request.where(...clause)
  }
  if (last) {
    request = request.startAfter(last)
  }
  request = request.limit(limit || BATCH_SIZE)
  return request.get()
}

async function operate(db, collection, { once = false, ...options }, callback) {
  if (!options.where) {
    throw new Error("where must be defined for write operations")
  }

  let count = 0
  let last
  do {
    const batch = db.batch()

    const snapshot = await query(db, collection, { ...options, last })
    for (const element of snapshot.docs) {
      callback(batch, element.id, element.data())
    }
    last = snapshot.docs[snapshot.docs.length - 1]
    count += snapshot.docs.length

    await batch.commit()
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
  if (!options.limit) {
    options.limit = BATCH_SIZE / 2
  }
  return operate(db, collection, options, (batch, id, data) => {
    batch.delete(db.collection(collection).doc(id))
    batch.set(db.collection(dest).doc(id), data)
  })
}

export function copy(db, collection, dest, options) {
  return operate(db, collection, options, (batch, id, data) => {
    batch.set(db.collection(dest).doc(id), data)
  })
}
