import { Game } from "./game"
import { Word } from "./board"

export class WordWalk extends Game {

  gameWillStart () :void {
    this.board.addStartWord("START", 1, this.board.tileHeight-1)
  }

  playDidCommit (_ :Word[]) {
    const board = this.board
    // if we got to the top, slide down half the board, destroying any tiles in the way
    if (board.board.haveTileIn(board.topRow)) {
      board.slide(0, Math.floor(board.tileHeight/2), true)
    }
  }
}
