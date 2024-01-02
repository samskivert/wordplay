
export type Word = {
  word :string
  minX :number
  maxX :number
  minY :number
  maxY :number
}

const inRange = (min :number, max :number, n :number) => min <= n && max >= n
const wordContains = (word :Word, x :number, y :number) =>
  inRange(word.minX, word.maxX, x) && inRange(word.minY, word.maxY, y)

const inRect = (size :number, x :number, y :number) => x >= 0 && x < size && y >= 0 && y < size

const toKey = (tileX :number, tileY :number) => `${tileX}:${tileY}`

const dx = [0, 1, 0, -1]
const dy = [-1, 0, 1, 0]

export class Board {
  private tiles :(string|null)[][]
  private pending = new Set<string>()

  readonly size :number
  get pendingCount () :number { return this.pending.size }

  constructor (size :number) {
    this.size = size
    this.tiles = Array.from(new Array(size), _ => new Array(size).fill(null))
  }

  tileAt (x :number, y :number) :string|null {
    return inRect(this.size, x, y) ? this.tiles[y][x] : null
  }

  setTile (x :number, y :number, letter :string) {
    if (!inRect(this.size, x, y)) throw new Error(`Out of bounds set: {letter} @ {x},{y}`)
    this.tiles[y][x] = letter
    this.pending.add(toKey(x, y))
  }

  clearTile (x :number, y :number) {
    if (!inRect(this.size, x, y)) throw new Error(`Out of bounds clear: {x},{y}`)
    this.tiles[y][x] = null
    this.pending.delete(toKey(x, y))
  }

  commitPending () {
    this.pending.clear()
  }

  pendingValid () :boolean {
    let minx = this.size+1, maxx = -1, miny = this.size+1, maxy = -1
    this.onPendingTiles((x, y, _) => {
      minx = Math.min(minx, x)
      maxx = Math.max(maxx, x)
      miny = Math.min(miny, y)
      maxy = Math.max(maxy, y)
    })
    // make sure we have at least one tile and they're all in a line
    if ((maxx < minx) || (maxx - minx > 0 && maxy - miny > 0)) return false
    // make sure there are no gaps
    for (let yy = miny; yy <= maxy; yy += 1) for (let xx = minx; xx <= maxx; xx += 1) {
      if (!this.tileAt(xx, yy)) return false
    }
    // make sure at least one pending tile is adjacent to a fixed tile
    let found = false
    this.onPendingTiles((x, y, _) => {
      for (let dd = 0; !found && dd < 4; dd += 1) {
        const nx = x+dx[dd], ny = y+dy[dd]
        if (this.tileAt(nx, ny) && !this.pending.has(toKey(nx, ny))) found = true
      }
    })
    return found
  }

  pendingWords () :Word[] {
    let words :Word[] = []
    this.onPendingTiles((x, y, _) => {
      if (!words.find(w => w.maxX > w.minX && wordContains(w, x, y))) {
        let hword = this.findPlayedWord(x, y, 1, 0)
        if (hword) words.push(hword)
      }
      if (!words.find(w => w.maxY > w.minY && wordContains(w, x, y))) {
        let vword = this.findPlayedWord(x, y, 0, 1)
        if (vword) words.push(vword)
      }
    })
    return words
  }

  private findPlayedWord (tx :number, ty :number, dx :number, dy :number) :Word|null {
    let x = tx, y = ty
    // scan back to the start of the word
    while (this.tileAt(x-dx, y-dy) != null) { x -= dx ; y -= dy }
    // then scan forward to the end of the word
    const minX = x, minY = y
    let word = "", letter = this.tileAt(x, y)
    while (letter) {
      word += letter
      x += dx ; y += dy
      letter = this.tileAt(x, y)
    }
    const maxX = x-dx, maxY = y-dy
    // make sure the word is at least two letters long
    return minX == maxX && minY == maxY ? null : {word, minX, maxX, minY, maxY}
  }

  // private onTiles (op :(x :number, y :number, l :string, p :boolean) => void) {
  //   const {tiles, pending, size} = this
  //   for (let y = 0; y < size; y += 1) {
  //     for (let x = 0; x < size; x += 1) {
  //       const l = tiles[y][x]
  //       if (l != null) op(x, y, l, pending.has(toKey(x, y)))
  //     }
  //   }
  // }

  private onPendingTiles (op :(x :number, y :number, l :string) => void) {
    const {tiles, pending, size} = this
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const l = tiles[y][x]
        if (l != null && pending.has(toKey(x, y))) op(x, y, l)
      }
    }
  }
}
