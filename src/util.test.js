import { autotest } from "@tim-code/autotest"
import { chunk, findIndexes, separate } from "./util.js"

const data = [1, 2, 3, 4, 5]
autotest(chunk)(data, 1)([[1], [2], [3], [4], [5]])
autotest(chunk)(data, 2)([[1, 2], [3, 4], [5]])

autotest(findIndexes)(data, (number) => number % 2 === 0)([1, 3])

autotest(separate)(data, 1)([[1], 2, [3, 4, 5]])
