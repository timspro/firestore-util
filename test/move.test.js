import { Firestore } from "@google-cloud/firestore"
import { autotest } from "@tim-code/autotest"
import { move } from "../src/operations.js"
import {
  EMPTY,
  getBothCollections,
  getIds,
  SANDBOX,
  setup,
  string,
  testNumbers,
} from "./util.js"

const db = new Firestore()
const testOptions = { setup: () => setup(db) }
const operateOptions = { where: { odd: 1 } }

const input1 = [db, SANDBOX, EMPTY, operateOptions]
autotest(move, { ...testOptions, after: getBothCollections(db) })(...input1)({
  [SANDBOX]: testNumbers({ mod: 2 }),
  [EMPTY]: testNumbers({ mod: 2, remainder: 1 }),
})

const input2 = [db, SANDBOX, EMPTY, { ...operateOptions, name: ({ number }) => `A${number}` }]
autotest(move, { ...testOptions, after: () => getIds(db, EMPTY) })(...input2)(
  testNumbers({
    mod: 2,
    remainder: 1,
    transform: (number) => string(`A${number}`),
    unordered: true,
  })
)
