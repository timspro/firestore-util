import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { update } from "../src/operations.js"
import { both, EMPTY, SANDBOX, setup, testNumbers } from "./data.js"

const db = new Firestore()
const testOptions = { setup: () => setup(db), after: both(db) }
const operateOptions = { where: { odd: 1 } }

const transform = ({ number }) => ({ test: number * 10 })
autotest(update, testOptions)(db, SANDBOX, {
  ...operateOptions,
  transform,
})({
  [SANDBOX]: testNumbers({
    mod: 2,
    remainder: 1,
    transform: (number) => ({ number, test: number * 10 }),
    fallback: () => true,
  }),
  [EMPTY]: [],
})
