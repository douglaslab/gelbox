import Foundation
import CoreText
import CoreGraphics
import ImageIO
let output=CommandLine.arguments.count>1 ? CommandLine.arguments[1] : "/tmp"
let fontName="Avenir-Medium"
let cgfont=CGFont(fontName as CFString)!
let font=CTFontCreateWithGraphicsFont(cgfont,24,nil,nil)
print("CG face:",cgfont.postScriptName!,"CT face:",CTFontCopyPostScriptName(font))
let string="44.5 mM"
for legacy in [false,true] { for smooth in [false,true] { for white in [false,true] {
 let context=CGContext(data:nil,width:140,height:48,bitsPerComponent:8,bytesPerRow:560,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 context.setShouldSmoothFonts(smooth)
 let color=white ? CGColor(gray:1,alpha:1) : CGColor(gray:0,alpha:1)
 context.setFillColor(color)
 context.textPosition=CGPoint(x:10,y:12)
 let line=CTLineCreateWithAttributedString(NSAttributedString(string:string,attributes:[NSAttributedString.Key(kCTFontAttributeName as String):font,NSAttributedString.Key(kCTForegroundColorAttributeName as String):color]))
 if legacy {
  context.setFont(cgfont);context.setFontSize(24)
  for run in CTLineGetGlyphRuns(line) as! [CTRun] {
   let count=CTRunGetGlyphCount(run)
   var glyphs=[CGGlyph](repeating:0,count:count),positions=[CGPoint](repeating:.zero,count:count)
   CTRunGetGlyphs(run,CFRange(location:0,length:0),&glyphs);CTRunGetPositions(run,CFRange(location:0,length:0),&positions)
   context.showGlyphs(glyphs,at:positions)
  }
 } else { CTLineDraw(line,context) }
 let image=context.makeImage()!
 let name="\(output)/gel-text-\(legacy ? "legacy" : "ctline")-smooth\(smooth)-white\(white).png"
 let dest=CGImageDestinationCreateWithURL(URL(fileURLWithPath:name) as CFURL,"public.png" as CFString,1,nil)!
 CGImageDestinationAddImage(dest,image,nil);CGImageDestinationFinalize(dest)
 print(name)
}}}
