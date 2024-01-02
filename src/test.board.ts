import { Board } from "./board"

test("set and clear tiles", () => {
  const size = 7, board = new Board(size)
  const letters = ["a", "b", "c", "d", "e", "f"]
  for (let yy = 0; yy < size; yy += 1) {
  for (let xx = 0; xx < size; xx += 1) {
      const l = letters[(xx+yy)%letters.length]
      board.setTile(xx, yy, l)
      expect(board.tileAt(xx, yy)).toBe(l)
      board.clearTile(xx, yy)
      expect(board.tileAt(xx, yy)).toBe(null)
    }
  }
})

test("find words", () => {
  const size = 7, board = new Board(size)

  board.setTile(1, 3, "S")
  board.setTile(2, 3, "T")
  board.setTile(3, 3, "A")
  board.setTile(4, 3, "R")
  board.setTile(5, 3, "T")
  board.commitPending()

  board.setTile(3, 2, "F")
  board.setTile(4, 2, "O")
  board.setTile(5, 2, "A")
  board.setTile(6, 2, "L")

  for (let word of board.pendingWords()) {
    if (word.word == "FOAL") {
      expect(word.minX).toBe(3)
      expect(word.maxX).toBe(6)
      expect(word.minY).toBe(2)
      expect(word.maxY).toBe(2)
    } else if (word.word == "FA") {
      expect(word.minX).toBe(3)
      expect(word.maxX).toBe(3)
      expect(word.minY).toBe(2)
      expect(word.maxY).toBe(3)
    } else if (word.word == "OR") {
      expect(word.minX).toBe(4)
      expect(word.maxX).toBe(4)
      expect(word.minY).toBe(2)
      expect(word.maxY).toBe(3)
    } else if (word.word == "AT") {
      expect(word.minX).toBe(5)
      expect(word.maxX).toBe(5)
      expect(word.minY).toBe(2)
      expect(word.maxY).toBe(3)
    } else {
      fail(`Invalid word: {word.word}`)
    }
  }
})

test("pending valid", () => {
  const size = 7, board = new Board(size)

  board.setTile(1, 3, "S")
  board.setTile(2, 3, "T")
  board.setTile(3, 3, "A")
  board.setTile(4, 3, "R")
  board.setTile(5, 3, "T")
  board.commitPending()

  // not connected
  board.setTile(3, 0, "G")
  expect(board.pendingValid()).toBe(false)

  // not connected, but two in a row
  board.setTile(3, 1, "F")
  expect(board.pendingValid()).toBe(false)

  // three in a row and connected
  board.setTile(3, 2, "L")
  expect(board.pendingValid()).toBe(true)

  // pending tiles no longer colinear
  board.setTile(2, 1, "Q")
  expect(board.pendingValid()).toBe(false)
})
