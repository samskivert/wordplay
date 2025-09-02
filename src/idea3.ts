import { Bag } from "./bag"
import { BoardView } from "./view"
import { DragIdea } from "./drag"
import { checkWord } from "./dict"
import { colors } from "./ui"

const startColor = colors.paper3
const flippedColor = colors.paper1

export class Idea3 extends DragIdea {
  get info() { return [
    "Click a letter and drag to adjacent letters to make a word. " +
      "Try to use every letter on the board at least once.",
    "You can backtrack and add letters adjacent to previously any used letter, " +
      "but this means you can't unselect letters once selected."
  ]}

  private coords = new Set<string>()
  private bag = new Bag(["Q"]) // no Qs here, too annoying

  protected createBoard () :BoardView {
    return new BoardView(this, { width: 7, height: 7, hexOffset: true })
  }

  protected gameWillStart (board :BoardView) {
    this.drag.blobMode = true

    const cols = board.tileWidth
    for (let xx = 0; xx < cols; xx += 1) {
      const dx = Math.abs(Math.floor(cols / 2) - xx)
      const miny = Math.ceil(dx / 2)
      const maxy = board.tileHeight - Math.floor(dx / 2)
      for (let yy = miny; yy < maxy; yy += 1) {
        const letter = this.bag.draw()
        const tile = board.addTile(letter, xx, yy, { fillColor: startColor })
        this.coords.add(tile.key)
      }
    }
  }

  protected onDragComplete (board :BoardView, chain : {x :number, y :number}[]) {
    const word = chain.map(({ x, y }) => board.tileAt(x, y)?.letter).join("")
    if (word.length < 2) return // no one letter words
    if (!checkWord(word)) {
      for (const { x, y } of chain) {
        board.tileAt(x, y)?.shake(1, 0.35)
      }
      return
    }
    console.log("Played word:", word)
    // Clear out the played word tiles and replace with new (smaller)tiles
    for (const { x, y } of chain) {
      const tile = board.tileAt(x, y)
      if (tile) {
        this.coords.delete(tile.key)
        tile.shrinkAndDestroy()
        board.addTile(this.bag.draw(), x, y, {
          size: tile.size - 1,
          fillColor: flippedColor,
        })
      }
    }
    if (this.coords.size === 0) {
      this.drag.enabled = false
      this.showComplete()
    }
  }
}
