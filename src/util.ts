
// shuffle elements but disallow element to remain in same place
export function sattoloShuffle<N>(array: Array<N>): Array<N> {
  for (let ii = array.length - 1; ii > 0; ii--) {
    const j = Math.floor(Math.random() * ii)
    ;[array[ii], array[j]] = [array[j], array[ii]]
  }
  return array
}
