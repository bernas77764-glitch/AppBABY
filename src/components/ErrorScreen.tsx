import { Component, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from './ui';

/** Mostra o erro em vez de fechar a app, para ser possível perceber o que falhou. */
export function ErrorScreen({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Algo correu mal</Text>
      <Text style={styles.body}>Copia esta mensagem e envia-a para podermos corrigir:</Text>
      <Text selectable style={styles.code}>
        {message}
      </Text>
      {onRetry ? <Button label="Tentar novamente" icon="refresh" onPress={onRetry} /> : null}
    </ScrollView>
  );
}

type State = { error: unknown | null };

export class RootErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  render() {
    if (this.state.error != null) {
      return <ErrorScreen error={this.state.error} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#F6F8F7' },
  title: { fontSize: 22, fontWeight: '700', color: '#16231F' },
  body: { fontSize: 15, color: '#5E6B67' },
  code: { fontFamily: 'monospace', fontSize: 13, color: '#B3261E', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8 },
});
