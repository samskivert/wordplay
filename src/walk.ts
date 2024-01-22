import { Application, Container } from "pixi.js"
import { BoardView, RackView, tileSize } from "./view"
import { Dragger } from "./dragger"
import { Bag } from "./bag"
import { mkButton, buttonSize } from "./ui"
import { checkWord } from "./dict"

export class WordWalk extends Container {

  constructor (app :Application) {
    super()
    const dragger = new Dragger(app)
    this.sortableChildren = true

    const board = new BoardView(this, 7, 10)
    this.addChild(board)
    dragger.addDropTarget(board)

    const rack = new RackView(this, 7)
    this.addChild(rack)
    dragger.addDropTarget(rack)

    const boardRackGap = 30, rackButtonsGap = 20
    const uiHeight = board.height + boardRackGap + rack.height + rackButtonsGap + buttonSize
    const screenWidth = app.view.width/2, screenHeight = app.view.height/2

    board.x = (screenWidth - board.width)/2
    board.y = (screenHeight - uiHeight)/2
    rack.x = board.x
    rack.y = board.y + board.height + boardRackGap

    const bag = new Bag()
    function addTilesToRack (count :number) {
      for (let ii = 0; ii < count; ii += 1) {
        dragger.addDraggable(rack.addTile(bag.draw()))
      }
    }
    addTilesToRack(rack.size)

    const addButton = (xx :number, text :string, onClick :() => void) => {
      const button = mkButton(text, buttonSize)
      button.onPress.connect(onClick)
      button.x = rack.x + tileSize*xx + tileSize/2
      button.y = rack.y + button.height + button.height/2 + rackButtonsGap
      this.addChild(button)
      return button
    }

    function tryCommitPlay () {
      for (let word of board.board.pendingWords()) {
        if (!checkWord(word.word)) {
          console.log(`No goodski ${word.word}`)
          board.shakePenders()
          return
        }
      }
      board.commitPenders()
      addTilesToRack(rack.size-rack.tileCount)

      // if we got to the top, slide down half the board, destroying any tiles in the way
      if (board.board.haveTileIn(board.topRow)) {
        board.slide(0, Math.floor(board.tileHeight/2), true)
      }
    }

    addButton(0, "↧", () => board.returnToRack(rack))
    addButton(1, "↺", () => rack.shuffle())
    addButton(3, "↤", () => board.slide(-1, 0))
    addButton(4, "↦", () => board.slide(1, 0))
    const play = addButton(6, "↥", tryCommitPlay)
    board.tilesValid.onValue(valid => play.enabled = valid)

    board.addPendingTile("S", 1, board.tileHeight-1)
    board.addPendingTile("T", 2, board.tileHeight-1)
    board.addPendingTile("A", 3, board.tileHeight-1)
    board.addPendingTile("R", 4, board.tileHeight-1)
    board.addPendingTile("T", 5, board.tileHeight-1)
    board.commitPenders()
  }
}
