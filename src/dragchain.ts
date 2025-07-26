import { FederatedPointerEvent } from "pixi.js"
import { BoardView, TileView } from "./view"

export class DragChain {
  private isDragging = false
  private dragChain: Array<{ x: number; y: number }> = []
  private highlightedTiles = new Set<TileView>()
  private boardView: BoardView

  onDragComplete: (chain: Array<{ x: number; y: number }>) => void = () => {}

  constructor(boardView: BoardView) {
    this.boardView = boardView
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.boardView.eventMode = "static"
    this.boardView.on("pointerdown", this.onPointerDown.bind(this))
    this.boardView.on("pointermove", this.onPointerMove.bind(this))
    this.boardView.on("pointerup", this.onPointerUp.bind(this))
    this.boardView.on("pointerupoutside", this.onPointerUp.bind(this))
  }

  private onPointerDown(ev: FederatedPointerEvent) {
    const coords = this.boardView.getTileCoordinatesFromEvent(ev)
    if (!coords) return

    const tile = this.boardView.tileAt(coords.x, coords.y)
    if (!tile) return

    this.isDragging = true
    this.dragChain = [coords]
    this.highlightTile(coords.x, coords.y)
  }

  private onPointerMove(ev: FederatedPointerEvent) {
    if (!this.isDragging) return

    const coords = this.boardView.getTileCoordinatesFromEvent(ev)
    if (!coords) return

    const tile = this.boardView.tileAt(coords.x, coords.y)
    if (!tile) return

    // Check if mouse is in the tile's drag hot zone
    const localPos = tile.toLocal(ev.global)
    if (!tile.isInDragHotZone(localPos.x, localPos.y)) return

    // Check if we're going back to a previous tile in the chain
    const existingIndex = this.dragChain.findIndex(
      (pos) => pos.x === coords.x && pos.y === coords.y
    )

    if (existingIndex !== -1) {
      // Truncate the chain back to this tile
      this.dragChain = this.dragChain.slice(0, existingIndex + 1)
      this.updateHighlightedTiles()
    } else {
      // Add new tile to chain
      this.dragChain.push(coords)
      this.highlightTile(coords.x, coords.y)
    }
  }

  private onPointerUp() {
    if (!this.isDragging) return

    this.isDragging = false
    this.clearAllHighlights()
    const chain = [...this.dragChain]
    this.dragChain = []
    this.onDragComplete(chain)
  }

  private highlightTile(x: number, y: number) {
    const tile = this.boardView.tileAt(x, y)
    if (tile) {
      tile.setHighlighted(true)
      this.highlightedTiles.add(tile)
    }
  }

  private clearAllHighlights() {
    for (const tile of this.highlightedTiles) {
      tile.setHighlighted(false)
    }
    this.highlightedTiles.clear()
  }

  private updateHighlightedTiles() {
    // Clear all current highlights
    this.clearAllHighlights()

    // Re-highlight only the tiles in the current chain
    for (const coords of this.dragChain) {
      this.highlightTile(coords.x, coords.y)
    }
  }

  getCurrentChain(): Array<{ x: number; y: number }> {
    return [...this.dragChain]
  }

  isActive(): boolean {
    return this.isDragging
  }
}
