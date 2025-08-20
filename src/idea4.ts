import { Bag } from "./bag"
import { BoardView } from "./view"
import { DragIdea } from "./drag"
import { checkWord } from "./dict"

const startColor = 0xccff99
const flippedColor = 0x99cc66

const cols = 5
const cx = Math.floor(cols / 2)
const isWild = (x: number, y: number) => (x == cx - 1 && y == 1) || (x == cx + 1 && y == 2)

export class Idea4 extends DragIdea {
  get info() { return [
    "Click a letter and drag to adjacent letters to spell a word. " +
      "The * tile acts as a wildcard. " +
      "Try to use every letter on the board at least once."
  ]}

  private coords = new Set<string>()
  private bag = new Bag()

  protected createBoard () {
    return new BoardView(this, cols, 5, true)
  }

  protected gameWillStart (board :BoardView) {
    for (let xx = 0; xx < cols; xx += 1) {
      const dx = Math.abs(cx - xx)
      const miny = Math.floor(dx / 2)
      const maxy = board.tileHeight - Math.ceil(dx / 2)
      for (let yy = miny; yy < maxy; yy += 1) {
        const letter = isWild(xx, yy) ? "*" : this.bag.draw()
        const tile = board.addPendingTile(letter, xx, yy, { fillColor: startColor })
        this.coords.add(tile.key)
      }
    }
    board.commitPenders()
  }

  protected onDragComplete (board :BoardView, chain : {x :number, y :number}[]) {
    const word = chain.map(({ x, y }) => board.tileAt(x, y)?.letter).join("")
    if (word.length < 2) return // no one letter words
    const matched: string[] = []
    if (!checkWord(word, matched)) {
      for (const { x, y } of chain) {
        board.tileAt(x, y)?.shake(1, 0.35)
      }
      return
    }
    console.log("Played word:", matched.join(""))
    // Clear out the played word tiles and replace with new (smaller)tiles
    for (const { x, y } of chain) {
      const tile = board.tileAt(x, y)
      if (tile) {
        this.coords.delete(tile.key)
        tile.shrinkAndDestroy()
        const letter = isWild(x, y) ? "*" : this.bag.draw()
        board.addPendingTile(letter, x, y, {
          size: tile.size - 1,
          fillColor: flippedColor,
        })
      }
    }
    board.commitPenders()
    if (this.coords.size === 0) {
      this.drag.enabled = false
      this.showComplete()
    }
  }
}
