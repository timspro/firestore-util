export function chunk(array, size) {
  const results = []
  for (let i = 0; i < array.length; i += size) {
    results.push(array.slice(i, i + size))
  }
  return results
}

export function findIndexes(array, callback) {
  const results = []
  for (let index = 0; index < array.length; index++) {
    const element = array[index]
    if (callback(element)) {
      results.push(index)
    }
  }
  return results
}

export function separate(array, index) {
  return [array.slice(0, index), array[index], array.slice(index + 1)]
}
