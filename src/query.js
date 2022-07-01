import { chunk, findIndexes, separate } from "./util.js"

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
    if (value.$ne !== undefined) {
      clauses.push([key, "!=", value.$ne])
    }
    if (value.$eq !== undefined) {
      clauses.push([key, "==", value.$eq])
    }
    if (clauses.length) {
      if (Object.keys(value).length !== clauses.length) {
        throw new Error("not all keys were processed when $ conditional detected")
      }
      return clauses
    }
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
  if (typeof orderBy === "string") {
    return { [orderBy]: "asc" }
  }
  if (Array.isArray(orderBy)) {
    return Object.fromEntries(orderBy.map((key) => [key, "asc"]))
  }
  if (orderBy && typeof orderBy === "object") {
    return orderBy
  }
  throw new Error("orderBy must be an object, array of strings, or string")
}

function checkSelect(select) {
  if (typeof select === "string") {
    return [select]
  }
  if (Array.isArray(select)) {
    return select
  }
  if (!select) {
    return undefined
  }
  throw new Error("select must be a string or array")
}

function rawQuery(db, collection, { where, orderBy, limit, select, last }) {
  let request = db.collection(collection)
  for (const clause of where) {
    request = request.where(...clause)
  }
  for (const [key, sort] of Object.entries(orderBy)) {
    request = request.orderBy(key, sort)
  }
  if (select) {
    request = request.select(...select)
  }
  if (last) {
    request = request.startAfter(last)
  }
  request = request.limit(limit)
  return request.get()
}

function chunkClauseValueAt(index, clauseSize = 10) {
  return (where) => {
    const [before, [field, , value], after] = separate(where, index)
    return chunk(value, clauseSize).map((valueSubset) => {
      let newClause
      if (clauseSize === 1) {
        newClause = [field, "==", valueSubset[0]]
      } else {
        newClause = [field, "in", valueSubset]
      }
      const newWhere = [before, [newClause], after].flat()
      return newWhere
    })
  }
}

export const QUERY_LIMIT = 500

export function query(
  db,
  collection,
  {
    where = [],
    orderBy = [],
    limit = QUERY_LIMIT,
    select = undefined,
    last = undefined,
    log = false,
  } = {}
) {
  where = checkWhere(where)
  orderBy = checkOrderBy(orderBy)
  select = checkSelect(select)

  if (log) {
    // eslint-disable-next-line no-console
    console.log(`${new Date().toLocaleString()}: request started:`, where)
  }

  let wheres = [where]
  const indexes = findIndexes(where, ([, operator]) => operator === "in")
  for (const index of indexes) {
    const clauseSize = index === indexes[0] ? 10 : 1
    wheres = wheres.map(chunkClauseValueAt(index, clauseSize)).flat()
  }
  if (wheres.length > 10) {
    throw new Error("cannot create more than 10 queries from one request")
  }

  const rawOptions = (w) => ({ where: w, orderBy, limit, select, last })
  const promises = wheres.map((w) => rawQuery(db, collection, rawOptions(w)))
  return Promise.all(promises).then((results) => {
    const docs = results.map((_) => _.docs).flat()
    if (log) {
      // eslint-disable-next-line no-console
      console.log(`${new Date().toLocaleString()}: request finished:`, where)
    }
    return docs
  })
}

export function unbox(docs) {
  if (!docs) {
    throw new Error("argument to unbox is falsey")
  }
  if (typeof docs.then === "function") {
    return docs.then(unbox)
  }
  return docs.map((doc) => doc.data())
}
