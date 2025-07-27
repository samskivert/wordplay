import { Application, Container } from "pixi.js"
import { Text } from "pixi.js"
import { Bag } from "./bag"
import { checkWord } from "./dict"
import { DragChain } from "./dragchain"
import { BoardView, tileSize } from "./view"

const startColor = 0xccff99
const flippedColor = 0x99cc66

export class WildDrag extends Container {
  readonly board: BoardView
  private app: Application
  private coords = new Set<string>()

  constructor(app: Application) {
    super()
    this.app = app

    const board = new BoardView(this, 5, 5, true)
    this.board = board
    this.addChild(board)

    const cols = board.tileWidth
    const cx = Math.floor(cols / 2)
    const isWild = (x: number, y: number) => (x == cx - 1 && y == 1) || (x == cx + 1 && y == 2)

    // Create text element for current word
    const currentWordText = new Text("", {
      fontSize: 36,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2,
    })
    currentWordText.anchor.set(0.5)
    this.addChild(currentWordText)

    const dc = new DragChain(board)
    dc.onChainUpdate = (chain) => {
      const word = chain.map(({ x, y }) => board.tileAt(x, y)?.letter).join("")
      currentWordText.text = word
    }
    dc.onDragComplete = (chain) => {
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
          const letter = isWild(x, y) ? "*" : bag.draw()
          board.addPendingTile(letter, x, y, {
            size: tile.size - 1,
            fillColor: flippedColor,
          })
        }
      }
      board.commitPenders()
      if (this.coords.size === 0) {
        dc.enabled = false
        this.showComplete()
      }
    }

    // Recenter on window resize
    function recenter() {
      // Use app.screen.width/height for the available area
      board.x = (app.screen.width - board.tileWidth * tileSize) / 2
      board.y = (app.screen.height - board.tileHeight * tileSize) / 2

      // Position the current word text below the board
      currentWordText.x = app.screen.width / 2
      currentWordText.y = board.y + board.tileHeight * tileSize + 60
    }
    window.addEventListener("resize", recenter)
    this.on("destroy", () => window.removeEventListener("resize", recenter))
    recenter()

    const bag = new Bag()
    for (let xx = 0; xx < cols; xx += 1) {
      const dx = Math.abs(cx - xx)
      const miny = Math.floor(dx / 2)
      const maxy = board.tileHeight - Math.ceil(dx / 2)
      for (let yy = miny; yy < maxy; yy += 1) {
        const letter = isWild(xx, yy) ? "*" : bag.draw()
        const tile = board.addPendingTile(letter, xx, yy, { fillColor: startColor })
        this.coords.add(tile.key)
      }
    }
    board.commitPenders()
  }

  showComplete() {
    const text = new Text("Complete!", {
      fontSize: 48,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4,
    })
    text.anchor.set(0.5)
    text.x = this.app.screen.width / 2
    text.y = this.app.screen.height / 2
    this.addChild(text)
  }
}
