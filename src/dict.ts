import { encodedWords } from "./encoded-words"

const digits = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])
const asciiA = "A".charCodeAt(0)

class Trie {
  readonly children: Trie[] = []
  terminal = false

  add(word: string, pos: number) {
    if (word.length == pos) {
      this.terminal = true
    } else {
      const lidx = word.charCodeAt(pos) - asciiA
      const children = this.children
      if (children[lidx] === undefined) {
        children[lidx] = new Trie()
      }
      children[lidx].add(word, pos + 1)
    }
  }

  contains(word: string, pos: number): boolean {
    if (word.length == pos) {
      return this.terminal
    } else if (word.charAt(pos) === "*") {
      return this.children.find((child) => child && child.contains(word, pos + 1)) !== undefined
    } else {
      const child = this.children[word.charCodeAt(pos) - asciiA]
      return child && child.contains(word, pos + 1)
    }
  }
}

// export const words = new Set<string>()
// export function checkWord(word: string): boolean {
//   if (words.size == 0) {
//     let word = ""
//     let ii = 0
//     while (ii < encodedWords.length) {
//       const reuse = word.substring(0, parseInt(encodedWords[ii++]))
//       const start = ii
//       while (ii < encodedWords.length && !digits.has(encodedWords[++ii])) {}
//       words.add((word = reuse + encodedWords.substring(start, ii)))
//     }
//   }
//   return words.has(word)
// }

export const words = new Trie()
export function checkWord(word: string): boolean {
  if (words.children.length == 0) {
    let word = ""
    let ii = 0
    while (ii < encodedWords.length) {
      const reuse = word.substring(0, parseInt(encodedWords[ii++]))
      const start = ii
      while (ii < encodedWords.length && !digits.has(encodedWords[++ii])) {}
      words.add((word = reuse + encodedWords.substring(start, ii)), 0)
    }
  }
  return words.contains(word, 0)
}
