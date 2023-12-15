import { Application, DisplayObject, FederatedPointerEvent, Rectangle } from "pixi.js"

const noopUndrop :() => void = () => {}

export interface DropTarget extends DisplayObject {

  onDrop (obj :DisplayObject, ev :FederatedPointerEvent) :boolean
}

export class Dragger {
  private dragged :DisplayObject|null = null
  private onUndrop = noopUndrop
  private targets :DropTarget[] = []

  constructor (app :Application) {
    app.stage.eventMode = "static"
    app.stage.hitArea = app.screen
    app.stage.sortableChildren = true

    app.stage.onpointermove = (ev) => {
      const dragged = this.dragged
      if (dragged) {
        dragged.parent.toLocal(ev.global, undefined, dragged.position);
      }
    }

    const testBounds = new Rectangle()
    app.stage.onpointerup = (ev) => {
      const dragged = this.dragged
      if (dragged) {
        const onUndrop = this.onUndrop
        this.dragged = null
        this.onUndrop = noopUndrop
        dragged.zIndex = 0

        for (const target of this.targets) {
          target.getBounds(true, testBounds)
          if (testBounds.contains(ev.global.x, ev.global.y)) {
            if (!target.onDrop(dragged, ev)) onUndrop()
            return
          }
        }
        onUndrop()
      }
    }
  }

  addDraggable (obj :DisplayObject, onUndrop: () => void) {
    obj.eventMode = "dynamic"
    obj.onpointerdown = (_) => {
      this.dragged = obj
      this.onUndrop = onUndrop
      obj.zIndex = 1
    }
  }

  addDropTarget (target :DropTarget) {
    this.targets.push(target)
  }
}
