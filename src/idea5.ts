import { Application, Container } from "pixi.js"
import { Idea } from "./idea"
import { Dragger } from "./dragger"
import { mkButton, buttonSize } from "./ui"
import { RackView, tileSize } from "./view"
import { sattoloShuffle } from "./util"

const puzzles = [
  ["SHAPE", "EATEN", "ABORT", "MINCE", "STEER"],
  ["SHAPE", "EATEN", "ABORT", "RINSE", "STEER"],
  ["SHAPE", "MODAL", "INANE", "LOGIC", "ERECT"],
  ["SHAPE", "TAMER", "ALIKE", "MAGIC", "PLANT"],
  ["SHAPE", "TITAN", "OVOID", "TENSE", "TREAD"],
  ["SHAPE", "CABAL", "ALOUD", "LOUSE", "ENTER"],
  ["SHAPE", "CABAL", "ALOUD", "LOUSE", "ESTER"],
  ["SHAPE", "CABAL", "ALOUD", "REUSE", "ESTER"],
  ["SHAPE", "CABAL", "ALOUD", "ROUSE", "ENTER"],
  ["SHAPE", "CABAL", "ALOUD", "ROUSE", "ESTER"],
  ["SHAPE", "CABAL", "ALOUD", "PARSE", "ALTER"],
  ["SHAPE", "HUMID", "AMONG", "ROUTE", "ERROR"],
  ["SHAPE", "WOMAN", "OVINE", "RENEW", "DRESS"],
  ["SHAPE", "WOMAN", "OVINE", "RENEW", "DROSS"],
  ["SHAPE", "TALON", "AVOID", "TENSE", "SNEER"],
  ["SHAPE", "PALER", "EVOKE", "CONIC", "SCENT"],
  ["SHAPE", "COVEN", "AWARD", "PENCE", "ESTER"],
  ["SHAPE", "COVEN", "APART", "PENCE", "ESTER"],
  ["SHAPE", "HOVEL", "AWARD", "DENSE", "ESTER"],
  ["SHAPE", "PARER", "EVOKE", "COMIC", "SCANT"],
  ["SHAPE", "HAVEN", "OVERT", "VERSE", "ESTER"],
  ["SHAPE", "HAVEN", "ALERT", "VERSE", "ESTER"],
  ["SHAPE", "LIVID", "APING", "SPOKE", "HONOR"],
  ["SHAPE", "CAMEL", "ALIKE", "MAGIC", "PLANT"],
  ["SHAPE", "CAMEL", "ALIKE", "MAGIC", "SLANT"],
  ["SHAPE", "PAGAN", "AVERT", "DENSE", "ESTER"],
  ["SHAPE", "PAGAN", "AVERT", "TENSE", "ESTER"],
  ["SHAPE", "PAGAN", "OVERT", "DENSE", "ESTER"],
  ["SHAPE", "PAGAN", "ALERT", "DENSE", "ESTER"],
  ["SHAPE", "PAGAN", "ALERT", "TENSE", "ESTER"],
  ["TACIT", "ATONE", "NOMAD", "GLAND", "ALLEY"],
  ["TACIT", "AWARE", "PARKA", "ESTER", "SHADY"],
  ["TACIT", "ERODE", "ROVER", "SMEAR", "EARLY"],
  ["DRAFT", "RATIO", "IRONY", "FENCE", "TREAD"],
  ["DRAFT", "RODEO", "IVORY", "EERIE", "DREAD"],
  ["SHALE", "COLON", "AGORA", "PANIC", "ANGST"],
  ["SHALE", "TAMER", "ALIVE", "MAGIC", "PLANT"],
  ["SHALE", "TAMER", "OLIVE", "MAGIC", "PLANT"],
  ["SHALE", "HUMID", "AMONG", "ROUGE", "ERROR"],
  ["SHALE", "WOMAN", "OVINE", "RENEW", "DRESS"],
  ["SHALE", "WOMAN", "OVINE", "RENEW", "DROSS"],
  ["SHALE", "TALON", "ABOUT", "RINSE", "STEER"],
  ["SHALE", "HOVEL", "AMEND", "VERSE", "ESTER"],
  ["SHALE", "HAVEN", "AMEND", "VERSE", "ESTER"],
  ["SHALE", "CAMEL", "ALIVE", "MAGIC", "PLANT"],
  ["SHALE", "CAMEL", "ALIVE", "MAGIC", "SLANT"],
  ["SHALE", "PAGAN", "ADEPT", "DENSE", "ESTER"],
  ["SHALE", "PAGAN", "ADEPT", "TENSE", "ESTER"],
  ["SHALE", "PERIL", "ALGAE", "CLUNG", "ESSAY"],
  ["SHALE", "NYLON", "EDICT", "ARBOR", "DAISY"],
  ["SHELL", "PUREE", "OMEGA", "RACER", "ENTRY"],
  ["SHELL", "COCOA", "ALLOY", "LEASE", "ESTER"],
  ["SHELL", "COCOA", "ALLOT", "LEASE", "ESTER"],
  ["SHELL", "COCOA", "ALLAY", "BLAME", "SATYR"],
  ["SURGE", "PSALM", "AUDIO", "TAINT", "ELITE"],
  ["RISER", "INANE", "BEVEL", "AROMA", "STRAY"],
  ["RISER", "ELITE", "NIGHT", "TAMER", "SCARY"],
  ["RISER", "ELITE", "SIGHT", "TAMER", "SCARY"],
  ["AFIRE", "RISEN", "INLET", "SIEVE", "ESTER"],
  ["GLOSS", "HAUTE", "OTTER", "SHEER", "TERRA"],
  ["GLOSS", "RIVAL", "ALIBI", "MANIC", "SCENE"],
  ["GLOSS", "RERUN", "AMBLE", "SMILE", "SATYR"],
  ["GLOSS", "RERUN", "OMBRE", "SMILE", "SATYR"],
  ["GLOSS", "RAMEN", "AMBLE", "NERVE", "DREAD"],
  ["GLOSS", "RAMEN", "AMBLE", "NERVE", "TREAD"],
  ["GLOSS", "ROUTE", "INTER", "CEDAR", "ERODE"],
  ["GLOSS", "NOBLE", "AHEAD", "TASTE", "SNEER"],
  ["GLOSS", "HIPPO", "OTTER", "SHEER", "TODDY"],
  ["GLOSS", "HIPPO", "OTTER", "SHEER", "TEDDY"],
  ["GLOSS", "REVUE", "AGAIN", "DITTO", "STEER"],
  ["PRISM", "RODEO", "INERT", "DINGO", "ENTER"],
  ["PRISM", "RODEO", "AMEND", "TENSE", "TOTEM"],
  ["PRISM", "LANCE", "AVERT", "TEPEE", "ENTER"],
  ["PRISM", "LANCE", "AVERT", "TEPEE", "ESTER"],
  ["PRISM", "LANCE", "ALTAR", "SPELL", "THREE"],
  ["RIGOR", "ADORE", "SINCE", "TONAL", "AMASS"],
  ["VISOR", "ELITE", "NIGHT", "TAMER", "SCARY"],
  ["VISOR", "ELITE", "SIGHT", "TAMER", "SCARY"],
  ["SWAMI", "TIMID", "ASIDE", "MEDIA", "PRESS"],
  ["SWAMI", "TIMID", "OPINE", "MEDIA", "PRESS"],
  ["SWAMI", "TALON", "AVERT", "TERSE", "ESTER"],
  ["SWAMI", "TALON", "AVERT", "VERSE", "ESTER"],
  ["SWAMI", "TALON", "OVERT", "VERSE", "ESTER"],
  ["SWAMI", "WAGON", "EXERT", "DENSE", "ESTER"],
  ["SWAMI", "HAVEN", "OVERT", "VERGE", "ESTER"],
  ["SWAMI", "HAVEN", "AGENT", "VERGE", "ESTER"],
  ["SWAMI", "HAVEN", "AGENT", "MERGE", "ESTER"],
  ["SWAMI", "HAVEN", "ALERT", "VERGE", "ESTER"],
  ["COACH", "APPLE", "SEPIA", "TREND", "SALTY"],
  ["COACH", "ALPHA", "MINUS", "EVENT", "LEAKY"],
  ["COACH", "HOLLY", "EMBED", "SPEAR", "THETA"],
  ["EAGLE", "RERUN", "AGENT", "SIEGE", "ESTER"],
  ["TERRA", "IDEAL", "DEBIT", "AMUSE", "LATER"],
  ["BETEL", "OXIDE", "MANGA", "BLEEP", "START"],
  ["BETEL", "AROMA", "SERUM", "SCALE", "OTHER"],
  ["BETEL", "AROMA", "SERUM", "SCALE", "ETHER"],
  ["WRIST", "HENCE", "ACTOR", "TORUS", "SNARE"],
  ["WRIST", "HENCE", "ACTOR", "TORUS", "SNORE"],
  ["WRIST", "HONOR", "ENNUI", "ADEPT", "TERSE"],
  ["WRIST", "HELLO", "AVIAN", "LEAVE", "ELDER"],
  ["TRAWL", "EERIE", "SLOPE", "TIMER", "SCARY"],
  ["SWISH", "PINTO", "ALLOT", "SCENE", "MOTEL"],
  ["AMASS", "HAUTE", "ENDOW", "AGILE", "DETER"],
  ["AMASS", "DISCO", "OCCUR", "PROBE", "TOTAL"],
  ["AMASS", "BISON", "UNCLE", "STOVE", "ESTER"],
  ["AMASS", "BEGIN", "LARGE", "ENEMA", "STEAK"],
  ["AMASS", "BEGIN", "LARGE", "ENEMA", "STEAD"],
  ["AMASS", "MATCH", "INLAY", "SNARL", "SASSY"],
  ["AMASS", "VITAL", "ALONE", "SENSE", "TREAT"],
  ["AMASS", "GAMMA", "AFOOT", "PINKY", "EAGER"],
  ["AMASS", "CARAT", "TITLE", "ELITE", "DECOR"],
  ["AMASS", "SEDAN", "STOVE", "EERIE", "TREND"],
  ["AMASS", "SEDAN", "STORE", "EERIE", "TREND"],
  ["AMASS", "MANIA", "ICILY", "SHOVE", "SONAR"],
  ["AMASS", "MODEL", "IRATE", "SEGUE", "SLEPT"],
  ["AMASS", "ROGUE", "GRAND", "URINE", "SONAR"],
  ["AMASS", "SOUTH", "SUGAR", "ETUDE", "THREW"],
  ["AMASS", "REGAL", "STOVE", "EERIE", "DRANK"],
  ["AMASS", "REGAL", "STORE", "EERIE", "DRANK"],
  ["AMASS", "CAROL", "TITLE", "OLIVE", "RESET"],
  ["AMASS", "MASON", "UNCLE", "STOVE", "EATER"],
  ["AMASS", "LEGAL", "GROVE", "AGREE", "LEAST"],
  ["AMASS", "DEBUT", "ATONE", "PRUNE", "TOTAL"],
  ["AMASS", "DELTA", "ALIEN", "GONAD", "ENEMY"],
  ["AMASS", "ROUTE", "LINER", "ESTER", "STYLE"],
  ["AMASS", "WOMAN", "ATONE", "ROUGE", "ERROR"],
  ["AMASS", "WOMAN", "ATONE", "ROUTE", "ERROR"],
  ["AMASS", "WOMAN", "AMBLE", "SMILE", "HATER"],
  ["AMASS", "WOMEN", "AMBLE", "SMILE", "HATER"],
  ["AMASS", "VIRAL", "EXTRA", "RESIN", "TRYST"],
  ["AMASS", "BENCH", "BRIAR", "AISLE", "STEED"],
  ["AMASS", "BENCH", "BRIAR", "AISLE", "STEAD"],
  ["AMASS", "NOBLE", "OVOID", "DEUCE", "ESTER"],
  ["AMASS", "VALET", "ERODE", "RANGE", "SHEEP"],
  ["AMASS", "VALET", "ERODE", "RANGE", "SHEER"],
  ["AMASS", "VALET", "ERODE", "RANGE", "SHEEN"],
  ["AMASS", "SAUCY", "SUGAR", "ARENA", "MIRTH"],
  ["AMASS", "BERTH", "BRIAR", "AISLE", "STEED"],
  ["AMASS", "BYLAW", "BRAVO", "ARMOR", "SHORN"],
  ["AMASS", "BYLAW", "BRAVO", "ARMOR", "SHORE"],
  ["AMASS", "DONUT", "ELITE", "PASTE", "TREAD"],
  ["AMASS", "DONUT", "ELITE", "PASTA", "TREAD"],
  ["AMASS", "SIREN", "CREDO", "OTTER", "THERE"],
  ["AMASS", "SIREN", "SCENE", "ERASE", "SOLID"],
  ["AMASS", "BEGAT", "BRAVO", "ALIEN", "SENSE"],
  ["AMASS", "BEGAT", "BRAVO", "ALTER", "SEEDY"],
  ["AMASS", "LATCH", "INLAY", "SNARL", "TASTY"],
  ["AMASS", "PERKY", "ALIEN", "RESET", "TEETH"],
  ["SHORT", "CAPER", "ARENA", "PARTY", "AMASS"],
  ["WORSE", "OPIUM", "RETRO", "TREAT", "HASTE"],
  ["BUSED", "ELATE", "STRUT", "TRADE", "SANER"],
  ["ABATE", "RURAL", "TREND", "IRATE", "COLOR"],
  ["ABATE", "MEDIA", "ALONG", "SCREE", "SHEAR"],
  ["ABATE", "NAVEL", "TRIAD", "ERASE", "SANER"],
  ["ABATE", "BAGEL", "BRAND", "ARISE", "SANER"],
  ["ABATE", "LEMUR", "UTILE", "MEDIC", "SLEPT"],
  ["ABATE", "MOURN", "UNDID", "SUITE", "ESTER"],
  ["ABATE", "ROBIN", "GUILT", "OLDER", "NEEDY"],
  ["ABATE", "ROBIN", "BUILT", "OLDER", "REEDY"],
  ["ABATE", "WOMAN", "ANIME", "RENEW", "DRESS"],
  ["ABATE", "WOMAN", "ANIME", "RENEW", "DROSS"],
  ["ABATE", "WOMEN", "ANIME", "RENEW", "DRESS"],
  ["ABATE", "WOMEN", "ANIME", "RENEW", "DROSS"],
  ["ABATE", "NOVEL", "GLAND", "LUNGE", "ESTER"],
  ["ABATE", "RAVEN", "GLINT", "USAGE", "SANER"],
  ["ABATE", "LADEN", "GRIND", "AROSE", "LOSER"],
  ["ABATE", "WOVEN", "AWARD", "RINSE", "DETER"],
  ["ABATE", "LEMON", "TAINT", "ORDER", "SEEDY"],
  ["CREST", "LUNAR", "OMEGA", "NOMAD", "ERASE"],
  ["CREST", "EERIE", "ADULT", "SUPER", "EXTRA"],
  ["CREST", "RIVER", "OVATE", "SEDAN", "STEED"],
  ["CREST", "AORTA", "SWEAT", "TACIT", "ENTRY"],
  ["CREST", "LANCE", "IDEAL", "MAMBO", "BRASS"],
  ["CREST", "LADLE", "IDEAL", "MAMBO", "BRASS"],
  ["BLAST", "RAZOR", "OVINE", "MEDIA", "ERECT"],
  ["BLAST", "RAZOR", "OPINE", "MEDIA", "ELECT"],
  ["BLAST", "RENEW", "AFIRE", "STOVE", "SYNOD"],
  ["BLAST", "RALLY", "IDEAL", "NERVE", "ENTER"],
  ["BLAST", "EARTH", "ANGER", "SCOPE", "TENSE"],
  ["BLAST", "ROGUE", "AGAIN", "DITTO", "SNEER"],
  ["BLAST", "ROGUE", "ORGAN", "WAIVE", "SLEET"],
  ["BLAST", "LOWER", "USAGE", "RERUN", "BREED"],
  ["BLAST", "ROGER", "AGILE", "VIOLA", "ONSET"],
  ["BLAST", "RADII", "ATOLL", "NERVE", "DREAD"],
  ["BLAST", "RADII", "ATOLL", "NERVE", "TREAD"],
  ["BLAST", "LAGER", "UTILE", "FELLA", "FREED"],
  ["BLAST", "LITHE", "AGORA", "INNER", "NEEDY"],
  ["BLAST", "RODEO", "IVORY", "NERVE", "GREED"],
  ["BLAST", "LANCE", "ORGAN", "OVERT", "MARSH"],
  ["BLAST", "AIDER", "RAINY", "CROSS", "ASSET"],
  ["BLAST", "LABOR", "ATONE", "MEDIA", "ERECT"],
  ["BLAST", "LATCH", "ADORE", "DENIM", "ENEMA"],
  ["LIPID", "ANODE", "MELEE", "BRIAR", "STOLE"],
  ["LIPID", "INANE", "VERGE", "ERROR", "STATE"],
  ["LIPID", "INANE", "MERGE", "ERROR", "STATE"],
  ["RAZOR", "OLIVE", "MANIA", "AMEND", "NOSEY"],
]

export class RowView extends RackView {
  onShuffled :(correct: boolean) => void = () => {}
  dragger :Dragger
  word = ""

  constructor (stage :Container) {
    super(stage, 5)
    this.dragger = new Dragger(stage)
    this.dragger.addDropTarget(this)
  }

  setWord(word :string) {
    this.onRearranged = (rackLetters :string) => this.onShuffled(word == rackLetters)
    this.word = word

    const letters = word.split("")
    sattoloShuffle(letters)
    letters.forEach(letter => {
      const tile = this.addTile(letter)
      this.dragger.addDraggable(tile)
    })
  }

  doHint(hint :number) {
    let col = hint == 0 ? this.word.length-1 : 0
    let letter = this.word.charAt(col)
    const tile = this.tileAt(col, 0)!
    if (tile.letter === letter) {
      tile.makeCommitted()
    } else {
      for (var xx = 0; xx < 5; xx += 1) {
        const xtile = this.tileAt(xx, 0)!
        if (xtile.letter == letter) {
          xtile.makeCommitted()
          xtile.dropOn(col, 0, this, true)
          tile.dropOn(xx, 0, this, true)
          break
        }
      }
    }
  }

  markCorrect() {
    for (let ii = 0; ii < 5; ii += 1) {
      const tile = this.tileAt(ii, 0)
      tile?.makeCommitted()
    }
  }
}

export class Idea5 extends Idea {
  get info() { return [
    "Rearrange the letters in each row to spell a common five letter word.",
    "When all of the words are correct, each column will also spell a " +
      "(possibly less common) five letter word."
  ]}

  constructor(app :Application) {
    super(app)

    this.hitArea = app.screen
    this.sortableChildren = true

    const screenWidth = app.view.width / 2
    const screenHeight = app.view.height / 2
    let racky = (screenHeight - 5*tileSize) / 2
    const addRow = (word :string, onDrop :(correct: boolean) => void) => {
      const row = new RowView(this)
      row.onShuffled = onDrop
      row.x = (screenWidth - row.width) / 2
      row.y = racky
      racky += tileSize
      this.addChild(row)
      row.setWord(word)
      return row
    }

    let correctRows = new Set<string>()
    let rowViews :Array<RowView> = []
    const rows = puzzles[Math.floor(Math.random() * puzzles.length)]
    for (const row of rows) {
      rowViews.push(addRow(row, correct => {
        if (correct) correctRows.add(row)
        else correctRows.delete(row)
        // console.log(`${row} correct: ${correct} (total: ${correctRows.size})`)
        if (correctRows.size == 5) {
          rowViews.forEach(rv => rv.markCorrect())
        }
      }))
    }

    let usedHints = 0
    const hintButton = mkButton("Hint", 2.5*buttonSize)
    hintButton.onPress.connect(() => {
      for (const row of rowViews) row.doHint(usedHints)
      usedHints += 1
      if (usedHints == 2) {
        hintButton.enabled = false
      }
    })
    hintButton.x = screenWidth/2
    hintButton.y = racky + hintButton.height + hintButton.height / 2 + tileSize
    this.addChild(hintButton)
  }
}
