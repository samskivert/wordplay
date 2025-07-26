export type Word = {
  word: string
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const inRange = (min: number, max: number, n: number) => min <= n && max >= n
const wordContains = (word: Word, x: number, y: number) =>
  inRange(word.minX, word.maxX, x) && inRange(word.minY, word.maxY, y)

const toKey = (tileX: number, tileY: number) => `${tileX}:${tileY}`
const toCoord = (key: string) => key.split(":").map((n) => parseInt(n))

const dx = [0, 1, 0, -1]
const dy = [-1, 0, 1, 0]

const Max = 65536

export class Board {
  private tiles = new Map<string, string>()
  private pending = new Set<string>()

  get pendingCount(): number {
    return this.pending.size
  }

  tileAt(x: number, y: number): string | undefined {
    return this.tiles.get(toKey(x, y))
  }

  setTile(x: number, y: number, letter: string) {
    const key = toKey(x, y)
    this.tiles.set(key, letter)
    this.pending.add(key)
  }

  clearTile(x: number, y: number) {
    const key = toKey(x, y)
    this.tiles.delete(key)
    this.pending.delete(key)
  }

  commitPending() {
    this.pending.clear()
  }

  pendingValid(): boolean {
    let minx = Max,
      maxx = -Max,
      miny = Max,
      maxy = -Max
    this.onPendingTiles((x, y, _) => {
      minx = Math.min(minx, x)
      maxx = Math.max(maxx, x)
      miny = Math.min(miny, y)
      maxy = Math.max(maxy, y)
    })
    // make sure we have at least one tile and they're all in a line
    if (maxx < minx || (maxx - minx > 0 && maxy - miny > 0)) return false
    // make sure there are no gaps
    for (let yy = miny; yy <= maxy; yy += 1)
      for (let xx = minx; xx <= maxx; xx += 1) {
        if (!this.tileAt(xx, yy)) return false
      }
    // make sure at least one pending tile is adjacent to a fixed tile
    let found = false
    this.onPendingTiles((x, y, _) => {
      for (let dd = 0; !found && dd < 4; dd += 1) {
        const nx = x + dx[dd],
          ny = y + dy[dd]
        if (this.tileAt(nx, ny) && !this.pending.has(toKey(nx, ny))) found = true
      }
    })
    return found
  }

  pendingWords(): Word[] {
    const words: Word[] = []
    this.onPendingTiles((x, y, _) => {
      if (!words.find((w) => w.maxX > w.minX && wordContains(w, x, y))) {
        const hword = this.findPlayedWord(x, y, 1, 0)
        if (hword) words.push(hword)
      }
      if (!words.find((w) => w.maxY > w.minY && wordContains(w, x, y))) {
        const vword = this.findPlayedWord(x, y, 0, 1)
        if (vword) words.push(vword)
      }
    })
    return words
  }

  haveTileIn(row: number): boolean {
    for (const key of this.tiles.keys()) {
      if (toCoord(key)[1] == row) return true
    }
    return false
  }

  private findPlayedWord(tx: number, ty: number, dx: number, dy: number): Word | null {
    let x = tx,
      y = ty
    // scan back to the start of the word
    while (this.tileAt(x - dx, y - dy) != null) {
      x -= dx
      y -= dy
    }
    // then scan forward to the end of the word
    const minX = x,
      minY = y
    let word = "",
      letter = this.tileAt(x, y)
    while (letter) {
      word += letter
      x += dx
      y += dy
      letter = this.tileAt(x, y)
    }
    const maxX = x - dx,
      maxY = y - dy
    // make sure the word is at least two letters long
    return minX == maxX && minY == maxY ? null : { word, minX, maxX, minY, maxY }
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

  private onPendingTiles(op: (x: number, y: number, l: string) => void) {
    const { tiles, pending } = this
    for (const key of pending) {
      const coord = toCoord(key),
        tile = tiles.get(key)!
      op(coord[0], coord[1], tile)
    }
  }
}
