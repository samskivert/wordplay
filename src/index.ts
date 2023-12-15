import { Application } from "pixi.js"
import { Board, Rack } from "./tile"
import { Dragger } from "./dragger"
import { update } from "@tweenjs/tween.js"

const app = new Application({
  view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  backgroundColor: 0x6495ed,
  // width: 1024,
  // height: 768
})

// run our tweens
app.ticker.add(() => {
  update()
})

const dragger = new Dragger(app)

const board = new Board(app.stage, 7)
board.x = 50
board.y = 50
app.stage.addChild(board)
dragger.addDropTarget(board)

board.addTile("Q", 0, 2)
board.addTile("W", 1, 2)
board.addTile("E", 2, 2)
board.addTile("R", 3, 2)
board.addTile("T", 4, 2)
board.addTile("Y", 5, 2)

const rack = new Rack(app.stage, 7)
rack.x = board.x
rack.y = board.y + board.height + 30
app.stage.addChild(rack)
dragger.addDropTarget(rack)

function addTile (l :string, i :number) {
  const tile = rack.addTile(l, i)
  dragger.addDraggable(tile, () => tile.returnToHost())
}
addTile("Z", 0)
addTile("A", 1)
addTile("C", 2)
