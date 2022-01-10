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

To force the creation of smaller batches, use `batchDivisor` as in:

```js
db.remove(collection, { where: [], batchDivisor: 2 })
```
