import { ColorSource, Graphics, Text } from "pixi.js"
import { FancyButton } from "@pixi/ui"

export const paper1 = 0xf6eee3
export const paper2 = 0xeee7d7
export const paper3 = 0xe5decf
export const paper4 = 0xe5cbba
export const paper5 = 0xd9bda5

export const grey1 = 0x333333
export const grey2 = 0x666666
export const grey3 = 0x999999
export const grey4 = 0xCCCCCC

export const titleStyle = {
  fontFamily: "Courier",
  fontSize: 48,
  fill: paper3,
  stroke: grey2,
  strokeThickness: 2,
}

export const buttonTextStyle = {
  fontFamily: "Courier",
  fontSize: 28,
  fill: grey1,
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
    defaultView: buttonFace(width, height, paper3, grey2),
    hoverView: buttonFace(width, height, paper4, grey2),
    pressedView: buttonFace(width, height, paper2, grey1),
    disabledView: buttonFace(width, height, paper1, grey3),
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
