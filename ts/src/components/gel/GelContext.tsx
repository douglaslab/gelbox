import {FileLoadProvider} from './FileLoadProvider';
import {ViewOrderProvider} from './useViewLayer';
import {ReferenceImageProvider} from './ReferenceImageLayer';
import { flushSync } from 'react-dom';
import {GelStore} from '../../lib/gel/gelStore';
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode, type Dispatch } from 'react';
import { type GelState, type Action } from '../../lib/gel/gelState';

const StoreCtx = createContext<GelStore | null>(null);
const StateCtx    = createContext<GelState | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function GelProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new GelStore());
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const state = snapshot.gel, dispatch = store.dispatch;
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.metaKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        dispatch({type:'TOGGLE_RENDER'});
      }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [dispatch]);
  useEffect(() => {
    let frame: number;
    const tick = () => {
      const freeze = (window as unknown as {__molsimFreezeAfterTicks?:number}).__molsimFreezeAfterTicks;
      flushSync(() => store.tick(freeze));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [store]);
  return (
    <StoreCtx.Provider value={store}><StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        <ViewOrderProvider value={{order:snapshot.order,add:store.registerLayer,remove:store.unregisterLayer,raise:store.raiseLayer}}><ReferenceImageProvider><FileLoadProvider>{children}</FileLoadProvider></ReferenceImageProvider></ViewOrderProvider>
      </DispatchCtx.Provider>
    </StateCtx.Provider></StoreCtx.Provider>
  );
}

export function useGelState(): GelState {
  const s = useContext(StateCtx);
  if (!s) throw new Error('useGelState must be used inside <GelProvider>');
  return s;
}

export function useGelDispatch(): Dispatch<Action> {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error('useGelDispatch must be used inside <GelProvider>');
  return d;
}

export function useGelStore(): GelStore {
  const store=useContext(StoreCtx);
  if(!store)throw new Error("useGelStore must be used inside <GelProvider>");
  return store;
}
export function useGelSnapshot() {
  const store=useGelStore();
  return useSyncExternalStore(store.subscribe,store.getSnapshot);
}
