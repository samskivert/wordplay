import { Bag } from "./bag"
import { BoardView } from "./view"
import { DragIdea } from "./drag"
import { checkWord } from "./dict"

export class Idea2 extends DragIdea {

  protected createBoard () {
    return new BoardView(this, 6, 9, true)
  }

  protected gameWillStart (board :BoardView) {
    const bag = new Bag()
    for (let yy = 0; yy < board.tileHeight; yy += 1) {
      for (let xx = 0; xx < board.tileWidth; xx += 1) {
        const tile = bag.draw()
        board.addPendingTile(tile, xx, yy)
      }
    }
    board.commitPenders()
  }

  protected onDragComplete (board :BoardView, chain : {x :number, y :number}[]) {
    const word = chain.map(({ x, y }) => board.tileAt(x, y)?.letter).join("")
    if (word.length < 2) return // no one letter words
    if (!checkWord(word)) {
      for (const { x, y } of chain) {
        board.tileAt(x, y)?.shake(1, 0.35)
      }
    } else {
      console.log("Played word:", word)
      // Clear out the played word tiles
      for (const { x, y } of chain) {
        const tile = board.tileAt(x, y)
        tile?.shrinkAndDestroy()
      }
      // Drop tiles down into empty spaces
      for (let x = 0; x < board.tileWidth; x++) {
        for (let y = board.tileHeight - 1; y >= 0; y--) {
          if (!board.tileAt(x, y)) {
            // Find the first tile above (lower y)
            for (let yy = y - 1; yy >= 0; yy--) {
              const tileAbove = board.tileAt(x, yy)
              if (tileAbove) {
                tileAbove.dropOn(x, y, board, true)
                break
              }
            }
          }
        }
      }
    }
  }
}
