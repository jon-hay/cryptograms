import React, { useRef, useState } from 'react'
import useContainerWidth from '../hooks/ContainerWidth'
import { createCipher } from '../logic/Cipher'
import { CellState, createGrid } from '../logic/Grid'
import { areRecordsEqual } from '../logic/Utils'

type GameProps = {
  plaintext: string
  nextPlaintext: () => void
}

const Game: React.FC<GameProps> = ({ plaintext, nextPlaintext }) => {
  const defaultCellWidth = 20
  const cellPadding = 2

  const [baseChar, numChars] = ['A', 26]
  const lastChar = String.fromCharCode(baseChar.charCodeAt(0) + numChars - 1)
  const [encryptor] = useState(createCipher(plaintext, baseChar, numChars).encryptor)

  const [guessedEncryptor, setGuessedEncryptor] = useState<Record<string, string>>({})
  const [guessedDecryptor, setGuessedDecryptor] = useState<Record<string, string>>({})
  const [conflictedChar, setConflictedChar] = useState('')
  const [focusedCell, setFocusedCell] = useState(0)
  const [showHint, setShowHint] = useState(false)

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
    gridWidth,
    defaultCellWidth,
  )

  const actualCellWidth = cellWidth - 2 * cellPadding

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
        {hasWon && <>
          <h1>You Win!</h1>
          <button onClick={() => nextPlaintext()}>New Game</button>
        </>}
        {!hasWon && <>
          <h1><i>Codebreaker</i></h1>
          <p>Break the code! Each letter has (possibly) been replaced with a different one.</p>
          {conflictedChar !== '' ? (
            <p>
              {'You\'ve already used the letter '}
              <span
                className='cell conflicted'
                style={{display: 'inline-block', width: `${actualCellWidth}px`}}
              >{conflictedChar}</span>
              {' ! Try deleting it first.'}
            </p>
          ) : hasFilledNotWon ? (
            <p>
              {'Hmm... '}
              <span
                className='cell conflicted'
                style={{display: 'inline-block', width: 'auto'}}
              >{'something\'s not quite right.'}</span>
              {' Double-check your guesses!'}
            </p>
          ) : (
            <p>
              {'Click an '}
              {[...'UNSOLVED'].map((letter, i) => (
                <span
                  className='cell unguessed'
                  key={`unguessed-${i}`}
                  style={{display: 'inline-block', width: `${actualCellWidth}px`}}
                >{letter}</span>
              ))}
              {' letter and type in your '}
              {[...'GUESS'].map((letter, i) => (
                <span
                  className='cell guessed'
                  key={`guessed-${i}`}
                  style={{display: 'inline-block', width: `${actualCellWidth}px`}}
                >{letter}</span>
              ))}
              {'.'}
            </p>
          )}
          <button onClick={() => setShowHint(!showHint)}>{showHint ? 'Hide' : 'Show'} Hint</button>
          {showHint && <p style={{lineHeight: `1.5rem`}}>
            <b>Common short words:</b> A, I<br />
            AM, AN, AS, AT, BE, BY, DO, GO, HE, IF, IN, IS, IT, ME, MY, NO, OF, ON, OR, SO, TO, UP, US, WE<br />
            ALL, AND, ARE, BUT, CAN, FOR, HAD, HAS, HER, HIM, HIS, ITS, NOT, ONE, OUT, SHE, THE, WAS, WHO, YOU
          </p>}
        </>}
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
            style={{width: `${actualCellWidth}px`}}
          />
        ))}
      </div>
    </div>
  )
}

export default Game
