import { shuffleArrayInPlace } from './Random'

export const createCipher = (plaintext: string, baseChar: string, numChars: number) => {
  const arr = new Array(numChars).fill(null).map((_, i) => i)
  shuffleArrayInPlace(arr)

  const encryptor: Record<string, string> = {}
  const decryptor: Record<string, string> = {}

  const base = baseChar.charCodeAt(0)
  for (let i = 0; i < arr.length; ++i) {
    const plainChar = String.fromCharCode(base + i)

    if (!plaintext.includes(plainChar)) {
      continue
    }

    const cipherChar = String.fromCharCode(base + arr[i])
    encryptor[plainChar] = cipherChar
    decryptor[cipherChar] = plainChar
  }

  return { encryptor, decryptor }
}
