export const SANDBOX = "test-sandbox"
export const EMPTY = "test-clean"

async function insert(db, collection = SANDBOX, size = 100) {
  const batch = db.batch()
  for (let i = 0; i < size; i++) {
    const id = db.collection(collection).doc(i.toString())
    const data = { number: i, even: i % 2, five: i % 5, ten: i % 10, twenty: i % 10 }
    batch.set(id, data)
  }
  await batch.commit()
}

async function remove(db, collection = EMPTY, size = 100) {
  const batch = db.batch()
  for (let i = 0; i < size; i++) {
    const id = db.collection(collection).doc(i.toString())
    batch.delete(id)
  }
  await batch.commit()
}

export function setup(db) {
  return () => Promise.all([insert(db), remove(db)])
}
