# firestore-util

```
npm install @tim-code/firestore-util
```

## Philosophy

The Firestore SDK exposes a lot of functionality; however, it could be easier to use especially for common operations.

`batch` operations are key to controlling the number of network request; however, they can only be done 500 at time.

This zero-dependency library offers common operations such as `insert`, `update`, `move`, `copy`, and `remove` that make use of batch correctly.

To support this, `query` is also offered with `where` and `limit` options to allow for a query to be specified with a write operation.

## Example

```js
import { Firestore } from "@google-cloud/firestore"
import { query, unbox } from "./src/query.js"

const db = new Firestore() // assumes your environment variables are setup correctly
const collection = "..."
query(db, collection).then(unbox).then(console.log)
```

## Six Functions

```js
query(db, collection, { where, orderBy, limit })
```

Returns documents that match a query using Firestore's `get` function.

`where` is an object and supports some typical NoSQL syntax: `$lt`, `$gt`, `$lte`, `$gte`, `$ne`, `$eq`. Examples: `where: {date: "2021-01-01"}}` or `where: {date: {$gte: "2021-01-01", $lte: 2022-01-01}}`

`where` can also contain arrays which correspond to Firestore `in` clauses: `where: {date: ["2021-01-01", "2021-01-02"]}`

`orderBy` can be a field name, an array of field names, or an object which specifies order: `orderBy: {name: "desc"}`.

`limit` restricts the amount of documents returned. By default, it is 500.

`unbox()` is an additional function exported that will return the actual documents when passed the query result as in the introductory example.

```js
insert(db, collection, [[id1, data1], [id2, data2], ...], {merge})
```

Insert documents using Firestore's `set` function.

When `merge` is truthy, `insert()` will deep merge the data being inserted with an existing document if they would have the same ID. If not truthy and there would be two documents with same ID resulting from an insert, an error will be thrown.

https://stackoverflow.com/questions/46597327/difference-between-set-with-merge-true-and-update

```js
update(db, collection, { transform, where, limit })
```

Update documents using a callback and Firestore's `update` function.

`transform` is a callback that is passed a document and is expected to return a document update. This does not need to be an entire document.

`where` uses the same syntax as `query()`.

`limit` is optional. It does not affect the number of documents changed. Rather, it limits how many documents are updated at once. See below for details on why this might be useful.

```js
copy(db, collection, { name, where, transform, limit })
```

Copy documents from one collection to another using `set`.

`name` is an optional callback that is passed a document and its old ID. By default, it is `(element, oldId) => oldId`

`transform` is optional.

```js
move(db, collection, { name, where, transform, limit })
```

Move documents from one collection to another using `delete` and `set`.

```js
remove(db, collection, { where, limit })
```

Remove documents using Firestore's `delete` function

## Performance with Parallel Write Operations

Firestore only allows 10000 writes in one second. By default, `firestore-util` limits the write operations possible in one second to 2000 due to one call of a `firestore-util` function. This can be increased or decreased by changing the `limit` parameter to the function:

```js
import { insert } from "firestore-util"
// allow theoretical maximum writes per second
insert(db, "collection", data, { limit: 10000 })
```

## "Transaction too big. Decrease transaction size."

Firestore limits how large a transaction and batch can be.

Limit how many documents are modified across all batches in a one second iteration by setting the `limit` parameter:

```js
import { remove } from "firestore-util"
remove(db, collection, { where: [], limit: 100 })
```

## "Deadline Exceeded"

From https://github.com/firebase/firebase-admin-node/issues/499:

"Generally, a deadline exceeded error indicates that the rpc took too long to complete. Firestore sets a deadline of 60s, so I'd expect these errors to occur pretty much precisely 60s after the query was initiated. I suppose an exceptionally large query could cause this to occur, or perhaps your process being preempted for 60s(!)."

Basically, this error occurs when data isn't being processed quickly enough by Firestore servers.

Firestore has a commonly overlooked limit: "Maximum write rate to a collection in which documents contain sequential values in an indexed field" of 500 per second.

A common example of this sort of field are timestamps. The best solution is to add an exemption to such fields.

https://stackoverflow.com/questions/55818648/firestore-500-writes-per-second-to-one-collection

## Environment Variables

To aid testing, there are a few environment variables which create large tests and are used in `package.json`. These do not need to be set.

`TEST_SIZE`: the number of objects to put into the database

`BATCH_SIZE`: the number of objects to put into a batch

`CONCURRENT`: the number of batches executed in parallel
