import { insert } from "../src/insert.js"
import { remove } from "../src/operations.js"

export const SANDBOX = "test-sandbox"
export const EMPTY = "test-clean"

const TEST_SIZE = process.env.TEST_SIZE || 10

function id(number, max) {
  return number.toString().padStart(max.toString().length, "0")
}

function* data() {
  for (let i = 0; i < TEST_SIZE; i++) {
    yield [id(i, TEST_SIZE), { number: i, odd: i % 2 }]
  }
}

export function setup(db) {
  return Promise.all([
    remove(db, SANDBOX, { where: [] }).then(() => insert(db, SANDBOX, data())),
    remove(db, EMPTY, { where: [] }),
  ])
}

function unbox(snapshot) {
  return snapshot.docs.map((element) => element.data())
}

export function getBothCollections(db) {
  return async () => ({
    [SANDBOX]: unbox(await db.collection(SANDBOX).get()),
    [EMPTY]: unbox(await db.collection(EMPTY).get()),
  })
}

export async function getIds(db, collection) {
  return (await db.collection(collection).get()).docs.map((element) => element.id)
}

export function testObject(number) {
  if (number && typeof number === "object") {
    return expect.objectContaining(number)
  }
  return expect.objectContaining({ number })
}

export function testArray(array) {
  return expect.arrayContaining(array)
}

export function testNumbers({
  mod = 1,
  remainder = 0,
  limit = TEST_SIZE,
  transform = (_) => testObject(_),
  fallback = () => false,
  unordered = false,
} = {}) {
  const results = []
  for (let number = 0; number < limit; number++) {
    if (number % mod === remainder) {
      results.push(transform(number))
    } else if (fallback(number)) {
      results.push(testObject(number))
    }
  }
  if (unordered) {
    return testArray(results)
  }
  return results
}
