import { Application, Text } from "pixi.js"
import { BoardView, TileView, tileSize, shake } from "./view"
import { Idea } from "./idea"
import { titleStyle, labelStyle, colors, mkButton, buttonSize } from "./ui"
import { Bag } from "./bag"
import { checkWord } from "./dict"

// Score is based on word length: 3 = 1, 4 = 3, 5 = 6, 6 = 10, 7 = 15
function scoreWord(word :string) {
  let score = 1
  for (let ii = 3; ii < word.length; ii += 1) score += (ii-1)
  return score
}

export class Idea7 extends Idea {
  get info() { return [
    "Spell words by selecting letters clockwise around the ring. " +
      "Letters may be skipped, but the word must be composed in a single trip around the ring."
  ]}

  constructor(app :Application) {
    super(app)

    const board = new BoardView(this, { width: 4, height: 4 })
    this.addChild(board)

    // Create all of our UI elements
    const scoreText = new Text("Score: 0", labelStyle)
    scoreText.anchor.set(0.5)
    this.addChild(scoreText)

    const wordCountText = new Text("Words: 0", labelStyle)
    wordCountText.anchor.set(0.5)
    this.addChild(wordCountText)

    const currentWord = new Text("", { ...titleStyle, fill: colors.paper4 })
    currentWord.anchor.set(0.5)
    this.addChild(currentWord)

    const submit = mkButton("✔", buttonSize)
    submit.anchor.set(0.5)
    submit.enabled = false
    this.addChild(submit)

    const clear = mkButton("✘", buttonSize)
    clear.anchor.set(0.5)
    clear.enabled = false
    this.addChild(clear)

    // Recenter on window resize
    function recenter() {
      const centerX = app.screen.width / 2

      // Use app.screen.width/height for the available area
      board.x = (app.screen.width - board.tileWidth * tileSize) / 2
      board.y = (app.screen.height - board.tileHeight * tileSize) / 2

      // Position the current word text below the board
      currentWord.x = centerX
      currentWord.y = board.y + board.tileHeight * tileSize + 60

      // Position word count and score above the board
      scoreText.x = wordCountText.x = centerX
      scoreText.y = board.y - 90
      wordCountText.y = board.y - 60

      // Position the submit and clear buttons below the current word
      submit.x = centerX + 70
      clear.x = centerX - 70
      submit.y = clear.y = currentWord.y + 60
    }
    window.addEventListener("resize", recenter)
    this.on("destroy", () => window.removeEventListener("resize", recenter))
    recenter()

    // keep track of all submitted words and a total score
    let score = 0
    let words = new Set<string>()

    // this will map tile view to an index around the board:
    //
    // 0 1 2 3
    // 11    4
    // 10    5
    // 9 8 7 6
    //
    // which we'll use to ensure words only go once around the tile
    const tileToIndex = new Map<TileView, number>()
    const indexToTile = new Map<number, TileView>()
    let start :TileView|undefined = undefined

    function updateWord() {
      let word = ""
      if (start) {
        const tileCount = tileToIndex.size
        const startIdx = tileToIndex.get(start)!
        for (let ii = 0; ii < tileCount; ii += 1) {
          const idx = (startIdx + ii) % tileCount
          const tile = indexToTile.get(idx)!
          if (tile.selected) word += tile.letter
        }
      }
      currentWord.text = word
      submit.enabled = word.length >= 3 && !words.has(word)
      clear.enabled = word.length > 0
    }

    function clearWord() {
      for (const tile of indexToTile.values()) {
        tile.setSelected(false, true)
      }
      start = undefined
      updateWord()
    }
    clear.onPress.connect(clearWord)

    function tileSelectionChanged(tile :TileView) {
      if (tile.selected) {
        if (start === undefined) {
          start = tile
        }
      } else {
        if (tile === start) {
          // if there are other selected tiles after the old start, make the next one the new start
          // tile
          const tileCount = tileToIndex.size
          const startIdx = tileToIndex.get(start)!
          start = undefined
          for (let ii = 0; ii < tileCount; ii += 1) {
            const idx = (startIdx + ii) % tileCount
            const ntile = indexToTile.get(idx)!
            if (ntile.selected) {
              start = ntile
              break
            }
          }
        }
      }
      updateWord()
    }

    const bag = new Bag()
    const letters :string[] = []
    for (let ii = 0, ll = 2*board.tileWidth + 2*(board.tileHeight-2); ii < ll; ii += 1) {
      if (ii % 3 == 0) letters.push(bag.drawVowel())
      else letters.push(bag.drawConsonant())
    }

    function addTile(x :number, y :number, index :number) {
      const tile = board.addTile(letters.pop()!, x, y)
      tile.makeSelectable(tileSelectionChanged)
      tileToIndex.set(tile, index)
      indexToTile.set(index, tile)
    }
    for (let xx = 0; xx < board.tileWidth; xx += 1) {
      addTile(xx, 0, xx)
      addTile(xx, board.tileHeight-1, 2*board.tileWidth + board.tileHeight - 3 - xx)
    }
    for (let yy = 1; yy < board.tileHeight-1; yy += 1) {
      addTile(0, yy, 2*(board.tileWidth+board.tileHeight) - 4 - yy)
      addTile(board.tileWidth-1, yy, board.tileWidth - 1 + yy)
    }

    function submitWord() {
      if (checkWord(currentWord.text)) {
        words.add(currentWord.text)
        score += scoreWord(currentWord.text)
        scoreText.text = `Score: ${score}`
        wordCountText.text = `Words: ${words.size}`
        clearWord()
      } else {
        shake(currentWord.position, 5, 0.5)
      }
    }
    submit.onPress.connect(submitWord)
  }
}
