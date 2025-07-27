import { ColorSource, Graphics, Text } from "pixi.js"
import { FancyButton } from "@pixi/ui"

export const titleStyle = {
  fontFamily: "Courier",
  fontSize: 48,
  fill: 0xffffff,
  stroke: 0x000000,
  strokeThickness: 3,
}

export const buttonTextStyle = {
  fontFamily: "Courier",
  fontSize: 28,
  fill: 0x000000,
}

function buttonFace(width: number, height: number, fill: ColorSource, outline: ColorSource) {
  const corner = Math.min(width, height) / 5
  return new Graphics()
    .beginFill(fill)
    .drawRoundedRect(0, 0, width, height, corner)
    .endFill()
    .lineStyle(2, outline)
    .drawRoundedRect(0, 0, width, height, corner)
}

export const buttonSize = 40

export function mkButton(text: string, width: number, height: number = buttonSize): FancyButton {
  const button = new FancyButton({
    defaultView: buttonFace(width, height, 0xcccccc, 0x333333),
    hoverView: buttonFace(width, height, 0xffffff, 0x666666),
    pressedView: buttonFace(width, height, 0xffffff, 0x000000),
    disabledView: buttonFace(width, height, 0x999999, 0x666666),
    text: new Text(text, buttonTextStyle),
    animations: {
      hover: {
        props: {
          scale: { x: 1.1, y: 1.1 },
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 1, y: 1 },
        },
        duration: 100,
      },
    },
  })
  button.anchor.set(0.5)
  return button
}
