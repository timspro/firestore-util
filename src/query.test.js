import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { SANDBOX as coll, setup } from "../test/data.js"
import { query } from "./query.js"

const db = new Firestore()
const after = (elements) => elements.map((element) => element.data())
const options = { setup: setup(db), after }

const result = expect.arrayContaining([
  expect.objectContaining({ number: 20 }),
  expect.objectContaining({ number: 40 }),
  expect.objectContaining({ number: 60 }),
  expect.objectContaining({ number: 80 }),
])
autotest(query, options)(db, coll, { where: [["twenty", "==", 0]] })(result)
autotest(query, options)(db, coll, { where: { twenty: 0 } })(result)
autotest(query, options)(db, coll, { where: { number: [1, 2] } })([
  expect.objectContaining({ number: 1 }),
  expect.objectContaining({ number: 2 }),
])
autotest(query, options)(db, coll, { orderBy: { number: "desc" }, limit: 3 })([
  expect.objectContaining({ number: 99 }),
  expect.objectContaining({ number: 98 }),
  expect.objectContaining({ number: 97 }),
])

const eleven = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
autotest(query, options)(db, coll, { where: { number: eleven } })([
  expect.objectContaining({ number: 0 }),
  expect.objectContaining({ number: 1 }),
  expect.objectContaining({ number: 2 }),
  expect.objectContaining({ number: 3 }),
  expect.objectContaining({ number: 4 }),
  expect.objectContaining({ number: 5 }),
  expect.objectContaining({ number: 6 }),
  expect.objectContaining({ number: 7 }),
  expect.objectContaining({ number: 8 }),
  expect.objectContaining({ number: 9 }),
  expect.objectContaining({ number: 10 }),
  expect.objectContaining({ number: 11 }),
])
