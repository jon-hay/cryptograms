import { useEffect, useState } from 'react'
import Game from './Game'
import { loadCorpus } from '../logic/Corpus'
import { getRandomIntegerInRange } from '../logic/Random'

const GameLoader = () => {
  const minTextLen = 500

  const corpora = [
    [`${process.env.PUBLIC_URL}/corpora/austen-emma.txt`, '\n\n'],
    [`${process.env.PUBLIC_URL}/corpora/austen-persuasion.txt`, '\n\n'],
    [`${process.env.PUBLIC_URL}/corpora/austen-sense.txt`, '\n\n'],
  ]

  const [corporaIndex] = useState(getRandomIntegerInRange(0, corpora.length - 1))
  const [corpusUrl, delimiter] = corpora[corporaIndex]

  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [texts, setTexts] = useState<string[]>([])
  const [textIndex, setTextIndex] = useState(0)

  useEffect(() => {
    loadCorpus(corpusUrl, delimiter, minTextLen, setIsLoading, setIsError, setTexts)
  }, [corpusUrl, delimiter])

  useEffect(() => {
    setTextIndex(getRandomIntegerInRange(0, texts.length - 1))
  }, [texts.length])

  return (
    <div className='game-loader'>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error! Try refreshing the page.</p>}
      {!isLoading && !isError && (
        <Game
          key={`${corporaIndex}-${textIndex}`}
          plaintext={texts[textIndex].trim().toUpperCase()}
          nextPlaintext={() => {
            setTextIndex((textIndex + 1) % texts.length)
          }}
        />
      )}
    </div>
  )
}

export default GameLoader
