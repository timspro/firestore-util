import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { insert } from "../src/operations.js"
import {
  data,
  EMPTY,
  getBothCollections,
  SANDBOX,
  setup,
  testNumbers,
  testObject,
} from "./util.js"

const db = new Firestore()
const testOptions = { setup: () => setup(db), after: getBothCollections(db) }
const operateOptions = { merge: true }

const insertions = Array.from(data())
  .filter(([, { odd }]) => odd)
  .map(([id, { number }]) => [id, { test: number * 10 }])
autotest(insert, testOptions)(db, SANDBOX, insertions, operateOptions)({
  [SANDBOX]: testNumbers({
    mod: 2,
    remainder: 1,
    transform: (number) => testObject({ number, test: number * 10 }),
    fallback: () => true,
  }),
  [EMPTY]: [],
})
