# firestore-util

```
npm install @tim-code/firestore-util
```

## Philosophy

The Firestore SDK exposes a lot of functionality; however, it could be easier to use especially for common operations.

`batch` operations are key to controlling the number of network request; however, they can only be done 500 at time.

This zero-dependency library offers common operations such as `update`, `remove`, `copy`, `remove` that make use of batch correctly.

To support this, `query` is also offered with `where` and `limit` options to allow for a query to be specified with data.
