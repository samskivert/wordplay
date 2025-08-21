import { Application, Container, Graphics, Text } from "pixi.js"
import { mkButton, buttonSize, colors, buttonTextStyle } from "./ui"

export abstract class Idea extends Container {
  readonly app: Application

  constructor(app: Application) {
    super()
    this.app = app
  }

  abstract get info(): string[]

  addBackButton(onBack: () => void) {
    const back = mkButton("◀︎︎", buttonSize)
    back.x = buttonSize / 2 + 10
    back.y = buttonSize / 2 + 10
    back.onPress.connect(() => {
      this.destroy()
      onBack()
    })
    this.addChild(back)
  }

  startGame() {
    const infoButton = mkButton("?", buttonSize)
    infoButton.x = this.app.screen.width - buttonSize / 2 - 10
    infoButton.y = buttonSize / 2 + 10
    infoButton.onPress.connect(() => this.showInfo())
    this.addChild(infoButton)
  }

  private showInfo() {
    const popupWidth = 400
    const padding = 20

    let nextInfoY = padding
    const infoTexts = this.info.map(info => {
      const infoText = new Text(info, {
        ...buttonTextStyle,
        fontSize: 16,
        wordWrap: true,
        wordWrapWidth: popupWidth - padding * 2,
        align: "left",
      })
      infoText.anchor.set(0, 0)
      infoText.x = padding
      infoText.y = nextInfoY
      nextInfoY += infoText.height + padding
      return infoText
    })

    const totalHeight = nextInfoY
    const popupBackground = new Graphics()
      .beginFill(colors.paper1)
      .lineStyle(3, colors.grey2)
      .drawRoundedRect(0, 0, popupWidth, totalHeight, 10)
      .endFill()

    const popup = new Container()
    popup.addChild(popupBackground)
    infoTexts.forEach(text => popup.addChild(text))

    popup.x = (this.app.screen.width - popupWidth) / 2
    popup.y = (this.app.screen.height - totalHeight) / 2

    const dimmingOverlay = new Graphics().
      beginFill(0x000000, 0.5).
      drawRect(0, 0, this.app.screen.width, this.app.screen.height).
      endFill()
    dimmingOverlay.eventMode = "static"
    dimmingOverlay.on("pointerdown", () => {
      this.removeChild(dimmingOverlay)
      this.removeChild(popup)
    })

    this.addChild(dimmingOverlay)
    this.addChild(popup)
  }
}
