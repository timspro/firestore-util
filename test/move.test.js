import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { move } from "../src/operations.js"
import { both, EMPTY, SANDBOX, setup, testNumbers } from "./data.js"

const db = new Firestore()
const testOptions = { setup: () => setup(db), after: both(db) }
const operateOptions = { where: { odd: 1 } }

autotest(move, testOptions)(db, SANDBOX, EMPTY, operateOptions)({
  [SANDBOX]: testNumbers({ mod: 2 }),
  [EMPTY]: testNumbers({ mod: 2, remainder: 1 }),
})