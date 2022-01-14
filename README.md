# firestore-util

```
npm install @tim-code/firestore-util
```

## Philosophy

The Firestore SDK exposes a lot of functionality; however, it could be easier to use especially for common operations.

`batch` operations are key to controlling the number of network request; however, they can only be done 500 at time.

This zero-dependency library offers common operations such as `update`, `remove`, `copy`, `remove` that make use of batch correctly.

To support this, `query` is also offered with `where` and `limit` options to allow for a query to be specified with data.

## Environment Variables

To aid testing, there are a few environment variables which create large tests and are used in `package.json`:

`TEST_SIZE`: the number of objects to put into the database

`BATCH_SIZE`: the number of objects to put into a batch

`CONCURRENT`: the number of batches executed in parallel

## "Transaction too big. Decrease transaction size."

Firestore limits how large a transaction and batch can be.

Limit how many documents are modified across all batches in one iteration by setting the `limit` parameter:

```js
import { remove } from "firestore-util"
remove(db, collection, { where: [], limit: 100 })
```

## Performance and Parallel Write Operations

Firestore only allows 10000 writes in one second. By default, `firestore-util` limits the write operations possible in one second to 2000 due to one call of a `firestore-util` function. This can be increased or decreased by changing the `limit` parameter to the function:

```js
import { insert } from "firestore-util"
// allow theoretical maximum writes per second
insert(db, "collection", data, { limit: 10000 })
```

## "Deadline Exceeded"

Firestore has a a very specific limit: "Maximum write rate to a collection in which documents contain sequential values in an indexed field" of 500 per second.

This may be due to "hotspots" on an indexed field due to a timestamp. The best solution is to add an exemption to such fields.
