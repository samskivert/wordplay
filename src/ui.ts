import { ColorSource, Graphics, Text } from "pixi.js"
import { FancyButton } from "@pixi/ui"

export const colors = {
  paper1: 0xf6eee3,
  paper2: 0xeee7d7,
  paper3: 0xe5decf,
  paper4: 0xe5cbba,
  paper5: 0xd9bda5,

  grey1: 0x333333,
  grey2: 0x666666,
  grey3: 0x999999,
  grey4: 0xCCCCCC,
}

export const titleStyle = {
  fontFamily: "Courier",
  fontSize: 48,
  fill: colors.paper3,
  stroke: colors.grey2,
  strokeThickness: 2,
}

export const buttonTextStyle = {
  fontFamily: "Courier",
  fontSize: 28,
  fill: colors.grey1,
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
    defaultView: buttonFace(width, height, colors.paper3, colors.grey2),
    hoverView: buttonFace(width, height, colors.paper4, colors.grey2),
    pressedView: buttonFace(width, height, colors.paper2, colors.grey1),
    disabledView: buttonFace(width, height, colors.paper1, colors.grey3),
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
