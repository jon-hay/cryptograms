import { useEffect, useState } from 'react'
import Game from './Game'
import { loadCorpus } from '../logic/Corpus'
import { getRandomIntegerInRange } from '../logic/Random'

const GameLoader = () => {
  const corpora = [
    [`${process.env.PUBLIC_URL}/corpora/abc_rural.corpus`, '\n\n'],
    [`${process.env.PUBLIC_URL}/corpora/abc_science.corpus`, '\n\n'],
  ]

  const [corporaIndex] = useState(getRandomIntegerInRange(0, corpora.length - 1))
  const [corpusUrl, delimiter] = corpora[corporaIndex]

  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [texts, setTexts] = useState<string[]>([])

  useEffect(() => {
    loadCorpus(corpusUrl, delimiter, setIsLoading, setIsError, setTexts)
  }, [corpusUrl, delimiter])

  return (
    <div className='gameLoader'>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error! Try refreshing the page.</p>}
      {!isLoading && !isError && <Game texts={texts} />}
    </div>
  )
}

export default GameLoader
