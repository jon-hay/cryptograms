export const getRandomIntegerInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const shuffleArrayInPlace = (arr: any[]) => {
  for (let i = arr.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[j]
    arr[j] = arr[i]
    arr[i] = tmp
  }
}
