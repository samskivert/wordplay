import java.nio.file.{Files, Paths}
import collection.JavaConverters._

object EncDict {

  def main (args :Array[String]) :Unit = {
    if (args.length < 2) {
      println("Usage: EncDict input.txt output.ts")
      return
    }

    val out = new java.lang.StringBuilder()
    var last = ""
    var count = 0
    for (word <- Files.lines(Paths.get(args(0))).iterator.asScala) {
      if (word.length < 10) {
        val same = preflen(last, word)
        last = word
        out.append(s"${same}${word.substring(same)}")
        count += 1
      }
    }
    val code = s"export const encodedWords = \"${out.toString}\"\n"
    Files.writeString(Paths.get(args(1)), code)
    println(s"Encoded $count words into ${args(1)}")
  }

  def preflen (a :String, b :String) = {
    var ii = 0
    while (a.length > ii && b.length > ii && a(ii) == b(ii)) ii += 1
    ii
  }
}
