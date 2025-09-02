import { gsap } from "gsap"
import {
  ColorSource,
  Container,
  DisplayObject,
  Graphics,
  FederatedPointerEvent,
  ObservablePoint,
  Rectangle,
  TextStyle,
  Text,
} from "pixi.js"
import { Board } from "./board"
import { Mutable } from "./core/react"
import { Draggable, DropTarget } from "./dragger"
import { colors } from "./ui"
import { sattoloShuffle } from "./util"
/* global setTimeout */

export const tileSize = 48
export const cornerSize = tileSize / 5

const defaultSize = 5
const textStyles = [5, 4, 3, 2, 1].map((size) => new TextStyle({
  fontFamily: "Courier",
  align: "center",
  fill: "#023047",
  fontSize: ((size / defaultSize) * (3 * tileSize)) / 4,
}))

const wellColor = colors.paper1
const wellOutlineColor = colors.grey4

const boardTileColor = colors.paper3
const rackTileColor = colors.paper5
const tileOutlineColor = colors.grey2
const highlightedTileColor = colors.paper4

const tileVel = 800
const minTweenTime = 0.1

function tweenTime(ox: number, oy: number, nx: number, ny: number, vel: number) {
  const dx = nx - ox
  const dy = ny - oy
  const dist = Math.sqrt(dx * dx + dy * dy)
  return Math.max(dist / vel, minTweenTime)
}

function move(
  pos :ObservablePoint<any>, x :number, y :number, tween :boolean,
  onArrive: (() => void) | null = null
) {
  if (tween) {
    const tt = gsap.to(pos, { x, y, duration: tweenTime(pos.x, pos.y, x, y, tileVel) })
    if (onArrive != null) tt.then(onArrive)
  } else {
    pos.set(x, y)
    if (onArrive != null) onArrive()
  }
}

const toKey = (tileX: number, tileY: number) => `${tileX}+${tileY}`
const makeTile = (letter :string, config? :TileConfig) => new TileView(letter, config)

export type TileConfig = {
  fillColor?: ColorSource
  size?: number
  borderWidth?: number
}

export class TileView extends Container implements Draggable {
  private bg: Graphics
  private text: Text
  private config? :TileConfig

  private get normalColor () { return this.config?.fillColor ?? boardTileColor }
  private get borderWidth () { return this.config?.borderWidth ?? 2 }

  /** The size of the text on the tile (`5` to `1`). */
  get size() {
    return this._size
  }
  private _size: number

  readonly letter: string
  tileX = 0
  tileY = 0
  get key(): string {
    return toKey(this.tileX, this.tileY)
  }

  host: BoardView | RackView | null = null

  get draggable() {
    return this.onpointerdown != null
  }

  // Drag hot zone configuration
  private static readonly dragHotZoneRatio = 0.7

  constructor(letter: string, config?: TileConfig) {
    super()
    this.letter = letter
    this.config = config
    const size = config?.size ?? defaultSize
    this._size = size

    const gfx = new Graphics()
    this.addChild((this.bg = gfx))
    this.setColor(this.normalColor)

    const text = (this.text = new Text(letter, textStyles[defaultSize - size]))
    text.anchor.set(0.5)
    this.addChild(text)
  }

  /**
   * Checks if the given coordinates (in tile's local space) are within the drag hot zone.
   * The drag hot zone is the inner portion of the tile defined by dragHotZoneRatio.
   * @param localX X coordinate in tile's local space
   * @param localY Y coordinate in tile's local space
   * @returns true if coordinates are in the drag hot zone
   */
  isInDragHotZone(localX: number, localY: number): boolean {
    const hotZoneSize = tileSize * TileView.dragHotZoneRatio
    const hotZoneHalfSize = hotZoneSize / 2

    return Math.abs(localX) <= hotZoneHalfSize && Math.abs(localY) <= hotZoneHalfSize
  }

  makeCommitted(fillColor? :ColorSource) {
    this.setColor(fillColor ?? boardTileColor)
    this.onpointerdown = null
  }

  /** Sets the size of the text on the tile.
    * @param size The desired size: `5` (largest) to `1` (smallest). */
  setSize(size: number) {
    this._size = size
    this.text.style = textStyles[defaultSize - size]
  }

  setColor(fillColor: ColorSource) {
    const gfx = this.bg
    gfx.clear()
    gfx.beginFill(fillColor)
    gfx.drawRoundedRect(
      -tileSize / 2 + 1,
      -tileSize / 2 + 1,
      tileSize - 2,
      tileSize - 2,
      cornerSize
    )
    gfx.endFill()
    gfx.lineStyle(this.borderWidth, tileOutlineColor)
    gfx.drawRoundedRect(
      -tileSize / 2 + 1,
      -tileSize / 2 + 1,
      tileSize - 2,
      tileSize - 2,
      cornerSize
    )

    // Draw the drag hot zone as a blue rectangle overlay
    // const hotZoneSize = tileSize * TileView.dragHotZoneRatio
    // const hotZoneHalfSize = hotZoneSize / 2
    // gfx.lineStyle(2, 0x0000ff, 1)
    // gfx.drawRect(-hotZoneHalfSize, -hotZoneHalfSize, hotZoneSize, hotZoneSize)
  }

  setHighlighted(highlighted: boolean) {
    this.setColor(highlighted ? highlightedTileColor : this.normalColor)
  }

  /** Moves (with or without animation) this tile to tx/ty on host. This does not change the
   * logical game state, it just moves this tile's visual representation. */
  moveTo(
    tx: number,
    ty: number,
    host: BoardView | RackView,
    tween: boolean,
    onArrive: (() => void) | null = null
  ) {
    const { x, y } = host.tilePos(tx, ty)
    move(this.position, x, y, tween, onArrive)
  }

  /** Places this tile at tx/ty on host without checking whether another tile is there. */
  dropOn(tx: number, ty: number, host: BoardView | RackView, tween: boolean) {
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
  dropWithSwap(tx: number, ty: number, host: BoardView | RackView): boolean {
    const other = host.tileAt(tx, ty)
    if (other != undefined && other != this) {
      if (!other.draggable) return false
      other.dropOn(this.tileX, this.tileY, this.host!, true)
      this.dropOn(tx, ty, host, true)
      return true
    }
    this.dropOn(tx, ty, host, true)
    return true
  }

  shrinkAndDestroy() {
    this.destroy() // TODO
  }

  shake(offset: number, duration: number) {
    const initialX = this.x,
      initialY = this.y
    const tl = gsap.timeline({ repeat: -1 })
    tl.to(this.position, {
      duration: 0.05,
      x: initialX - offset,
      ease: "slow",
    })
    tl.to(this.position, {
      duration: 0.05,
      x: initialX + offset,
      ease: "slow",
    })
    setTimeout(() => {
      tl.kill()
      this.position.set(initialX, initialY)
    }, duration * 1000)
  }

  // from Draggable
  onUndrop() {
    const host = this.host
    if (host != null) this.dropOn(this.tileX, this.tileY, host, true)
  }

  override toString() {
    return `${this.letter} @ +${this.tileX}+${this.tileY}`
  }

  override destroy() {
    super.destroy()
    this.unhost()
  }

  private unhost() {
    this.host?.unhosted(this)
    this.host = null
  }
}

function drawWells(gfx: Graphics, width: number, height: number, hexOffset: boolean) {
  const inset = 3
  const cellSize = tileSize - 2 * inset
  gfx.lineStyle(2, wellOutlineColor)
  for (let yy = 0; yy < height; yy += 1) {
    for (let xx = 0; xx < width; xx += 1) {
      const dy = !hexOffset || xx % 2 == 0 ? 0 : tileSize / 2
      gfx.beginFill(wellColor)
      gfx.drawRoundedRect(
        tileSize * xx + inset,
        tileSize * yy + inset + dy,
        cellSize,
        cellSize,
        cornerSize
      )
      gfx.endFill()
    }
  }
}

export type BoardConfig = {
  width :number
  height :number
  hexOffset? :boolean
  commitColor? :ColorSource
  makeTile? :(letter :string, config? :TileConfig) => TileView
}

export class BoardView extends Container implements DropTarget {
  private tiles = new Map<string, TileView>()
  private glyphs = new Map<string, DisplayObject>()
  private offsetX = 0
  private offsetY = 0
  private config :BoardConfig
  readonly stage: Container
  readonly tilesValid = Mutable.local(false)
  readonly board = new Board()

  get tileWidth(): number { return this.config.width }
  get tileHeight(): number { return this.config.height }
  get hexOffset(): boolean { return this.config.hexOffset ?? false }
  get topRow(): number { return -this.offsetY }
  get leftCol(): number { return -this.offsetX }

  constructor(stage: Container, config :BoardConfig) {
    super()
    this.stage = stage
    this.config = config
    const hitWidth = tileSize * config.width
    const hitHeight = tileSize * config.height + (this.hexOffset ? tileSize / 2 : 0)
    this.hitArea = new Rectangle(0, 0, hitWidth, hitHeight)

    const gfx = new Graphics()
    gfx.zIndex = -1
    drawWells(gfx, config.width, config.height, this.hexOffset)
    this.addChild(gfx)
  }

  getTileCoordinatesFromEvent(ev: FederatedPointerEvent): { x: number; y: number } | null {
    const local = this.toLocal(ev.global)
    const tx = Math.floor(local.x / tileSize) - this.offsetX
    const dy = !this.hexOffset || tx % 2 == 0 ? 0 : tileSize / 2
    const ty = Math.floor((local.y - dy) / tileSize) - this.offsetY

    // Check bounds
    if (tx < 0 || ty < 0 || tx >= this.tileWidth || ty >= this.tileHeight) {
      return null
    }

    return { x: tx, y: ty }
  }

  get glyphCount() :number {
    return this.glyphs.size
  }

  addGlyph(tileX :number, tileY :number, glyph :DisplayObject) {
    this.glyphs.set(toKey(tileX, tileY), glyph)
    const { x, y } = this.tilePos(tileX, tileY)
    glyph.position.set(x, y)
    this.stage.addChild(glyph)
  }

  clearGlyph(tileX :number, tileY :number) {
    const key = toKey(tileX, tileY)
    const glyph = this.glyphs.get(key)
    if (glyph) {
      this.glyphs.delete(key)
      glyph.destroy() // TODO: animation?
    }
  }

  addStartWord(word: string, startX: number, y: number, config?: TileConfig) {
    for (let ii = 0; ii < word.length; ii += 1) {
      this.addTile(word.charAt(ii), startX + ii, y, config)
    }
    this.board.commitPending()
  }

  addTile(text: string, x: number, y: number, config?: TileConfig): TileView {
    const tile = (this.config.makeTile ?? makeTile)(text, config)
    tile.dropOn(x, y, this, false)
    this.stage.addChild(tile)
    return tile
  }

  tileAt(tileX: number, tileY: number): TileView | undefined {
    return this.tiles.get(toKey(tileX, tileY))
  }

  tilePos(tileX: number, tileY: number): { x: number; y: number } {
    const vx = tileX + this.offsetX
    const vy = tileY + this.offsetY
    const dy = !this.hexOffset || tileX % 2 == 0 ? 0 : tileSize / 2
    return {
      x: this.x + vx * tileSize + tileSize / 2,
      y: this.y + vy * tileSize + tileSize / 2 + dy,
    }
  }

  onTiles(op :(tile :TileView) => void) {
    for (const tile of this.tiles.values()) op(tile)
  }

  hosted(tile: TileView) {
    if (this.tiles.has(tile.key)) throw Error(`Can't add tile (${tile}) to occupied slot`)
    this.tiles.set(tile.key, tile)
    this.board.setTile(tile.tileX, tile.tileY, tile.letter)
    this.tilesValid.update(this.board.pendingValid())
    // console.log(`Added ${tile.letter}, valid ${this.board.pendingValid()}`)
  }

  unhosted(tile: TileView) {
    this.tiles.delete(tile.key)
    this.board.clearTile(tile.tileX, tile.tileY)
    this.tilesValid.update(this.board.pendingValid())
  }

  // from DropTarget
  onDrop(obj: DisplayObject, ev: FederatedPointerEvent): boolean {
    if (!(obj instanceof TileView)) return false
    const local = this.toLocal(ev.global)
    const tx = Math.floor(local.x / tileSize) - this.offsetX
    const ty = Math.floor(local.y / tileSize) - this.offsetY
    return obj.dropWithSwap(tx, ty, this)
  }

  returnToRack(rack: RackView) {
    const slots = rack.unusedSlots()
    let nn = 0
    for (const tile of this.tiles.values()) {
      if (!tile.draggable) continue
      tile.dropOn(slots[nn], 0, rack, true)
      nn += 1
    }
  }

  shakePenders(duration: number = 0.35) {
    for (const tile of this.tiles.values()) {
      if (tile.draggable) tile.shake(1, duration)
    }
  }

  commitPenders() {
    this.board.commitPending()
    const commitColor = this.config.commitColor ?? boardTileColor
    for (const tile of this.tiles.values()) {
      if (tile.draggable) tile.makeCommitted(commitColor)
    }
  }

  slide(dx: number, dy: number, destroy: boolean = false): boolean {
    const { tileWidth, tileHeight } = this
    // if this slide would put any tiles out of bounds, reject it
    for (const tile of this.tiles.values()) {
      const nx = tile.tileX + this.offsetX + dx,
        ny = tile.tileY + this.offsetY + dy
      if (nx < 0 || ny < 0 || nx >= tileWidth || ny >= tileHeight) {
        if (destroy) tile.shrinkAndDestroy()
        else return false
      }
    }
    this.offsetX += dx
    this.offsetY += dy
    // move the tiles to their same position, which will pick up the new offset
    for (const tile of this.tiles.values()) {
      tile.moveTo(tile.tileX, tile.tileY, this, true)
    }
    return true
  }

  /**
   * Checks if (x2, y2) is a neighbor of (x1, y1), considering hexOffset mode.
   * In normal mode: up/down/left/right. In hexOffset: also allow the offset neighbor.
   */
  isNeighbor(x1: number, y1: number, x2: number, y2: number): boolean {
    if (x1 === x2 && y1 === y2) return false
    if (!this.hexOffset) {
      // Normal 4-way adjacency
      return (x1 === x2 && Math.abs(y1 - y2) === 1) || (y1 === y2 && Math.abs(x1 - x2) === 1)
    } else {
      // Hex offset: normal neighbors plus offset diagonal
      const dx = x2 - x1
      const dy = y2 - y1
      if ((dx === 0 && Math.abs(dy) === 1) || (dy === 0 && Math.abs(dx) === 1)) {
        return true
      }
      if (dx === 1 || dx === -1) {
        if (x1 % 2 === 0) {
          // Even column: allow (x±1, y-1)
          if (dy === -1) return true
        } else {
          // Odd column: allow (x±1, y+1)
          if (dy === 1) return true
        }
      }
      return false
    }
  }
}

export type RackConfig = {
  size :number
  makeTile? :(letter :string, config? :TileConfig) => TileView
}

export class RackView extends Container implements DropTarget {
  private tiles = new Map<string, TileView>()
  private makeTile :(letter :string, config? :TileConfig) => TileView
  readonly stage: Container
  readonly size: number

  // a callback if someone wants to hook into when this rack is rearranged
  onRearranged :(letters :string) => void = () => {}

  constructor(stage: Container, config: RackConfig) {
    super()
    this.stage = stage
    this.size = config.size
    this.makeTile = config.makeTile ?? makeTile
    const gfx = new Graphics()
    drawWells(gfx, this.size, 1, false)
    this.addChild(gfx)
  }

  get tileCount(): number {
    return this.tiles.size
  }

  get tileLetters() :string {
    let letters = ""
    for (let ii = 0; ii < this.tileCount; ii += 1) {
      letters += this.tileAt(ii, 0)?.letter ?? ""
    }
    return letters
  }

  addTile(text: string): TileView {
    for (let xx = 0; xx < this.size; xx += 1) {
      if (this.tiles.has(toKey(xx, 0))) continue
      return this._addTileAt(xx, text)
    }
    throw new Error(`Cannot add tile (${text}) to full rack.`)
  }

  /** Adds a tile at `pos`.
    * @return the added tile view if the tile was added, `null` if `pos` was already occupied. */
  addTileAt(pos :number, text :string) :TileView | null {
    if (this.tiles.has(toKey(pos, 0))) return null
    return this._addTileAt(pos, text)
  }

  private _addTileAt(pos :number, text :string) :TileView {
    const tile = this.makeTile(text, { fillColor: rackTileColor })
    tile.dropOn(pos, 0, this, false)
    this.stage.addChild(tile)
    return tile
  }

  clearTiles(animate :boolean) {
    for (let ii = 0; ii < this.tileCount; ii += 1) {
      const tile = this.tileAt(ii, 0)
      if (tile) {
        if (animate) tile.shrinkAndDestroy()
        else tile.destroy()
      }
    }
    this.tiles.clear()
  }

  /** Puts non-interactive tiles on the rack that display `text`. `text` must be fewer letters than
    * the size of the rack and spaces will result in skipped tile positions. */
  showMessage(text :string) {
    let offX = Math.floor((this.size - text.length) / 2)
    for (let ii = 0, ll = Math.min(this.size, text.length); ii < ll; ii += 1) {
      const letter = text.charAt(ii)
      if (letter == " ") continue
      const tile = this.addTileAt(offX + ii, letter)!
      tile.makeCommitted()
    }
  }

  tileAt(tileX: number, tileY: number): TileView | undefined {
    return this.tiles.get(toKey(tileX, tileY))
  }

  tilePos(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: this.x + tileX * tileSize + tileSize / 2,
      y: this.y + tileY * tileSize + tileSize / 2,
    }
  }

  hosted(tile: TileView) {
    if (this.tiles.has(tile.key)) throw Error(`Can't add tile (${tile}) to occupied slot`)
    this.tiles.set(tile.key, tile)
    this.onRearranged(this.tileLetters)
  }

  unhosted(tile: TileView) {
    this.tiles.delete(tile.key)
  }

  // from DropTarget
  onDrop(obj: DisplayObject, ev: FederatedPointerEvent): boolean {
    if (!(obj instanceof TileView)) return false
    const local = this.toLocal(ev.global)
    const tx = Math.floor(local.x / tileSize)

    // if we're dropping a tile from the rack onto another rack tile, slide all the tiles over
    // instead of just swapping the dropped tile with the tile on which it was dropped
    if (obj.host === this) {
      const other = this.tileAt(tx, 0)
      if (other === undefined || other === obj) {
        obj.dropOn(tx, 0, this, true)
        return true
      }
      if (!other.draggable) return false

      // find the nearest empty space to the left or right of the spot being filled
      obj.dropOn(tx, 0, this, true)
      for (let dx = 1; dx < this.size; dx += 1) {
        let ex = tx-dx
        let dd = 1
        let tile = this.tileAt(ex, 0)
        if (ex < 0 || tile !== undefined) {
          ex = tx+dx
          dd = -1
          tile  = this.tileAt(ex, 0)
        }
        if (ex >= 0 && ex < this.size && tile === undefined) {
          for (let mx = ex; mx != tx; mx += dd) {
            const tile = this.tileAt(mx+dd, 0)
            tile?.dropOn(mx, 0, this, true)
          }
          return true
        }
      }
    }

    // if all else fails, just swap the two tiles
    return obj.dropWithSwap(tx, 0, this)
  }

  unusedSlots(): number[] {
    const unused: number[] = []
    for (let ii = 0; ii < this.size; ii += 1) if (!this.tileAt(ii, 0)) unused.push(ii)
    return unused
  }

  shuffle() {
    const indices = sattoloShuffle(Array.from(Array(this.size).keys()))
    for (let ii = 0; ii < this.size; ii += 1) {
      const tile = this.tileAt(ii, 0)
      if (tile) {
        tile.dropOn(indices[ii], 0, this, true)
      }
    }
  }
}
