import { Application, Container } from "pixi.js"
import { mkButton, buttonSize } from "./ui"
import { WordWalk } from "./walk"

const app = new Application({
  view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  backgroundColor: 0x429EBD,
  width: 480,
  height: 720
})

const games = [
  {title: "Word Walk", maker: () => new WordWalk(app)}
]

class MenuView extends Container {

  constructor () {
    super()
    // manual layout, so awesome!
    const buttonWidth = 4*buttonSize, buttonGap = 20
    const menuHeight = games.length * buttonSize + (games.length-1) * buttonGap
    const screenWidth = app.view.width/2, screenHeight = app.view.height/2
    var yy = (screenHeight - menuHeight) / 2 + buttonSize/2
    for (var {title, maker} of games) {
      const button = mkButton(title, buttonWidth, buttonSize)
      button.onPress.connect(() => {
        this.destroy()
        const game = maker()
        app.stage.addChild(game)

        const back = mkButton("↤", buttonSize);
        back.x = buttonSize/2 + 10
        back.y = buttonSize/2 + 10
        back.onPress.connect(() => {
          game.destroy()
          back.destroy()
          app.stage.addChild(new MenuView())
        })
        app.stage.addChild(back)
      })
      button.x = screenWidth/2
      button.y = yy
      this.addChild(button)
      yy += (buttonSize + buttonGap)
    }
  }
}

app.stage.addChild(new MenuView())
