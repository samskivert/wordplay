import {
  ColorSource, Container, DisplayObject, Graphics, FederatedPointerEvent, Point, Rectangle,
  TextStyle, Text
} from "pixi.js"
import { Tween } from "@tweenjs/tween.js"
import { DropTarget } from "./dragger"

export const tileSize = 48
export const cornerSize = tileSize/5

const textStyle = new TextStyle({
  align: "center",
  fill: "#023047",
  fontSize: 3*tileSize/4
})

const tiles = new Set<Tile>()

function tweenTime (ox :number, oy :number, nx :number, ny :number, vel :number) {
  const dx = nx-ox ; const dy = ny-oy
  const dist = Math.sqrt(dx*dx + dy*dy)
  return Math.max(dist/vel, 50)
}

function tweenTo (point :Point, nx :number, ny :number, vel :number) {
  new Tween(point).to({ x: nx, y: ny }, tweenTime(point.x, point.y, nx, ny, vel)).start()
}

const wellColor = 0x429EBD
const wellOutlineColor = 0x9FE7F5

const boardTileColor = 0xF7AD19
const rackTileColor = 0xF27F0C
const tileOutlineColor = 0x053F5C

export function makeBoardTile (text :string) { return new Tile(text, boardTileColor) }
export function makeRackTile (text :string) { return new Tile(text, rackTileColor) }

export class Tile extends Container {
  private bg :Graphics

  readonly letter :string
  tileX = 0
  tileY = 0
  host :Board|Rack|null = null

  constructor (letter :string, fillColor :ColorSource) {
    super()
    this.letter = letter

    const gfx = new Graphics()
    this.addChild(this.bg = gfx)
    this.setColor(fillColor)

    const text = new Text(letter, textStyle)
    text.anchor.set(0.5)
    this.addChild(text)

    tiles.add(this)
  }

  makeBoardTile () {
    this.setColor(boardTileColor)
  }

  setColor (fillColor :ColorSource) {
    const gfx = this.bg
    gfx.clear()
    gfx.beginFill(fillColor)
    gfx.drawRoundedRect(-tileSize/2+1, -tileSize/2+1, tileSize-2, tileSize-2, cornerSize)
    gfx.endFill()
    gfx.lineStyle(2, tileOutlineColor)
    gfx.drawRoundedRect(-tileSize/2+1, -tileSize/2+1, tileSize-2, tileSize-2, cornerSize)
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

function drawWells (gfx :Graphics, width :number, height :number) {
  const inset = 3 ; const cellSize = tileSize-2*inset
  gfx.lineStyle(2, wellOutlineColor)
  for (let yy = 0; yy < height; yy += 1) {
    for (let xx = 0; xx < width; xx += 1) {
      gfx.beginFill(wellColor)
      gfx.drawRoundedRect(tileSize*xx+inset, tileSize*yy+inset, cellSize, cellSize, cornerSize)
      gfx.endFill()
    }
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
    drawWells(gfx, this.size, this.size)
    this.addChild(gfx)
  }

  addTile (text :string, x :number, y :number) :Tile {
    const tile = makeBoardTile(text)
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
    drawWells(gfx, this.size, 1)
    this.addChild(gfx)
  }

  addTile (text :string, x :number) :Tile {
    const tile = makeRackTile(text)
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
