import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { SANDBOX as coll, setup, testNumbers } from "../test/data.js"
import { query } from "./query.js"

const db = new Firestore()

beforeAll(() => setup(db))

const after = (elements) => elements.map((element) => element.data())
const options = { after }

autotest(query, options)(db, coll, {
  where: [["odd", "==", 1]],
})(testNumbers({ mod: 2, remainder: 1 }))
autotest(query, options)(db, coll, { where: { odd: 1 } })(
  testNumbers({ mod: 2, remainder: 1 })
)
autotest(query, options)(db, coll, { where: { number: [1, 2] } })([
  expect.objectContaining({ number: 1 }),
  expect.objectContaining({ number: 2 }),
])
autotest(query, options)(db, coll, { limit: 5 })(testNumbers({ limit: 5 }))
autotest(query, options)(db, coll, {
  where: { number: { $lt: 10 } },
  orderBy: { number: "desc" },
})(testNumbers({ limit: 10 }).reverse())

const eleven = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
autotest(query, options)(db, coll, { where: { number: eleven } })(testNumbers({ limit: 12 }))
