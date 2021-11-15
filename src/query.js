import { chunk, findIndexes, separate } from "./util.js"

export function checkWhere(where) {
  if (Array.isArray(where)) {
    return where
  } else if (where && typeof where === "object") {
    const operator = (value) => (Array.isArray(value) ? "in" : "==")
    const clause = ([key, value]) => [key, operator(value), value]
    return Object.entries(where).map(clause)
  }
  throw new Error("where must be an array of clauses or an object to equal")
}

export function checkOrderBy(orderBy) {
  if (Array.isArray(orderBy)) {
    return Object.fromEntries(orderBy.map((key) => [key, "asc"]))
  }
  if (orderBy && typeof orderBy === "object") {
    return orderBy
  }
  throw new Error("where must be an array of clauses or an object to equal")
}

function rawQuery(db, collection, { where, orderBy, limit, last }) {
  let request = db.collection(collection)
  for (const clause of where) {
    request = request.where(...clause)
  }
  for (const [key, sort] of Object.entries(orderBy)) {
    request = request.orderBy(key, sort)
  }
  if (last) {
    request = request.startAfter(last)
  }
  request = request.limit(limit)
  return request.get()
}

const CLAUSE_SIZE = 10

export function chunkClauseValueAt(index) {
  return (where) => {
    const [before, [field, operator, value], after] = separate(where, index)
    return chunk(value, CLAUSE_SIZE).map((valueSubset) => {
      const newClause = [field, operator, valueSubset]
      const newWhere = [before, [newClause], after].flat()
      return newWhere
    })
  }
}

export const QUERY_LIMIT = 500

export function query(
  db,
  collection,
  { where = [], orderBy = [], limit = QUERY_LIMIT, last = undefined } = {}
) {
  where = checkWhere(where)
  orderBy = checkOrderBy(orderBy)

  let wheres = [where]
  const indexes = findIndexes(where, ([, operator]) => operator === "in")
  for (const index of indexes) {
    wheres = wheres.map(chunkClauseValueAt(index)).flat()
  }

  const rawOptions = (w) => ({ where: w, orderBy, limit, last })
  const promises = wheres.map((w) => rawQuery(db, collection, rawOptions(w)))
  return Promise.all(promises).then((results) => results.map((_) => _.docs).flat())
}
