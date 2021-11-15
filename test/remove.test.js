import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { remove } from "../src/operations.js"
import { both, EMPTY, SANDBOX, setup, testNumbers } from "../test/data.js"

const db = new Firestore()
const testOptions = { setup: () => setup(db), after: both(db) }
const operateOptions = { where: { odd: 1 } }

autotest(remove, testOptions)(db, SANDBOX, operateOptions)({
  [SANDBOX]: testNumbers({ mod: 2 }),
  [EMPTY]: [],
})
