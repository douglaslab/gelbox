// Event/view adapters only. All gesture decisions come from extracted native
// methods; Rectf and vector operations are the pinned real Cinder library.
#include "cinder/Rect.h"
#include "cinder/Json.h"
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
using namespace ci;
using namespace std;
using J = nlohmann::json;
namespace cinder::app {
struct MouseEvent {
    ivec2 pos;
    ivec2 getPos() const { return pos; }
};
struct KeyEvent {
    enum { KEY_BACKSPACE=8, KEY_DELETE=127, KEY_ESCAPE=27 };
    int code;
    int getCode() const { return code; }
};
Rectf windowBounds;
Rectf getWindowBounds() { return windowBounds; }
}
using namespace ci::app;
struct TextureSize {
    ivec2 size;
    ivec2 getSize() const { return size; }
};
class ImageView;
struct Collection {
    vec2 moved{0};
    int focusCalls=0;
    bool removed=false;
    vec2 getMouseMoved() const { return moved; }
    void setKeyboardFocusView(shared_ptr<ImageView>) { ++focusCalls; }
    void removeView(shared_ptr<ImageView>) { removed=true; }
};
class ImageView : public enable_shared_from_this<ImageView> {
public:
    Rectf frame, mMouseDownFrame;
    vec2 down;
    shared_ptr<TextureSize> mImage;
    Collection collection;
    enum Action { Drag, Resize } mAction;
    Rectf getFrame() const { return frame; }
    void setFrame(Rectf value) { frame=value; }
    vec2 rootToParent(vec2 p) const { return p; } // native image is a root view
    vec2 getMouseDownLoc() const { return down; }
    Collection* getCollection() { return &collection; }
    void mouseDown(MouseEvent);
    void mouseDrag(MouseEvent);
    void mouseUp(MouseEvent);
    void keyDown(KeyEvent);
    Rectf calcResizeBox() const;
};
#include "image-methods.inc"
J rect(Rectf r) { return {r.x1,r.y1,r.x2,r.y2}; }
Rectf readRect(const J& r) { return Rectf(r[0],r[1],r[2],r[3]); }
ivec2 point(const J& p) { return ivec2(p[0],p[1]); }
int main(int argc, char** argv) {
    if(argc!=2) return 2;
    ifstream input(argv[1]); J cases; input>>cases;
    J output=J::array();
    // Native mouseUp logs removal. Capture it separately from the JSON stream.
    ostringstream nativeLog; auto stream=cout.rdbuf(nativeLog.rdbuf());
    for(const auto& c:cases) {
        auto view=make_shared<ImageView>();
        view->frame=readRect(c["frame"]);
        view->mImage=make_shared<TextureSize>(TextureSize{point(c["natural"])});
        windowBounds=readRect(c["window"]);
        ivec2 previous=point(c["down"]);
        view->down=vec2(previous);
        view->mouseDown({previous});
        for(const auto& value:c["moves"]) {
            ivec2 position=point(value);
            view->collection.moved=vec2(position-previous);
            view->mouseDrag({position});
            previous=position;
        }
        view->mouseUp({previous});
        if(c.contains("key")) {
            const string key=c["key"];
            view->keyDown({key=="delete"?KeyEvent::KEY_DELETE:key=="backspace"?KeyEvent::KEY_BACKSPACE:KeyEvent::KEY_ESCAPE});
        }
        output.push_back({{"id",c["id"]},{"frame",rect(view->frame)},
            {"handle",rect(view->calcResizeBox())},{"focusCalls",view->collection.focusCalls},
            {"removed",view->collection.removed}});
    }
    cout.rdbuf(stream);
    cout<<output.dump(2)<<endl;
}
