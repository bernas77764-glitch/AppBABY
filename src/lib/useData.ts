import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState, type DependencyList } from 'react';

/** Carrega dados da base de dados sempre que o ecrã ganha foco (ex.: ao voltar de um formulário). */
export function useData<T>(load: (db: SQLiteDatabase) => Promise<T>, deps: DependencyList): {
  data: T | undefined;
  reload: () => Promise<void>;
} {
  const db = useSQLiteContext();
  const [data, setData] = useState<T>();
  // `deps` faz o papel da lista de dependências de `load`, como num useCallback.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  const reload = useCallback(async () => setData(await load(db)), [db, ...deps]);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  return { data, reload };
}
