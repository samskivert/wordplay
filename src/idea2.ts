import { Application, Container } from "pixi.js"
import { Bag } from "./bag"
import { checkWord } from "./dict"
import { DragChain } from "./dragchain"
import { BoardView } from "./view"

export class Idea2 extends Container {
  readonly board: BoardView

  constructor(_app: Application) {
    super()

    const board = new BoardView(this, 7, 10, true)
    this.board = board
    this.addChild(board)
    const dc = new DragChain(board)
    dc.onDragComplete = (chain) => {
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

    const bag = new Bag()
    for (let yy = 1; yy < 9; yy += 1) {
      for (let xx = 1; xx < 6; xx += 1) {
        const tile = bag.draw()
        board.addPendingTile(tile, xx, yy)
      }
    }
    board.commitPenders()
  }
}
