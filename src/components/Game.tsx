import React, { useRef, useState } from 'react'
import useContainerWidth from '../hooks/ContainerWidth'
import { createCipher } from '../logic/Cipher'
import { CellState, createGrid } from '../logic/Grid'
import { getRandomIntegerInRange } from '../logic/Random'
import { areRecordsEqual } from '../logic/Utils'

type GameProps = {
  texts: string[]
}

const Game: React.FC<GameProps> = ({ texts }) => {
  const defaultCellWidth = 15
  const defaultBuffer = 20
  const [baseChar, numChars] = ['A', 26]
  const lastChar = String.fromCharCode(baseChar.charCodeAt(0) + numChars - 1)

  const [textIndex] = useState(getRandomIntegerInRange(0, texts.length - 1))
  const [plaintext] = useState(texts[textIndex].toUpperCase())
  const [encryptor] = useState(createCipher(plaintext, baseChar, numChars).encryptor)

  const [guessedEncryptor, setGuessedEncryptor] = useState<Record<string, string>>({})
  const [guessedDecryptor, setGuessedDecryptor] = useState<Record<string, string>>({})
  const [conflictedChar, setConflictedChar] = useState('')
  const [focusedCell, setFocusedCell] = useState(0)
  const hasWon = areRecordsEqual(encryptor, guessedEncryptor)
  const hasFilledNotWon =
    !hasWon && Object.keys(encryptor).length === Object.keys(guessedEncryptor).length

  if (hasWon || hasFilledNotWon) {
    window.scrollTo(0, 0)
  }

  const { containerWidth: gridWidth, containerRef: gridRef } = useContainerWidth()

  const { numCols, cellWidth, cells } = createGrid(
    plaintext,
    encryptor,
    guessedDecryptor,
    conflictedChar,
    gridWidth - defaultBuffer,
    defaultCellWidth,
  )

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    const currCell = cells[i]

    /* Navigation */

    let dst = i

    const gotoDst = () => {
      if (dst !== i) {
        inputRefs.current[dst]?.focus()
        e.preventDefault()
        return true
      }

      return false
    }

    const gotoNext = () => {
      let looped = false
      dst = Math.min(cells.length - 1, i + 1)

      while (
        (!looped || dst < cells.length - 1) &&
        (cells[dst].cellState !== CellState.UNGUESSED ||
          cells[dst].cellContent === currCell.cellContent)
      ) {
        ++dst

        if (dst > cells.length - 1) {
          dst = 0
          looped = true
        }
      }

      return gotoDst()
    }

    if (e.key === 'ArrowLeft') dst = Math.max(0, i - 1)
    if (e.key === 'ArrowRight') dst = Math.min(cells.length - 1, i + 1)
    if (e.key === 'ArrowUp') dst = Math.max(0, i - numCols)
    if (e.key === 'ArrowDown') dst = Math.min(cells.length - 1, i + numCols)

    if (gotoDst()) {
      return
    }

    /* Deletion */

    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (e.key === 'Backspace'
        && currCell.cellState !== CellState.GUESSED
        && currCell.cellState !== CellState.CONFLICTED
      ) {
        dst = Math.max(0, i - 1)
        gotoDst()
      }

      // Delete guess

      setGuessedEncryptor((guessedEncryptor) => {
        const { [cells[dst].cellContent]: cipherChar, ...rest } = guessedEncryptor

        setGuessedDecryptor((guessedDecryptor) => {
          const { [cipherChar]: _, ...rest } = guessedDecryptor
          return { ...rest }
        })

        if (conflictedChar === cells[dst].cellContent) {
          setConflictedChar('')
        }

        return { ...rest }
      })
    }

    /* Input */

    if (e.key.length === 1) {
      // Cannot make guesses for nonletters
      if (currCell.cellState === CellState.NONLETTER) {
        return
      }

      // Cannot guess letters as nonletters
      const pressedChar = e.key.toUpperCase()
      if (!(baseChar <= pressedChar && pressedChar <= lastChar)) {
        return
      }

      // Guessing the same thing, do nothing
      if (currCell.cellState !== CellState.UNGUESSED && currCell.cellContent === pressedChar) {
        gotoNext()
        return
      }

      if (pressedChar in guessedEncryptor) {
        // Prompt that there is a conflict
        setConflictedChar(pressedChar)
        return
      } else {
        setConflictedChar('')

        if (currCell.cellState === CellState.UNGUESSED) {
          // New guess

          setGuessedEncryptor((guessedEncryptor) => ({
            ...guessedEncryptor,
            [pressedChar]: currCell.cellContent,
          }))

          setGuessedDecryptor((guessedDecryptor) => ({
            ...guessedDecryptor,
            [currCell.cellContent]: pressedChar,
          }))
        } else {
          // Replace guess

          setGuessedEncryptor((guessedEncryptor) => {
            const { [currCell.cellContent]: cipherChar, ...rest } = guessedEncryptor

            setGuessedDecryptor((guessedDecryptor) => ({
              ...guessedDecryptor,
              [cipherChar]: pressedChar,
            }))

            return { ...rest, [pressedChar]: cipherChar }
          })
        }

        gotoNext()
        return
      }
    }
  }

  return (
    <div className='game'>
      <div className='header'>
        {hasWon && <h1>You Win!</h1>}
        {!hasWon && (
          <>
            <p>Break the code! Every letter has been (possibly) substituted by another letter.</p>
            {conflictedChar !== '' ? (
              <p>
                You've used the letter{' '}
                <span className='cell conflicted'>
                  <code>{conflictedChar}</code>
                </span>{' '}
                already! Consider deleting it first.
              </p>
            ) : hasFilledNotWon ? (
              <p>
                Hmm, <span className='cell conflicted'>something isn't quite right...</span>
              </p>
            ) : (
              <p>
                Click on each{' '}
                <span className='cell unguessed'>
                  <code>UNSOLVED</code>
                </span>{' '}
                letter and type in the{' '}
                <span className='cell guessed'>
                  <code>CORRECT</code>
                </span>{' '}
                letter you think it should be.
              </p>
            )}
          </>
        )}
      </div>
      <div
        className='grid'
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${numCols}, ${cellWidth}px)`,
        }}
      >
        {cells.map((cell, i) => (
          <code key={`code-${i}`}>
            <input
              className={`
                cell
                ${CellState[cell.cellState].toLowerCase()}
                ${(
                  cell.cellState !== CellState.NONLETTER &&
                  cell.cellContent === cells[focusedCell].cellContent &&
                  cell.cellState === cells[focusedCell].cellState
                ) ? 'focused' : ''}
              `}
              key={`input-${i}`}
              ref={(el) => {inputRefs.current[i] = el}}
              autoFocus={i === 0}
              maxLength={1}
              value={cell.cellContent}
              onFocus={() => setFocusedCell(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onChange={() => {}}
              style={{width: `${cellWidth}px`}}
            />
          </code>
        ))}
      </div>
    </div>
  )
}

export default Game
