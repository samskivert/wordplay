function shuffle<T> (array :T[]) {
  for (let ii = array.length-1; ii > 0; ii--) {
    const jj = Math.floor(Math.random() * (ii + 1));
    [array[ii], array[jj]] = [array[jj], array[ii]]
  }
}

const tileDist = new Map([
  ["A", 9], ["B", 2], ["C", 2], ["D", 5], ["E", 12], ["F", 2], ["G", 3], ["H", 2], ["I", 9],
  ["J", 1], ["K", 1], ["L", 4], ["M", 2], ["N", 6], ["O", 8], ["P", 2], ["Q", 1], ["R", 6],
  ["S", 4], ["T", 6], ["U", 4], ["V", 2], ["W", 2], ["X", 1], ["Y", 2], ["Z", 1]
])

export class Bag {
  private tiles :string[]

  constructor () {
    let tiles :string[] = []
    tileDist.forEach((count, tile) => tiles.push(...Array(count).fill(tile)))
    shuffle(tiles)
    this.tiles = tiles
  }

  get remain () :number { return this.tiles.length }

  draw () :string { return this.tiles.pop() ?? "?" }
}
