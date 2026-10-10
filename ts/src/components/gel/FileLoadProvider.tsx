import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import {FileLoadQueue} from '../../lib/gel/fileLoadQueue';

const Context = createContext<FileLoadQueue | null>(null);
export function FileLoadProvider({children}: {children: ReactNode}) {
  const [queue] = useState(() => new FileLoadQueue());
  useEffect(() => { queue.activate(); return () => queue.dispose(); }, [queue]);
  return <Context.Provider value={queue}>{children}</Context.Provider>;
}
export function useFileLoadQueue() {
  const queue = useContext(Context);
  if (!queue) throw new Error('Missing file load provider');
  return queue;
}
