import { flushSync } from 'react-dom';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useReducer, type ReactNode, type Dispatch } from 'react';
import { gelReducer, initialGelState, selectionViewTarget, type GelState, type Action } from '../../lib/gel/gelState';

const StateCtx    = createContext<GelState | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function GelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gelReducer, undefined, initialGelState);
  const current = useRef(state);
  useLayoutEffect(() => { current.current = state; }, [state]);
  useEffect(() => {
    let frame: number;
    const tick = () => {
      // Do not enqueue idle reducer updates: concurrent rebasing can replay a
      // mouse-down edit after its native hover-refresh window has ended.
      // An actual native tick view change commits before this frame is painted.
      if (selectionViewTarget(current.current) !== undefined) {
        flushSync(() => dispatch({ type: 'SYNC_SELECTION_VIEW' }));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
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
