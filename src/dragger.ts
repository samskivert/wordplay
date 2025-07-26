import { DisplayObject, FederatedPointerEvent, Rectangle, Container } from "pixi.js"

export interface Draggable extends DisplayObject {
  onUndrop(): void
}

export interface DropTarget extends DisplayObject {
  onDrop(obj: DisplayObject, ev: FederatedPointerEvent): boolean
}

export class Dragger {
  private dragged: Draggable | null = null
  private targets: DropTarget[] = []

  constructor(container: Container) {
    container.eventMode = "static"
    container.sortableChildren = true

    container.on("pointermove", (ev: FederatedPointerEvent) => {
      const dragged = this.dragged
      if (dragged) {
        dragged.parent.toLocal(ev.global, undefined, dragged.position)
      }
    })

    const testBounds = new Rectangle()
    container.on("pointerup", (ev: FederatedPointerEvent) => {
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
    })
  }

  addDraggable(obj: Draggable) {
    obj.eventMode = "dynamic"
    obj.onpointerdown = () => {
      this.dragged = obj
      obj.zIndex = 1
    }
  }

  addDropTarget(target: DropTarget) {
    this.targets.push(target)
  }
}
