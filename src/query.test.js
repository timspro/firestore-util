import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { SANDBOX as collection, setup, testNumbers, testObject } from "../test/util.js"
import { query, unbox } from "./query.js"

const db = new Firestore()

beforeAll(() => setup(db))

const options = { after: unbox }

autotest(query, options)(db, collection, {
  where: [["odd", "==", 1]],
})(testNumbers({ mod: 2, remainder: 1 }))

autotest(query, options)(db, collection, { where: { odd: 1 } })(
  testNumbers({ mod: 2, remainder: 1 })
)

autotest(query, options)(db, collection, { where: { number: [1, 2] } })([
  testObject(1),
  testObject(2),
])

autotest(query, options)(db, collection, { limit: 5 })(testNumbers({ limit: 5 }))

autotest(query, options)(db, collection, {
  where: { number: { $gt: 0, $lt: 10 } },
  orderBy: { number: "desc" },
})(testNumbers({ limit: 10 }).slice(1).reverse())

const errorInput = [db, collection, { where: { number: { $gt: 0, lt: 10 } } }]
autotest(query, { ...options, error: true })(...errorInput)(expect.objectContaining({}))

const eleven = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
autotest(query, options)(db, collection, { where: { number: eleven } })(
  testNumbers({ limit: 12 })
)

autotest(query, options)(db, collection, { where: { number: 1 }, select: "number" })([
  { number: 1 },
])

autotest(query, options)(db, collection, {
  where: { number: [0, 1, 2, 3, 4], odd: [0, 1] },
})(
  testNumbers({ limit: 5, mod: 2, remainder: 0 }).concat(
    testNumbers({ limit: 5, mod: 2, remainder: 1 })
  )
)
