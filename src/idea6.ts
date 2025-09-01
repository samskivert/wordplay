import { Text } from "pixi.js"
import { Word } from "./board"
import { RackIdea, Config } from "./rack"
import { labelStyle, colors } from "./ui"

export class Idea6 extends RackIdea {
  get info() { return [
    "Clear all the dots on the board by covering them with words. " +
      "Build words off of other words, Scrabble-style."
  ]}

  protected override get config() :Config {
    return {
      boardWidth: 7,
      boardHeight: 7,
      rackSize: 7,
    }
  }

  gameWillStart(): void {
    this.board.addStartWord("START", 1, this.board.tileHeight - 4)

    const { boardWidth, boardHeight } = this.config
    for (let yy = 0; yy < boardHeight; yy += 1) {
      for (let xx = 0; xx < boardWidth; xx += 1) {
        if (this.board.tileAt(xx, yy)) continue
        const text = new Text("●", { ...labelStyle, fill: colors.grey2 })
        text.anchor.set(0.5, 0.5)
        this.board.addGlyph(xx, yy, text)
      }
    }
  }

  playDidCommit(words: Word[]) {
    const board = this.board

    const toKey = (tileX: number, tileY: number) => `${tileX}:${tileY}`
    const played = new Set<string>()

    // clear any glyphs under the played word
    for (const word of words) {
      for (let yy = word.minY; yy <= word.maxY; yy += 1) {
        for (let xx = word.minX; xx <= word.maxX; xx += 1) {
          played.add(toKey(xx, yy))
          this.board.clearGlyph(xx, yy)
        }
      }
    }

    // any tiles that were not in the just played word get cleared
    const { boardWidth, boardHeight } = this.config
    for (let yy = 0; yy < boardHeight; yy += 1) {
      for (let xx = 0; xx < boardWidth; xx += 1) {
        if (played.has(toKey(xx, yy))) continue
        board.tileAt(xx, yy)?.shrinkAndDestroy()
      }
    }

    if (this.board.glyphCount > 0) return false

    // if we have no more glyphs, you win!
    this.rack.clearTiles(true)
    this.rack.showMessage("YOU WIN")
    return true
  }
}
