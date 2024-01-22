import { encodedWords } from "./encoded-words"

export const words = new Set<string>()
const digits = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])

export function checkWord (word :string) :boolean {
  if (words.size == 0) {
    var word = ""
    var ii = 0 ; while (ii < encodedWords.length) {
      const reuse = word.substring(0, parseInt(encodedWords[ii++]))
      const start = ii
      while (ii < encodedWords.length && !digits.has(encodedWords[++ii])) {}
      words.add(word = reuse + encodedWords.substring(start, ii))
    }
  }
  return words.has(word)
}
