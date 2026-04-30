import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { gelReducer, initialGelState, type GelState, type Action } from '../../lib/gel/gelState';

const StateCtx    = createContext<GelState | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function GelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gelReducer, undefined, initialGelState);
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
