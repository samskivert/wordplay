import { Application } from "pixi.js"
import { Bag } from "./bag"
import { BoardConfig, BoardView, RackConfig, RackView, tileSize } from "./view"
import { Dragger } from "./dragger"
import { Idea } from "./idea"
import { Word } from "./board"
import { checkWord } from "./dict"
import { mkButton, buttonSize } from "./ui"

export type Config = {
  board :BoardConfig
  rack :RackConfig
}

const boardRackGap = 30, rackButtonsGap = 20

export abstract class RackIdea extends Idea {
  readonly dragger: Dragger
  readonly board: BoardView
  readonly rack: RackView

  protected get config() :Config {
    return {
      board: { width: 7, height: 10 },
      rack: { size: 7 },
    }
  }

  constructor(app: Application) {
    super(app)

    this.hitArea = app.screen
    const dragger = new Dragger(this)
    this.dragger = dragger
    this.sortableChildren = true

    const config = this.config
    const board = new BoardView(this, config.board)
    this.board = board
    this.addChild(board)
    dragger.addDropTarget(board)

    const rack = new RackView(this, config.rack)
    this.rack = rack
    this.addChild(rack)
    dragger.addDropTarget(rack)

    const uiHeight = board.height + boardRackGap + rack.height + rackButtonsGap + buttonSize
    const screenWidth = app.view.width / window.devicePixelRatio
    const screenHeight = app.view.height / window.devicePixelRatio

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

    this.addButton(0, "▼", () => board.returnToRack(rack))
    this.addButton(1, "↺", () => rack.shuffle())

    const play = this.addButton(6, "✓", () => {
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

  protected addButton (xx: number, text: string, onClick: () => void) {
    const button = mkButton(text, buttonSize)
    button.onPress.connect(onClick)
    button.x = this.rack.x + tileSize * xx + tileSize / 2
    button.y = this.rack.y + button.height + button.height / 2 + rackButtonsGap
    this.addChild(button)
    return button
  }

  abstract gameWillStart(): void
  abstract playDidCommit(words: Word[]): boolean
}
