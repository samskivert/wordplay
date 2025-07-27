import { Application, Text } from "pixi.js"
import { BoardView, tileSize } from "./view"
import { DragChain } from "./dragchain"
import { Idea } from "./idea"
import { titleStyle, colors } from "./ui"

export abstract class DragIdea extends Idea {
  readonly board: BoardView
  readonly currentWordText: Text
  readonly drag: DragChain

  constructor(app :Application) {
    super(app)

    const board = this.board = this.createBoard()
    this.addChild(board)

    // Create text element for current word
    const currentStyle = { ...titleStyle, fill: colors.paper4 }
    const currentWordText = (this.currentWordText = new Text("", currentStyle))
    currentWordText.anchor.set(0.5)
    this.addChild(currentWordText)

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

    const drag = this.drag = new DragChain(board)
    drag.onChainUpdate = (chain) => {
      const word = chain.map(({ x, y }) => board.tileAt(x, y)?.letter).join("")
      currentWordText.text = word
    }
    drag.onDragComplete = (chain) => this.onDragComplete(board, chain)
  }

  override startGame () {
    super.startGame()
    this.gameWillStart(this.board)
  }

  showComplete() {
    this.currentWordText.text = "Complete!"
  }

  protected abstract createBoard () :BoardView
  protected abstract gameWillStart (board :BoardView) :void
  protected abstract onDragComplete (board :BoardView, chain : {x :number, y :number}[]) :void
}
