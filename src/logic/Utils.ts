export const areRecordsEqual = (
  record1: Record<string, string>,
  record2: Record<string, string>,
) => {
  const keys1 = Object.keys(record1)
  const keys2 = Object.keys(record2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (let key of keys1) {
    if (record1[key] !== record2[key]) {
      return false
    }
  }

  return true
}
