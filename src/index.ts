import { Application } from "pixi.js"
import { FancyButton } from "@pixi/ui"
import { BoardView, RackView, tileSize } from "./view"
import { Dragger } from "./dragger"
import { Bag } from "./bag"
import { mkButton } from "./ui"
import { checkWord } from "./dict"

const app = new Application({
  view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  backgroundColor: 0x429EBD,
  // width: 1024,
  // height: 768
})

const dragger = new Dragger(app)

const board = new BoardView(app.stage, 7)
board.x = 50
board.y = 50
app.stage.addChild(board)
dragger.addDropTarget(board)

board.addPendingTile("S", 1, 6)
board.addPendingTile("T", 2, 6)
board.addPendingTile("A", 3, 6)
board.addPendingTile("R", 4, 6)
board.addPendingTile("T", 5, 6)
board.commitPenders()

const bag = new Bag()

const rack = new RackView(app.stage, 7)
rack.x = board.x
rack.y = board.y + board.height + 30
app.stage.addChild(rack)
dragger.addDropTarget(rack)

function addTilesToRack (count :number) {
  for (let ii = 0; ii < count; ii += 1) {
    dragger.addDraggable(rack.addTile(bag.draw()))
  }
}
addTilesToRack(rack.size)

function addButton (xx :number, text :string, onClick :() => void) :FancyButton {
  const button = mkButton(text, 40, 40)
  button.onPress.connect(onClick)
  button.x = rack.x + tileSize*xx + tileSize/2
  button.y = rack.y + button.height + button.height/2 + 20
  app.stage.addChild(button)
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

  // if we got to the top, slide down three rows, destroying any tiles in the way
  if (board.board.haveTileIn(board.top)) {
    board.slide(0, 3, true)
  }
}

addButton(0, "↧", () => board.returnToRack(rack))
addButton(2, "↤", () => board.slide(-1, 0))
addButton(3, "↦", () => board.slide(1, 0))
const play = addButton(6, "↥", tryCommitPlay)
board.tilesValid.onValue(valid => play.enabled = valid)
