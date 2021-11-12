import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { copy, move, query, remove, update } from "./index.js"

const db = new Firestore()
const test1 = "test1"
const test2 = "test2"

const first = { name: "a", test: 1 }
const second = { name: "b", test: 2 }
const third = { name: "c", test: 3 }
const fourth = { name: "d", test: 2 }
const fifth = { name: "e", test: 5 }
const setup = () =>
  Promise.all([
    db.collection(test1).doc(first.name).set(first),
    db.collection(test1).doc(second.name).set(second),
    db.collection(test1).doc(third.name).set(third),
    db.collection(test1).doc(fourth.name).set(fourth),
    db.collection(test1).doc(fifth.name).set(fifth),
    db.collection(test2).doc(first.name).delete(),
    db.collection(test2).doc(second.name).delete(),
    db.collection(test2).doc(third.name).delete(),
    db.collection(test2).doc(fourth.name).delete(),
    db.collection(test2).doc(fifth.name).delete(),
  ])

const afterQuery = (snapshot) => snapshot.docs.map((element) => element.data())
const where = [["test", "==", 2]]
autotest(query, { setup, after: afterQuery })(db, test1, { where })([second, fourth])
autotest(query, { setup, after: afterQuery })(db, test1, { where: { test: 2 } })([
  second,
  fourth,
])
autotest(query, { setup, after: afterQuery })(db, test1, { where: { test: [1, 2] } })([
  first,
  second,
  fourth,
])
autotest(query, { setup, after: afterQuery })(db, test1, { orderBy: { name: "desc" } })([
  fifth,
  fourth,
  third,
  second,
  first,
])

const options = { where, limit: 1 }
autotest(query, { setup, after: afterQuery })(db, test1, options)([second])
const after = async () => ({
  [test1]: afterQuery(await db.collection(test1).get()),
  [test2]: afterQuery(await db.collection(test2).get()),
})

const transform = ({ test }) => ({ test: test * 10 })
autotest(update, { setup, after })(db, test1, {
  ...options,
  transform,
})({
  test1: [first, { ...second, test: 20 }, third, { ...fourth, test: 20 }, fifth],
  test2: [],
})

autotest(remove, { setup, after })(db, test1, { where })({
  test1: [first, third, fifth],
  test2: [],
})

autotest(move, { setup, after })(db, test1, test2, { where })({
  test1: [first, third, fifth],
  test2: [second, fourth],
})

autotest(copy, { setup, after })(db, test1, test2, { where })({
  test1: [first, second, third, fourth, fifth],
  test2: [second, fourth],
})
