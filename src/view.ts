import {
  ColorSource, Container, DisplayObject, Graphics, FederatedPointerEvent, Rectangle, TextStyle, Text
} from "pixi.js"
import { gsap } from "gsap"
import { Mutable } from "./core/react"
import { Draggable, DropTarget } from "./dragger"
import { Board } from "./board"

export const tileSize = 48
export const cornerSize = tileSize/5

const textStyle = new TextStyle({
  align: "center",
  fill: "#023047",
  fontSize: 3*tileSize/4
})

const tileVel = 800
const minTweenTime = 0.1

function tweenTime (ox :number, oy :number, nx :number, ny :number, vel :number) {
  const dx = nx-ox ; const dy = ny-oy
  const dist = Math.sqrt(dx*dx + dy*dy)
  return Math.max(dist/vel, minTweenTime)
}

const wellColor = 0x429EBD
const wellOutlineColor = 0x9FE7F5

const boardTileColor = 0xF7AD19
const rackTileColor = 0xF27F0C
const tileOutlineColor = 0x053F5C

function makeBoardTile (text :string) { return new TileView(text, boardTileColor) }
function makeRackTile (text :string) { return new TileView(text, rackTileColor) }

const toKey = (tileX :number, tileY :number) => `${tileX}+${tileY}`

export class TileView extends Container implements Draggable {
  private bg :Graphics

  readonly letter :string
  tileX = 0
  tileY = 0
  get key () :string { return toKey(this.tileX, this.tileY) }

  host :BoardView|RackView|null = null

  constructor (letter :string, fillColor :ColorSource) {
    super()
    this.letter = letter

    const gfx = new Graphics()
    this.addChild(this.bg = gfx)
    this.setColor(fillColor)

    const text = new Text(letter, textStyle)
    text.anchor.set(0.5)
    this.addChild(text)
  }

  makeCommitted () {
    this.setColor(boardTileColor)
    this.onpointerdown = null
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

  /** Moves (with or without animation) this tile to tx/ty on host. This does not change the
    * logical game state, it just moves this tile's visual representation. */
  moveTo (
    tx :number, ty :number, host :BoardView|RackView, tween :boolean,
    onArrive :(() => void)|null = null
  ) {
    const {x, y} = host.tilePos(tx, ty), pos = this.position
    if (tween) {
      const tt = gsap.to(pos, {x, y, duration: tweenTime(pos.x, pos.y, x, y, tileVel)})
      if (onArrive != null) tt.then(onArrive)
    } else {
      pos.set(x, y)
      if (onArrive != null) onArrive()
    }
  }

  /** Places this tile at tx/ty on host without checking whether another tile is there. */
  dropOn (tx :number, ty :number, host :BoardView|RackView, tween :boolean) {
    this.unhost()
    this.moveTo(tx, ty, host, tween, () => {
      this.tileX = tx
      this.tileY = ty
      this.host = host
      host.hosted(this)
    })
  }

  /** Places this tile at tx/ty on host, swapping with any draggable tile that's already there.
    * @return `false` if a non-draggable tile is at that location, `true` otherwise.
    */
  dropWithSwap (tx :number, ty :number, host :BoardView|RackView) :boolean {
    let other = host.tileAt(tx, ty)
    if (other != undefined && other != this) {
      if (!other.draggable) return false
      other.dropOn(this.tileX, this.tileY, this.host!, true)
      this.dropOn(tx, ty, host, true)
      return true
    }
    this.dropOn(tx, ty, host, true)
    return true
  }

  shrinkAndDestroy () {
    this.destroy() // TODO
  }

  shake (offset :number, duration :number) {
    const initialX = this.x, initialY = this.y
    const tl = gsap.timeline({repeat: -1})
    tl.to(this.position, {duration: .05, x: initialX - offset, ease: "slow"});
    tl.to(this.position, {duration: .05, x: initialX + offset, ease: "slow"});
    setTimeout(() => {
      tl.kill()
      this.position.set(initialX, initialY)
    }, duration*1000);
  }

  // from Draggable
  onUndrop () {
    const host = this.host
    if (host != null) this.dropOn(this.tileX, this.tileY, host, true)
  }

  override toString () { return `${this.letter} @ +${this.tileX}+${this.tileY}` }

  override destroy () {
    super.destroy()
    this.unhost()
  }

  private unhost () {
    this.host?.unhosted(this)
    this.host = null
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

export class BoardView extends Container implements DropTarget {
  private tiles = new Map<string, TileView>()
  private offsetX = 0
  private offsetY = 0
  readonly stage :Container
  readonly tilesValid = Mutable.local(false)
  readonly tileWidth :number
  readonly tileHeight :number
  readonly board = new Board()

  get topRow () :number { return -this.offsetY }
  get leftCol () :number { return -this.offsetX }

  constructor (stage :Container, width :number, height :number) {
    super()
    this.stage = stage
    this.tileWidth = width
    this.tileHeight = height
    this.hitArea = new Rectangle(0, 0, tileSize*width, tileSize*height)

    const gfx = new Graphics()
    drawWells(gfx, width, height)
    this.addChild(gfx)
  }

  addPendingTile (text :string, x :number, y :number) :TileView {
    const tile = makeBoardTile(text)
    tile.dropOn(x, y, this, false)
    this.stage.addChild(tile)
    return tile
  }

  tileAt (tileX :number, tileY :number) :TileView|undefined {
    return this.tiles.get(toKey(tileX, tileY))
  }

  tilePos (tileX :number, tileY :number) :{x :number, y :number} {
    const vx = tileX + this.offsetX, vy = tileY + this.offsetY
    return {x: this.x + vx*tileSize + tileSize/2, y: this.y + vy*tileSize + tileSize/2}
  }

  hosted (tile :TileView) {
    if (this.tiles.has(tile.key)) throw Error(`Can't add tile (${tile}) to occupied slot`)
    this.tiles.set(tile.key, tile)
    this.board.setTile(tile.tileX, tile.tileY, tile.letter)
    this.tilesValid.update(this.board.pendingValid())
    // console.log(`Added ${tile.letter}, valid ${this.board.pendingValid()}`)
  }

  unhosted (tile :TileView) {
    this.tiles.delete(tile.key)
    this.board.clearTile(tile.tileX, tile.tileY)
    this.tilesValid.update(this.board.pendingValid())
  }

  // from DropTarget
  onDrop (obj :DisplayObject, ev :FederatedPointerEvent) :boolean {
    if (!(obj instanceof TileView)) return false
    let local = this.toLocal(ev.global)
    let tx = Math.floor(local.x/tileSize) - this.offsetX
    let ty = Math.floor(local.y/tileSize) - this.offsetY
    return obj.dropWithSwap(tx, ty, this)
  }

  returnToRack (rack :RackView) {
    const slots = rack.unusedSlots()
    let nn = 0
    for (let tile of this.tiles.values()) {
      if (!tile.draggable) continue
      tile.dropOn(slots[nn], 0, rack, true)
      nn += 1
    }
  }

  shakePenders (duration :number = 0.75) {
    for (let tile of this.tiles.values()) {
      if (tile.draggable) tile.shake(3, duration)
    }
  }

  commitPenders () {
    this.board.commitPending()
    for (let tile of this.tiles.values()) {
      if (tile.draggable) tile.makeCommitted()
    }
  }

  slide (dx :number, dy :number, destroy :boolean = false) :boolean {
    const {tileWidth, tileHeight} = this
    // if this slide would put any tiles out of bounds, reject it
    for (let tile of this.tiles.values()) {
      let nx = tile.tileX + this.offsetX + dx, ny = tile.tileY + this.offsetY + dy
      if (nx < 0 || ny < 0 || nx >= tileWidth || ny >= tileHeight) {
        if (destroy) tile.shrinkAndDestroy()
        else return false
      }
    }
    this.offsetX += dx
    this.offsetY += dy
    // move the tiles to their same position, which will pick up the new offset
    for (let tile of this.tiles.values()) {
      tile.moveTo(tile.tileX, tile.tileY, this, true)
    }
    return true
  }
}

// shuffle elements but disallow element to remain in same place
function sattoloShuffle<N> (array :Array<N>) :Array<N> {
  for (let ii = array.length - 1; ii > 0; ii--) {
    const j = Math.floor(Math.random() * ii);
    [array[ii], array[j]] = [array[j], array[ii]]
  }
  return array
}

export class RackView extends Container implements DropTarget {
  private tiles = new Map<string, TileView>()
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

  get tileCount () :number { return this.tiles.size }

  addTile (text :string) :TileView {
    const tile = makeRackTile(text)
    for (let x = 0; x < this.size; x += 1) {
      if (this.tiles.has(toKey(x, 0))) continue
      tile.dropOn(x, 0, this, false)
      this.stage.addChild(tile)
      return tile
    }
    throw new Error(`Cannot add tile (${text}) to full rack.`)
  }

  tileAt (tileX :number, tileY :number) :TileView|undefined {
    return this.tiles.get(toKey(tileX, tileY))
  }

  tilePos (tileX :number, tileY :number) :{x :number, y :number} {
    return {x: this.x + tileX*tileSize + tileSize/2, y: this.y + tileY*tileSize + tileSize/2}
  }

  hosted (tile :TileView) {
    if (this.tiles.has(tile.key)) throw Error(`Can't add tile (${tile}) to occupied slot`)
    this.tiles.set(tile.key, tile)
  }

  unhosted (tile :TileView) {
    this.tiles.delete(tile.key)
  }

  // from DropTarget
  onDrop (obj :DisplayObject, ev :FederatedPointerEvent) :boolean {
    if (obj instanceof TileView) {
      let local = this.toLocal(ev.global)
      let tx = Math.floor(local.x/tileSize)
      return obj.dropWithSwap(tx, 0, this)
    }
    return false
  }

  unusedSlots () :number[] {
    let unused :number[] = []
    for (let ii = 0; ii < this.size; ii += 1) if (!this.tileAt(ii, 0)) unused.push(ii)
    return unused
  }

  shuffle () {
    const indices = sattoloShuffle(Array.from(Array(this.size).keys()))
    for (let ii = 0; ii < this.size; ii += 1) {
      const tile = this.tileAt(ii, 0)
      if (tile) {
        tile.dropOn(indices[ii], 0, this, true)
      }
    }
  }
}
