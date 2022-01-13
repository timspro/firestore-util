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

To force the creation of smaller batches, use `batchDivisor` as in:

```js
import { remove } from "firestore-util"
remove(db, collection, { where: [], batchDivisor: 2 })
```

## Performance and Parallel Write Operations ("Deadline Exceeded")

Firestore only allows 10000 writes in one second. By default, `firestore-util` limits the write operations possible in one second to 2000 due to one call of a `firestore-util` function. This can be increased or decreased by changing the `limit` parameter to the function:

```js
import { insert } from "firestore-util"
// allow theoretical maximum writes per second
insert(db, "collection", data, { limit: 10000 })
```
