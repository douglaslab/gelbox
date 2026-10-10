import Foundation
import CoreText
for size in [12.0,24.0] {
 let font = CTFontCreateWithName("Avenir-Medium" as CFString, size, nil)
 for text in [" Open… "," Save Gel… "," Save Selected Sample… ","Render","Loupe on hover"] {
  let attributed=NSAttributedString(string:text,attributes:[NSAttributedString.Key(kCTFontAttributeName as String):font])
  let line=CTLineCreateWithAttributedString(attributed)
  var ascent:CGFloat=0,descent:CGFloat=0,leading:CGFloat=0
  let width=CTLineGetTypographicBounds(line,&ascent,&descent,&leading)
  print("\(size) |\(text)| \(ceil(width))x\(ceil(ascent+descent+leading)) raw=\(width),\(ascent),\(descent),\(leading)")
 }
}
