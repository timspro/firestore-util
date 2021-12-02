import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { update } from "../src/operations.js"
import { EMPTY, getBothCollections, SANDBOX, setup, testNumbers, testObject } from "./util.js"

const db = new Firestore()
const testOptions = { setup: () => setup(db), after: getBothCollections(db) }
const operateOptions = { where: { odd: 1 } }

const transform = ({ number }) => ({ test: number * 10 })
autotest(update, testOptions)(db, SANDBOX, {
  ...operateOptions,
  transform,
})({
  [SANDBOX]: testNumbers({
    mod: 2,
    remainder: 1,
    transform: (number) => testObject({ number, test: number * 10 }),
    fallback: () => true,
  }),
  [EMPTY]: [],
})
