import { Application, Text } from "pixi.js"
import { Word } from "./board"
import { RackIdea, Config } from "./rack"
import { labelStyle, colors } from "./ui"

// TODO: make non-rectangular board shapes, like C, S, etc.

export class Idea6 extends RackIdea {
  get info() { return [
    "Clear all the dots on the board by covering them with words. " +
      "Build words off of other words, Scrabble-style."
  ]}

  private infoText :Text
  private longest = 0
  private total = 0

  constructor(app: Application) {
    super(app)

    const screenWidth = app.view.width / window.devicePixelRatio
    const infoText = this.infoText = new Text("", labelStyle)
    infoText.anchor.set(0.5)
    infoText.x = screenWidth / 2
    infoText.y = this.board.y / 2
    this.addChild(infoText)
    this.updateInfo()
  }

  protected override get config() :Config {
    return {
      board: { width: 7, height: 7 },
      rack: { size: 7 },
    }
  }

  gameWillStart(): void {
    this.board.addStartWord("START", 1, Math.floor(this.board.tileHeight/2))

    const { width, height } = this.config.board
    for (let yy = 0; yy < height; yy += 1) {
      for (let xx = 0; xx < width; xx += 1) {
        if (this.board.tileAt(xx, yy)) continue
        const text = new Text("●", { ...labelStyle, fill: colors.grey2 })
        text.anchor.set(0.5, 0.5)
        this.board.addGlyph(xx, yy, text)
      }
    }
  }

  playDidCommit(words: Word[]) {
    const {board, rack} = this

    // track the total number of plays
    this.total += 1

    const toKey = (tileX: number, tileY: number) => `${tileX}:${tileY}`
    const played = new Set<string>()
    for (const word of words) {
      // track the longest word
      const length = Math.max(word.maxX - word.minX + 1, word.maxY - word.minY + 1)
      this.longest = Math.max(this.longest, length)

      // clear any glyphs under the played word
      for (let yy = word.minY; yy <= word.maxY; yy += 1) {
        for (let xx = word.minX; xx <= word.maxX; xx += 1) {
          played.add(toKey(xx, yy))
          board.clearGlyph(xx, yy)
        }
      }
    }
    this.updateInfo()

    // any tiles that were not in the just played word get cleared
    const { width, height } = this.config.board
    for (let yy = 0; yy < height; yy += 1) {
      for (let xx = 0; xx < width; xx += 1) {
        if (played.has(toKey(xx, yy))) continue
        board.tileAt(xx, yy)?.shrinkAndDestroy()
      }
    }

    if (board.glyphCount > 0) return false

    // if we have no more glyphs, you win!
    rack.clearTiles(true)
    rack.showMessage("YOU WIN")
    return true
  }

  private updateInfo() {
    this.infoText.text = `Plays: ${this.total}\nLongest: ${this.longest}`
  }
}
