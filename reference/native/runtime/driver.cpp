#include "GelSim.h"
#include "Sample.h"
#include "Config.h"
#include "degrade-filter.inc"
#include <fstream>
#include <functional>
#include <iostream>
#include <list>
#include <map>
#include <utility>
using namespace std;
using namespace ci;
using J = nlohmann::json;
#include "molecular-adapter.h"
#include "loupe-seed.inc"

Config gConfig;
const Config& kConfig = gConfig;

class ColorPaletteView {
public:
    class Palette : public vector<Color> {
    public:
        Palette(const vector<Color>& c);
        Color getRandomColor(Rand* r) const;
    };
};
class FragmentView {
public:
    static vector<Color> sColorPalette;
    static const vector<Color>& getColorPalette();
    static Color getRandomColorFromPalette(Rand* r = nullptr);
};
vector<Color> FragmentView::sColorPalette;

struct View {
    virtual ~View() = default;
    virtual void tick(float dt) = 0;
};
class ViewCollection {
public:
    list<shared_ptr<View>> mViews;
    void tick(float dt);
};
#include "view-tick.inc"

class SampleView : public View {
public:
    // Native member order: engine construction precedes the view's local Rand.
    MolecularSim mMolecularSim;
    Rand mRand;
    SampleRef mSample;
    string id;
    int viewSeed = 0;
    bool inspector = false;
    vector<string>* notifications;
    vector<string>* tickTrace;
    function<void()> duringTick;
    void setup() {
        // Observe the return value without adding or removing any RNG draw.
        auto randInt = [this]() { return viewSeed = ci::randInt(); };
#include "view-setup-seed.inc"
    }
#include "sample-set-rand.inc"
    SampleRef getSample() { return mSample; }
    void fragmentDidChange(int i) { notifications->push_back(id+":"+to_string(i)); }
    void newFragment();
    void tick(float) override {
        tickTrace->push_back(id);
        mMolecularSim.tick(false);
        // One-shot scripted collection mutations, not native GUI callbacks.
        if (auto callback = exchange(duringTick, {})) callback();
    }
    void openInspector() {
        if (inspector) return;
        inspector = true;
        struct Graph { vector<float> mGraphValues; } aggregate;
#include "inspector-random.inc"
    }
};
#include "species-methods.inc"

J color(Color c) { return {c.r, c.g, c.b}; }
J vec(vec2 v) { return {v.x, v.y}; }
J fragment(const Sample::Fragment& f) {
    J aggregate=J::array();
    for (float w : f.mAggregate) aggregate.push_back(w);
    return {{"bases", f.mBases}, {"mass", f.mMass}, {"aspectRatio", f.mAspectRatio},
            {"degrade", f.mDegrade}, {"dye", f.mDye}, {"color", color(f.mColor)}, {"aggregate", aggregate}};
}
SampleRef readSample(const J& data) {
    auto s = make_shared<Sample>();
    s->mFragments.clear();
    for (const auto& j : data) {
        Sample::Fragment f;
        f.mBases=j.at("bases"); f.mMass=j.at("mass");
        f.mAspectRatio=j.value("aspectRatio", 1.f); f.mDegrade=j.value("degrade", 0.f);
        f.mDye=j.value("dye", -1);
        auto c=j.value("color", J::array({.2,.4,.6})); f.mColor=Color(c[0],c[1],c[2]);
        f.mAggregate.clear();
        for (float w : j.value("aggregate", J::array({1}))) f.mAggregate.push_back(w);
        s->mFragments.push_back(f);
    }
    return s;
}
J particles(const MolecularSim& sim) {
    J result=J::array();
    for (const auto& p : sim.mParts) {
        J multi=J::array();
        for (const auto& m : p.mMulti) multi.push_back({{"loc",vec(m.mLoc)},{"angle",m.mAngle}});
        result.push_back({{"fragment",p.mFragment},{"loc",vec(p.mLoc)},{"vel",vec(p.mVel)},
            {"radius",vec(p.mRadius)},{"angle",p.mAngle},{"angleVel",p.mAngleVel},{"color",color(p.mColor)},
            {"age",p.mAge},{"fade",p.mFade},{"alive",p.mAlive},{"degradeKey",p.mDegradeKey},
            {"wholeness",p.mWholeness},{"multi",multi}});
    }
    return result;
}

struct Scene {
    ViewCollection collection;
    map<string, weak_ptr<SampleView>> views;
    vector<shared_ptr<SampleView>> retained;
    vector<string> notifications, tickTrace;
    J streams=J::object(), colors=J::array();

    shared_ptr<SampleView> get(const string& id) {
        auto found=views.find(id);
        if (found==views.end()) throw runtime_error("Unknown view: "+id);
        auto v=found->second.lock();
        if (!v) throw runtime_error("Destroyed view: "+id);
        return v;
    }
    void action(const J& step) {
        const string op=step.at("op");
        if (op=="create") {
            const string id=step.at("id");
            if (views.contains(id)) throw runtime_error("Duplicate view id: "+id);
            auto v=make_shared<SampleView>();
            v->id=id; v->notifications=&notifications; v->tickTrace=&tickTrace;
            v->setup();
            v->mMolecularSim.setBounds(Rectf(0,0,400,400));
            v->mSample=readSample(step.value("sample",J::array()));
            v->mMolecularSim.setSample(v->mSample);
            if (step.value("loupe",false)) v->mMolecularSim.mTimeScale=0;
            Rand ints(v->viewSeed), floats(v->viewSeed);
            J integerTrace=J::array(), floatTrace=J::array();
            for (int i=0;i<64;++i) { integerTrace.push_back(ints.nextInt()); floatTrace.push_back(floats.nextFloat()); }
            streams[id]={{"ints",integerTrace},{"floats",floatTrace}};
            views[id]=v; collection.mViews.push_back(v);
        } else if (op=="tick") {
            for (int i=0;i<step.value("count",1);++i) collection.tick(.1f);
        } else if (op=="global-color") {
            colors.push_back(color(FragmentView::getRandomColorFromPalette()));
        } else {
            auto v=get(step.at("id"));
            if (op=="species") v->newFragment();
            else if (op=="inspector") v->openInspector();
            else if (op=="close-inspector") v->inspector=false;
            else if (op=="remove") {
                collection.mViews.remove(v);
                if (step.value("retain",false)) retained.push_back(v);
            } else if (op=="raise") {
                collection.mViews.remove(v); collection.mViews.push_back(v);
            } else if (op=="during-tick") {
                auto action=step.at("action");
                v->duringTick=[this,action]() { this->action(action); };
            } else if (op=="refresh") {
                auto anchor=step.at("anchor");
                auto seed=loupeSeed(vec2(anchor[0],anchor[1]),step.at("time"));
                v->mMolecularSim.mParts.clear();
                v->setRand(Rand(seed));
                v->mSample=step.contains("from") ? make_shared<Sample>(*get(step.at("from"))->mSample) : readSample(step.at("sample"));
                v->mMolecularSim.setSample(v->mSample);
                v->mMolecularSim.preroll();
            } else throw runtime_error("Unknown operation: "+op);
        }
    }
    J snapshot() {
        J order=J::array(), state=J::object();
        for (auto base : collection.mViews) {
            auto v=static_pointer_cast<SampleView>(base);
            order.push_back(v->id);
            J fragments=J::array();
            for (const auto& f : v->mSample->mFragments) fragments.push_back(fragment(f));
            auto local=v->mRand, dynamic=v->mMolecularSim.mRand;
            state[v->id]={{"engineSeed",v->mMolecularSim.mRandSeed},{"viewSeed",v->viewSeed},
                {"nextLocalInt",local.nextInt()},{"nextDynamicInt",dynamic.nextInt()},
                {"inspector",v->inspector},{"fragments",fragments},{"parts",particles(v->mMolecularSim)}};
        }
        return {{"order",order},{"views",state}};
    }
};

int main(int argc, char** argv) {
    if (argc!=4) return 2;
    GelSim::gTuning.load(JsonTree(loadFile(argv[2])));
    MolecularSim::gTuning.load(JsonTree(loadFile(argv[3])));
    if (sizeof(size_t)!=8) throw runtime_error("Reference requires 64-bit size_t");
    if (kConfig.mNewFragChanceNonUniformAspectRatio!=0 || kConfig.mNewFragChanceMultimer!=0) return 3;
    if (GelSim::kTuning.mSliderAggregateMaxMultimer!=7 || GelSim::kTuning.mSampleMassHigh!=175) return 4;
    ifstream file(argv[1]); J cases; file>>cases;
    J output=J::array(), palette=J::array();
    for (auto c : FragmentView::getColorPalette()) palette.push_back(color(c));
    for (const auto& c : cases) {
        Rand::randSeed(c.value("globalSeed",310u));
        Scene scene; J frames=J::array();
        for (const auto& step : c.at("steps")) { scene.action(step); frames.push_back(scene.snapshot()); }
        output.push_back({{"id",c.at("id")},{"frames",frames},{"streams",scene.streams},
            {"notifications",scene.notifications},{"colors",scene.colors},{"palette",palette},
            {"tickTrace",scene.tickTrace},{"nextGlobalInt",randInt()}});
    }
    cout<<output.dump(2)<<endl;
}
