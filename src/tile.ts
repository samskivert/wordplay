import {
  Container, DisplayObject, Graphics, FederatedPointerEvent, Point, Rectangle, TextStyle, Text
} from "pixi.js"
import { Tween } from "@tweenjs/tween.js"
import { DropTarget } from "./dragger"

export const tileSize = 48
export const cellSize = tileSize + tileSize/5

const tiles = new Set<Tile>()

function tweenTime (ox :number, oy :number, nx :number, ny :number, vel :number) {
  const dx = nx-ox ; const dy = ny-oy
  const dist = Math.sqrt(dx*dx + dy*dy)
  return Math.max(dist/vel, 50)
}

function tweenTo (point :Point, nx :number, ny :number, vel :number) {
  new Tween(point).to({ x: nx, y: ny }, tweenTime(point.x, point.y, nx, ny, vel)).start()
}

export class Tile extends Container {
  readonly text :string
  tileX = 0
  tileY = 0
  host :Board|Rack|null = null

  constructor (text :string) {
    super()
    this.text = text

    const gfx = new Graphics()
    gfx.beginFill(0x996633)
    gfx.drawRoundedRect(-tileSize/2, -tileSize/2, tileSize, tileSize, tileSize/10)
    gfx.endFill()
    gfx.lineStyle(2, 0x333333)
    gfx.drawRoundedRect(-tileSize/2, -tileSize/2, tileSize, tileSize, tileSize/10)
    this.addChild(gfx)

    const styly = new TextStyle({
      align: "center",
      fill: "#DDCCCC",
      fontSize: 3*tileSize/4
    })
    const texty = new Text(text, styly)
    texty.anchor.set(0.5)
    this.addChild(texty)

    tiles.add(this)
  }

  get draggable () {
    return this.onpointerdown != null
  }

  /** Moves this tile to tx/ty on host without checking whether another tile is there. */
  moveTo (tx :number, ty :number, host :Board|Rack, tween :boolean = false) {
    const nx = host.x + tx*tileSize + tileSize/2
    const ny = host.y + ty*tileSize + tileSize/2
    if (tween) tweenTo(this.position, nx, ny, 2)
    else this.position.set(nx, ny)
    this.tileX = tx
    this.tileY = ty
    this.host = host
  }

  /** Moves this tile to tx/ty on host, swapping with any draggable tile that's already there.
    * @return `false` if a non-draggable tile is at that location, `true` otherwise.
    */
  moveWithSwap (tx :number, ty :number, host :Board|Rack) :boolean {
    for (let other of tiles) {
      if (other.host == host && other.tileX == tx && other.tileY == ty) {
        if (!other.draggable) return false
        other.moveTo(this.tileX, this.tileY, this.host!, true)
        this.moveTo(tx, ty, host, true)
        return true
      }
    }
    this.moveTo(tx, ty, host, true)
    return true
  }

  returnToHost () {
    const host = this.host
    if (host != null) this.moveTo(this.tileX, this.tileY, host, true)
  }

  override destroy () {
    super.destroy()
    tiles.delete(this)
  }
}

export class Board extends Container implements DropTarget {
  readonly stage :Container
  readonly size :number

  constructor (stage :Container, size :number) {
    super()
    this.stage = stage
    this.size = size
    this.hitArea = new Rectangle(0, 0, tileSize*size, tileSize*size)

    const gfx = new Graphics()
    gfx.lineStyle(3, 0x99CCFF)
    for (let yy = 0; yy < this.size; yy += 1) {
      for (let xx = 0; xx < this.size; xx += 1) {
        gfx.drawRoundedRect(tileSize*xx, tileSize*yy, tileSize, tileSize, tileSize/10)
      }
    }
    this.addChild(gfx)
  }

  addTile (text :string, x :number, y :number) :Tile {
    const tile = new Tile(text)
    tile.moveTo(x, y, this)
    this.stage.addChild(tile)
    return tile
  }

  onDrop (obj :DisplayObject, ev :FederatedPointerEvent) :boolean {
    if (obj instanceof Tile) {
      let local = this.toLocal(ev.global)
      let tx = Math.floor(local.x/tileSize)
      let ty = Math.floor(local.y/tileSize)
      return obj.moveWithSwap(tx, ty, this)
    }
    return false
  }
}

export class Rack extends Container implements DropTarget {
  readonly stage :Container
  readonly size :number

  constructor (stage :Container, size :number) {
    super()
    this.stage = stage
    this.size = size

    const gfx = new Graphics()
    gfx.lineStyle(3, 0xCCFF99)
    for (let xx = 0; xx < this.size; xx += 1) {
      gfx.drawRoundedRect(tileSize*xx, 0, tileSize, tileSize, tileSize/10)
    }
    this.addChild(gfx)
  }

  addTile (text :string, x :number) :Tile {
    const tile = new Tile(text)
    tile.moveTo(x, 0, this)
    this.stage.addChild(tile)
    return tile
  }

  onDrop (obj :DisplayObject, ev :FederatedPointerEvent) :boolean {
    if (obj instanceof Tile) {
      let local = this.toLocal(ev.global)
      let tx = Math.floor(local.x/tileSize)
      return obj.moveWithSwap(tx, 0, this)
    }
    return false
  }
}
