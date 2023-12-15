import { Application } from "pixi.js"
import { update } from "@tweenjs/tween.js"
import { Board, Rack } from "./tile"
import { Dragger } from "./dragger"
import { Bag } from "./bag"

const app = new Application({
  view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  backgroundColor: 0x429EBD,
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

const bag = new Bag()

const rack = new Rack(app.stage, 7)
rack.x = board.x
rack.y = board.y + board.height + 30
app.stage.addChild(rack)
dragger.addDropTarget(rack)

function addTile (l :string, i :number) {
  const tile = rack.addTile(l, i)
  dragger.addDraggable(tile, () => tile.returnToHost())
}
for (let ii = 0; ii < rack.size; ii += 1) {
  addTile(bag.draw(), ii)
}
