import { Application, Container } from "pixi.js"
import { mkButton, buttonSize } from "./ui"

export abstract class Idea extends Container {
  readonly app: Application

  constructor(app :Application) {
    super()
    this.app = app
  }

  addBackButton (onBack :() => void) {
    const back = mkButton("◀︎︎", buttonSize)
    back.x = buttonSize / 2 + 10
    back.y = buttonSize / 2 + 10
    back.onPress.connect(() => {
      this.destroy()
      onBack()
    })
    this.addChild(back)
  }

  startGame () {}
}
