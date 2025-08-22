import { Application, Container, Text } from "pixi.js"
import { FancyButton } from "@pixi/ui"
import { Idea } from "./idea"
import { Dragger } from "./dragger"
import { mkButton, buttonSize, buttonTextStyle } from "./ui"
import { RackView, tileSize } from "./view"
import { sattoloShuffle } from "./util"
import { puzzles } from "./idea5puzzles"

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
function decode (puzzle :string) {
  const words :string[] = []
  for (let xx = 0; xx < 5*6; xx += 6) {
    let encword = Number(`0x${puzzle.substring(xx, xx+6)}`)
    let word = ""
    for (let ii = 0; ii < 5; ii += 1) {
      word = `${letters.charAt(encword % 26)}${word}`
      encword /= 26
    }
    words.push(word)
  }
  const stars = Number(puzzle.charAt(puzzle.length-1))
  return {words, stars}
}

export class RowView extends RackView {
  onShuffled :(correct: boolean) => void = () => {}
  dragger :Dragger
  word = ""

  constructor (stage :Container) {
    super(stage, 5)
    this.dragger = new Dragger(stage)
    this.dragger.addDropTarget(this)
  }

  setWord(word :string) {
    this.onRearranged = (rackLetters :string) => this.onShuffled(word == rackLetters)
    this.word = word

    const letters = word.split("")
    sattoloShuffle(letters)
    letters.forEach(letter => {
      const tile = this.addTile(letter)
      this.dragger.addDraggable(tile)
    })
  }

  doHint(hint :number) {
    let col = hint == 0 ? this.word.length-1 : 0
    let letter = this.word.charAt(col)
    const tile = this.tileAt(col, 0)!
    if (tile.letter === letter) {
      tile.makeCommitted()
    } else {
      for (var xx = 0; xx < 5; xx += 1) {
        const xtile = this.tileAt(xx, 0)!
        if (xtile.letter == letter) {
          xtile.makeCommitted()
          xtile.dropOn(col, 0, this, true)
          tile.dropOn(xx, 0, this, true)
          break
        }
      }
    }
  }

  markCorrect() {
    for (let ii = 0; ii < 5; ii += 1) {
      const tile = this.tileAt(ii, 0)
      tile?.makeCommitted()
    }
  }
}

export class Idea5 extends Idea {
  get info() { return [
    "Rearrange the letters in each row to spell a common five letter word.",
    "When all of the words are correct, each column will also spell a " +
      "(possibly less common) five letter word."
  ]}

  rowViews :Array<RowView> = []
  starsLabel :string
  infoText :Text
  hintButton :FancyButton
  startTime :number

  constructor(app :Application) {
    super(app)

    this.hitArea = app.screen
    this.sortableChildren = true
    this.startTime = Date.now()

    const screenWidth = app.view.width / window.devicePixelRatio
    const screenHeight = app.view.height / window.devicePixelRatio
    const racktop = (screenHeight - 5*tileSize) / 2
    let racky = racktop
    const addRow = (word :string, onDrop :(correct: boolean) => void) => {
      const row = new RowView(this)
      row.onShuffled = onDrop
      row.x = (screenWidth - row.width) / 2
      row.y = racky
      racky += tileSize
      this.addChild(row)
      row.setWord(word)
      return row
    }

    let correctWords = new Set<string>()
    const rowViews = this.rowViews
    const puztxt = puzzles[Math.floor(Math.random() * puzzles.length)]
    console.log(puztxt)
    const {words, stars} = decode(puztxt)
    console.log(words)
    for (const word of words) {
      rowViews.push(addRow(word, correct => {
        if (correct) correctWords.add(word)
        else correctWords.delete(word)
        // console.log(`${row} correct: ${correct} (total: ${correctRows.size})`)
        if (correctWords.size == 5) this.endGame()
      }))
    }

    const starsLabel = this.starsLabel = "*".repeat(stars)
    const infoText = this.infoText = new Text(`Difficulty: ${starsLabel}`, buttonTextStyle)
    infoText.anchor.set(0.5)
    infoText.x = screenWidth / 2
    infoText.y = racky + tileSize
    this.addChild(infoText)

    let usedHints = 0
    const hintButton = this.hintButton = mkButton("Hint", 2.5*buttonSize)
    hintButton.onPress.connect(() => {
      for (const row of rowViews) row.doHint(usedHints)
      usedHints += 1
      if (usedHints == 2) {
        hintButton.enabled = false
      }
    })
    hintButton.x = screenWidth/2
    hintButton.y = racky + hintButton.height + hintButton.height / 2 + tileSize
    this.addChild(hintButton)
  }

  endGame () {
    this.rowViews.forEach(rv => rv.markCorrect())
    this.hintButton.enabled = false
    let seconds = Math.floor((Date.now() - this.startTime) / 1000)
    let mins = Math.floor(seconds / 60), secs = String(seconds % 60).padStart(2, '0')
    this.infoText.text = `Completed ${this.starsLabel} in ${mins}:${secs}!`
  }
}
