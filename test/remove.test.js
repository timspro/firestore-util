import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { remove } from "../src/operations.js"
import { EMPTY, getBothCollections, SANDBOX, setup, testNumbers } from "./util.js"

const db = new Firestore()
const testOptions = { setup: () => setup(db), after: getBothCollections(db) }
const operateOptions = { where: { odd: 1 } }

autotest(remove, testOptions)(db, SANDBOX, operateOptions)({
  [SANDBOX]: testNumbers({ mod: 2 }),
  [EMPTY]: [],
})
