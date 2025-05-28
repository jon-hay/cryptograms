export enum CellState {
  NONLETTER,
  UNGUESSED,
  GUESSED,
  CONFLICTED,
}

export const createGrid = (
  plaintext: string,
  encryptor: Record<string, string>,
  guessedDecryptor: Record<string, string>,
  conflictedChar: string,
  gridWidth: number,
  cellWidth: number,
) => {
  const plainWords = plaintext.split(/(\s+)/)

  const minCols = Math.max(...plainWords.map((w, _) => w.length))
  const numCols = Math.max(minCols, Math.floor(gridWidth / cellWidth))
  cellWidth = Math.floor(gridWidth / numCols)

  let cells: { cellContent: string; cellState: CellState }[] = []
  let remainingCols = numCols

  for (let i = 0; i < plainWords.length; ++i) {
    const plainWord = plainWords[i]

    if (/^\s+$/.test(plainWord)) {
      if (plainWord.includes('\n')) {
        for (let c = 0; c < remainingCols; ++c) {
          cells.push({ cellContent: ' ', cellState: CellState.NONLETTER })
        }
        remainingCols = numCols
      } else if (remainingCols > 0) {
        cells.push({ cellContent: ' ', cellState: CellState.NONLETTER })
        --remainingCols
      }
      continue
    }

    if (remainingCols < plainWord.length) {
      for (let c = 0; c < remainingCols; ++c) {
        cells.push({ cellContent: ' ', cellState: CellState.NONLETTER })
      }
      remainingCols = numCols
    }

    plainWord.split('').forEach((plainChar) => {
      const isLetter = plainChar in encryptor
      if (!isLetter) {
        cells.push({ cellContent: plainChar, cellState: CellState.NONLETTER })
      } else {
        const cipherChar = encryptor[plainChar]
        const isGuessed = cipherChar in guessedDecryptor
        if (!isGuessed) {
          cells.push({ cellContent: cipherChar, cellState: CellState.UNGUESSED })
        } else {
          const cellContent = guessedDecryptor[cipherChar]
          if (cellContent !== conflictedChar) {
            cells.push({ cellContent: cellContent, cellState: CellState.GUESSED })
          } else {
            cells.push({ cellContent: cellContent, cellState: CellState.CONFLICTED })
          }
        }
      }
    })

    remainingCols -= plainWord.length
  }

  return { numCols, cellWidth, cells }
}
