// Minimal storage adapter. Reference operations below come from pinned native
// source; named observations do not store additional owning references.
#include <cassert>
#include <iostream>
#include <memory>
#include <vector>
class Sample;
using SampleRef = std::shared_ptr<Sample>;
#include "identity-declaration.inc"
class Sample {
public:
    struct Fragment {
        int mBases = 0;
        SampleRef mOriginSample;
        int mOriginSampleFrag = -1;
    };
    std::vector<Fragment> mFragments;
    int mID = -1;
    bool isValidFragment(int f) const { return f >= 0 && f < mFragments.size(); }
    int cloneFragment(int f);
    void removeFragment(int f);
};
#include "identity-methods.inc"

bool first = true;
void emit(const char* name, int value) {
    std::cout << (first ? "" : ",\n") << '"' << name << "\":" << value;
    first = false;
}
void emit(const char* name, bool value) {
    std::cout << (first ? "" : ",\n") << '"' << name << "\":" << (value ? "true" : "false");
    first = false;
}
SampleRef sample(std::initializer_list<int> bases) {
    auto s = std::make_shared<Sample>();
    for (int b : bases) s->mFragments.push_back({b, {}, -1});
    return s;
}
int main() {
    std::cout << "{\n";
    auto a = sample({100, 200, 300}), b = sample({100, 200, 300});
    a->mID = b->mID = 7;
    SampleFragRef r(a, 0), last(a, 2);
    emit("distinct_equal_ids", !(r == SampleFragRef(b, 0)));
    emit("same_pointer_equal", r == SampleFragRef(a, 0));
    emit("wrong_sample_invalid", !r.isValidIn(b));
    SampleFragRef whole(a, -1), invalid(a, 99);
    emit("sample_only_invalid_but_retained", !whole.isValid() && whole.getSample() == a);
    emit("invalid_same_ref_equal", invalid == SampleFragRef(a, 99));
    std::vector<SampleRef> lanes{a, {}};
    lanes[1] = lanes[0]; lanes[0].reset();
    emit("move_preserves_reference", r.isValidIn(lanes[1]));
    lanes[1].reset();
    emit("off_document_reference_valid", r.isValid());
    a->removeFragment(0);
    emit("removed_slot_now_last_bases", r.getSample()->mFragments[r.getFrag()].mBases);
    emit("former_last_index_invalid", !last.isValid() && last.getFrag() == 2);
    emit("removed_slot_index_unchanged", r.getFrag());
    a->mFragments.push_back({400, {}, -1});
    emit("append_revalidates_old_index", last.isValid() && a->mFragments[last.getFrag()].mBases == 400);

    auto middle = sample({500}), leaf = sample({600});
    middle->mFragments[0].mOriginSample = a;
    middle->mFragments[0].mOriginSampleFrag = 1;
    leaf->mFragments[0].mOriginSample = middle;
    leaf->mFragments[0].mOriginSampleFrag = 0;
    a->mFragments[2].mOriginSample = b;
    a->mFragments[2].mOriginSampleFrag = 0;
    int clone = a->cloneFragment(2);
    emit("clone_new_index", clone);
    SampleFragRef cloned(a, clone);
    emit("clone_preserves_origin", cloned.setToOrigin() && cloned.is(b, 0));
    SampleFragRef hop(leaf, 0), root(leaf, 0), parent(a, 1);
    emit("one_hop_is_middle", hop.setToOrigin() && hop.is(middle, 0));
    emit("root_changed", root.setToRoot());
    emit("root_is_original", root.is(a, 1));
    emit("root_second_call_unchanged", !root.setToRoot());
    emit("ancestor_matches_descendant", parent.isa(leaf, 0));
    emit("descendant_does_not_match_ancestor", !SampleFragRef(leaf, 0).isa(a, 1));
    leaf->mFragments[0].mOriginSampleFrag = 99;
    SampleFragRef broken(leaf, 0);
    emit("invalid_origin_hop_changes", broken.setToOrigin());
    emit("invalid_origin_keeps_pointer_and_index", !broken.isValid() && broken.is(middle, 99));
    emit("invalid_origin_stops", !broken.setToOrigin());

    auto owned = sample({700});
    std::weak_ptr<Sample> weak = owned;
    SampleFragRef keeper(owned, 0);
    owned.reset();
    emit("reference_keeps_sample_alive", !weak.expired() && keeper.isValid());
    keeper.clear();
    emit("clear_releases_sample", weak.expired() && !keeper.getSample() && keeper.getFrag() == -1);
    auto origin = sample({800}), derived = sample({900});
    weak = origin;
    derived->mFragments[0].mOriginSample = origin;
    derived->mFragments[0].mOriginSampleFrag = 0;
    origin.reset();
    emit("origin_keeps_sample_alive", !weak.expired());
    derived->removeFragment(0);
    emit("remove_origin_releases_sample", weak.expired());
    auto copied = std::make_shared<Sample>(*leaf);
    emit("copy_is_distinct", !(SampleFragRef(copied, 0) == SampleFragRef(leaf, 0)));
    emit("copy_keeps_origin", copied->mFragments[0].mOriginSample == middle && copied->mFragments[0].mOriginSampleFrag == 99);
    std::cout << "\n}\n";
}
