export const loadCorpus = async (
  corpusUrl: string,
  delimiter: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setIsError: React.Dispatch<React.SetStateAction<boolean>>,
  setTexts: React.Dispatch<React.SetStateAction<string[]>>,
) => {
  setIsLoading(true)
  const response = await fetch(corpusUrl)
  if (response.ok) {
    const corpus = await response.text()
    setTexts(corpus.split('\r').join('').split(delimiter))
  } else {
    setIsError(true)
  }
  setIsLoading(false)
}
