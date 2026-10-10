import Foundation
import CoreText
for (name,size,words) in [("Avenir-Medium",12.0,["44.5 mM","70 V","3:00",".5x TBE"]),("Avenir-Heavy",24.0,["Gel","Sample","Species"]),("Avenir-Heavy",12.0,["Buffer"])] {
 let font=CTFontCreateWithName(name as CFString,size,nil)
 for word in words {
  let line=CTLineCreateWithAttributedString(NSAttributedString(string:word,attributes:[NSAttributedString.Key(kCTFontAttributeName as String):font]))
  print(name,size,word,CTLineGetTypographicBounds(line,nil,nil,nil))
 }
}
