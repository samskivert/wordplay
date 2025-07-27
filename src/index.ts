import { Application, Container, Text } from "pixi.js"
import { Idea } from "./idea"
import { Idea1 } from "./idea1"
import { Idea2 } from "./idea2"
import { Idea3 } from "./idea3"
import { Idea4 } from "./idea4"
import { mkButton, buttonSize, titleStyle } from "./ui"

const app = new Application({
  // eslint-disable-next-line no-undef
  view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  backgroundColor: 0x429ebd,
  width: 480,
  height: 720,
})

type Maker = (app :Application) => Idea
const games :Maker[] = [
  (app) => new Idea1(app),
  (app) => new Idea2(app),
  (app) => new Idea3(app),
  (app) => new Idea4(app),
]

class MenuView extends Container {
  constructor() {
    super()

    // manual layout, so awesome!
    const buttonWidth = buttonSize * 1.5
    const buttonGap = 20
    const cols = Math.min(games.length, 5)
    const rows = Math.ceil(games.length / cols)
    const menuWidth = cols * buttonWidth + (cols - 1) * buttonGap
    const menuHeight = rows * buttonSize + (rows - 1) * buttonGap
    const screenWidth = app.view.width / 2
    const screenHeight = app.view.height / 2
    const startx = (screenWidth - menuWidth) / 2 + buttonWidth / 2

    let xx = startx, yy = (screenHeight - menuHeight) / 2 + buttonSize / 2, col = 0
    for (const [idx, maker] of games.entries()) {
      const label = idx+1 < 10 ? `0${idx+1}` : `${idx+1}`
      const button = mkButton(label, buttonWidth, buttonSize)
      button.onPress.connect(() => {
        this.start(maker)
      })
      button.x = xx
      button.y = yy
      this.addChild(button)
      xx += buttonWidth + buttonGap
      col += 1
      if (col == cols) {
        yy += buttonSize + buttonGap
        xx = startx
        col = 0
      }
    }

    // Create text element for current word
    const titleText = new Text("Word Play", titleStyle)
    titleText.anchor.set(0.5)
    titleText.x = screenWidth / 2
    titleText.y = (screenHeight - menuHeight) / 4
    this.addChild(titleText)
  }

  start (maker :Maker) {
    this.destroy()
    const idea = maker(app)
    idea.addBackButton(() => {
      idea.destroy()
      app.stage.addChild(new MenuView())
    })
    app.stage.addChild(idea)
  }
}

app.stage.addChild(new MenuView())
