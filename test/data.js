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

const unbox = (snapshot) => snapshot.docs.map((element) => element.data())

export function both(db) {
  return async () => ({
    [SANDBOX]: unbox(await db.collection(SANDBOX).get()),
    [EMPTY]: unbox(await db.collection(EMPTY).get()),
  })
}

export function object(number) {
  if (number && typeof number === "object") {
    return expect.objectContaining(number)
  }
  return expect.objectContaining({ number })
}

export function testNumbers({
  mod = 1,
  remainder = 0,
  limit = TEST_SIZE,
  transform = (_) => _,
  fallback = () => false,
} = {}) {
  const results = []
  for (let i = 0; i < limit; i++) {
    if (i % mod === remainder) {
      results.push(object(transform(i)))
    } else if (fallback(i)) {
      results.push(object(i))
    }
  }
  return results
}
