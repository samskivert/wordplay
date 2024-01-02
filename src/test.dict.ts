import { checkWord, words } from "./dict"

test("basic dictionary decode", () => {
  expect(checkWord("HELLO")).toBe(true)
})

test("dictionary size", () => {
  expect(words.size > 150000).toBe(true)
})
