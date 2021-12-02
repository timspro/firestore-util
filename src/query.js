import { chunk, findIndexes, separate } from "./util.js"

// eslint-disable-next-line max-statements
function objectClause([key, value]) {
  if (value === undefined) {
    return undefined
  }
  if (Array.isArray(value)) {
    return [[key, "in", value]]
  }
  if (value && typeof value === "object") {
    const clauses = []
    if (value.$lt !== undefined) {
      clauses.push([key, "<", value.$lt])
    }
    if (value.$gt !== undefined) {
      clauses.push([key, ">", value.$gt])
    }
    if (value.$lte !== undefined) {
      clauses.push([key, "<=", value.$lte])
    }
    if (value.$gte !== undefined) {
      clauses.push([key, ">=", value.$gte])
    }
    return clauses
  }
  return [[key, "==", value]]
}

function checkWhere(where) {
  if (Array.isArray(where)) {
    return where
  } else if (where && typeof where === "object") {
    return Object.entries(where)
      .map(objectClause)
      .filter((_) => _)
      .flat()
  }
  throw new Error("where must be an array of clauses or an object to equal")
}

function checkOrderBy(orderBy) {
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

function chunkClauseValueAt(index) {
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
