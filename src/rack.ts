import { Application } from "pixi.js"
import { Bag } from "./bag"
import { BoardView, RackView, tileSize } from "./view"
import { Dragger } from "./dragger"
import { Idea } from "./idea"
import { Word } from "./board"
import { checkWord } from "./dict"
import { mkButton, buttonSize } from "./ui"

export abstract class RackIdea extends Idea {
  readonly dragger: Dragger
  readonly board: BoardView
  readonly rack: RackView

  constructor(app: Application) {
    super(app)

    this.hitArea = app.screen
    const dragger = new Dragger(this)
    this.dragger = dragger
    this.sortableChildren = true

    const board = new BoardView(this, 7, 10)
    this.board = board
    this.addChild(board)
    dragger.addDropTarget(board)

    const rack = new RackView(this, 7)
    this.rack = rack
    this.addChild(rack)
    dragger.addDropTarget(rack)

    const boardRackGap = 30,
      rackButtonsGap = 20
    const uiHeight = board.height + boardRackGap + rack.height + rackButtonsGap + buttonSize
    const screenWidth = app.view.width / 2,
      screenHeight = app.view.height / 2

    board.x = (screenWidth - board.width) / 2
    board.y = (screenHeight - uiHeight) / 2
    rack.x = board.x
    rack.y = board.y + board.height + boardRackGap

    const bag = new Bag()
    function addTilesToRack(count: number) {
      for (let ii = 0; ii < count; ii += 1) {
        dragger.addDraggable(rack.addTile(bag.draw()))
      }
    }
    addTilesToRack(rack.size)

    const addButton = (xx: number, text: string, onClick: () => void) => {
      const button = mkButton(text, buttonSize)
      button.onPress.connect(onClick)
      button.x = rack.x + tileSize * xx + tileSize / 2
      button.y = rack.y + button.height + button.height / 2 + rackButtonsGap
      this.addChild(button)
      return button
    }

    addButton(0, "▼", () => board.returnToRack(rack))
    addButton(1, "↺", () => rack.shuffle())
    addButton(3, "◀︎", () => board.slide(-1, 0))
    addButton(4, "▶︎︎", () => board.slide(1, 0))

    const play = addButton(6, "▲", () => {
      const words = board.board.pendingWords()
      for (const word of words) {
        if (!checkWord(word.word)) {
          console.log(`No goodski ${word.word}`)
          board.shakePenders()
          return
        }
      }
      board.commitPenders()
      addTilesToRack(rack.size - rack.tileCount)
      this.playDidCommit(words)
    })
    board.tilesValid.onValue((valid) => (play.enabled = valid))

    this.gameWillStart()
  }

  abstract gameWillStart(): void
  abstract playDidCommit(words: Word[]): void
}
