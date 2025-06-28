import { Application, DisplayObject, FederatedPointerEvent, Rectangle } from "pixi.js"

export interface Draggable extends DisplayObject {
  onUndrop(): void
}

export interface DropTarget extends DisplayObject {
  onDrop(obj: DisplayObject, ev: FederatedPointerEvent): boolean
}

export class Dragger {
  private dragged: Draggable | null = null
  private targets: DropTarget[] = []

  constructor(app: Application) {
    app.stage.eventMode = "static"
    app.stage.hitArea = app.screen
    app.stage.sortableChildren = true

    app.stage.onpointermove = (ev) => {
      const dragged = this.dragged
      if (dragged) {
        dragged.parent.toLocal(ev.global, undefined, dragged.position)
      }
    }

    const testBounds = new Rectangle()
    app.stage.onpointerup = (ev) => {
      const dragged = this.dragged
      if (dragged) {
        this.dragged = null
        dragged.zIndex = 0

        for (const target of this.targets) {
          target.getBounds(true, testBounds)
          if (testBounds.contains(ev.global.x, ev.global.y)) {
            if (!target.onDrop(dragged, ev)) dragged.onUndrop()
            return
          }
        }
        dragged.onUndrop()
      }
    }
  }

  addDraggable(obj: Draggable) {
    obj.eventMode = "dynamic"
    obj.onpointerdown = (_) => {
      this.dragged = obj
      obj.zIndex = 1
    }
  }

  addDropTarget(target: DropTarget) {
    this.targets.push(target)
  }
}
