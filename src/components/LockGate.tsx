import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { unlock } from '@/lib/security';
import { useColors } from '@/lib/theme';
import { Button } from './ui';

// Ao voltar à app depois deste tempo em segundo plano, volta a pedir desbloqueio.
const RELOCK_AFTER_MS = 60_000;

/**
 * Pede Face ID / impressão digital / código do dispositivo antes de mostrar a app,
 * e esconde o conteúdo quando a app vai para segundo plano (ecrã de apps recentes).
 */
export function LockGate({ children }: { children: ReactNode }) {
  const c = useColors();
  const [unlocked, setUnlocked] = useState(false);
  const [everUnlocked, setEverUnlocked] = useState(false);
  const [hidden, setHidden] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const prompting = useRef(false);

  const tryUnlock = async () => {
    if (prompting.current) return;
    prompting.current = true;
    try {
      const ok = await unlock();
      setUnlocked(ok);
      if (ok) setEverUnlocked(true);
    } finally {
      prompting.current = false;
    }
  };

  useEffect(() => {
    tryUnlock();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setHidden(false);
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        if (since != null && Date.now() - since > RELOCK_AFTER_MS) {
          setUnlocked(false);
          tryUnlock();
        }
      } else if (!prompting.current) {
        // Durante o pedido biométrico a app fica "inactive"; isso não conta como sair.
        setHidden(true);
        if (state === 'background') backgroundedAt.current ??= Date.now();
      }
    });
    return () => sub.remove();
  }, []);

  const covered = !unlocked || hidden;

  // Depois do primeiro desbloqueio a app continua montada por baixo da cortina,
  // para não perder a navegação nem a ligação à base de dados.
  return (
    <View style={{ flex: 1 }}>
      {everUnlocked ? children : null}
      {covered ? (
        <View style={[StyleSheet.absoluteFill, styles.lock, { backgroundColor: c.background }]}>
          <Text style={[styles.brand, { color: c.primary }]}>AppBABY</Text>
          {unlocked ? null : (
            <>
              <Text style={{ color: c.muted, textAlign: 'center' }}>Os dados de saúde da família estão protegidos.</Text>
              <Button label="Desbloquear" icon="lock-open-outline" onPress={tryUnlock} />
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  brand: { fontSize: 32, fontWeight: '800' },
});
