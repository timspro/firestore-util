import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { EMPTY, SANDBOX, setup } from "../test/data.js"
import { copy, move, remove, update } from "./operations.js"

const db = new Firestore()

const unbox = (snapshot) => snapshot.docs.map((element) => element.data())
const after = async () => ({
  [SANDBOX]: unbox(await db.collection(SANDBOX).limit(5).get()),
  [EMPTY]: unbox(await db.collection(EMPTY).limit(5).get()),
})
const testOptions = { setup: setup(db), after }
const operateOptions = { limit: 10, operations: 100, where: { even: 1 } }
function o(number, extra = {}) {
  return expect.objectContaining({ number, ...extra })
}

const transform = ({ number }) => ({ test: number * 10 })
autotest(update, testOptions)(db, SANDBOX, {
  ...operateOptions,
  transform,
})({
  [SANDBOX]: [o(0), o(1, { test: 10 }), o(10), o(11), o(12)],
  [EMPTY]: [],
})

autotest(remove, testOptions)(db, SANDBOX, operateOptions)({
  [SANDBOX]: [o(0), o(10), o(12), o(14), o(16)],
  [EMPTY]: [],
})

autotest(move, testOptions)(db, SANDBOX, EMPTY, operateOptions)({
  [SANDBOX]: [o(0), o(10), o(12), o(14), o(16)],
  [EMPTY]: [o(1), o(11), o(13), o(15), o(17)],
})

autotest(copy, testOptions)(db, SANDBOX, EMPTY, operateOptions)({
  [SANDBOX]: [o(0), o(1), o(10), o(11), o(12)],
  [EMPTY]: [o(1), o(11), o(13), o(15), o(17)],
})
