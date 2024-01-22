import { ColorSource, Graphics } from "pixi.js"
import { FancyButton } from "@pixi/ui"

function buttonFace (width :number, height :number, fill :ColorSource, outline :ColorSource) {
  const corner = Math.min(width, height)/5
  return new Graphics().
    beginFill(fill).drawRoundedRect(0, 0, width, height, corner).endFill().
    lineStyle(2, outline).drawRoundedRect(0, 0, width, height, corner)
}

export const buttonSize = 40

export function mkButton (text :string, width :number, height :number = buttonSize) :FancyButton {
  const button = new FancyButton({
    defaultView: buttonFace(width, height, 0xCCCCCC, 0x333333),
    hoverView: buttonFace(width, height, 0xFFFFFF, 0x666666),
    pressedView: buttonFace(width, height, 0xFFFFFF, 0x000000),
    disabledView: buttonFace(width, height, 0x999999, 0x666666),
    text: text,
    animations: {
      hover: {
        props: {
          scale: { x: 1.1, y: 1.1 }
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 1, y: 1 }
        },
        duration: 100,
      }
    }
  })
  button.anchor.set(0.5)
  return button
}
