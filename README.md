# AppBABY

App Android e iOS para organizar a saúde da família toda, incluindo os animais de estimação: consultas, lembretes e documentos médicos digitalizados, num só sítio.

## O que já faz (1.º marco)

- **Família**: perfis de pessoas e de animais (espécie, raça, microchip), com data de nascimento, alergias, grupo sanguíneo e notas.
- **Consultas**: marcar, editar e apagar; lembretes (30 min, 2 h, 1 dia, 1 semana antes); estado (marcada, realizada, cancelada); registo do que foi dito; abrir o local no mapa.
- **Documentos**: digitalizar com a câmara (deteção de margens), importar da galeria ou PDF; categorias; ligar a um membro e a uma consulta; pesquisa por título e notas; abrir e partilhar.
- **Privacidade**: tudo fica no telemóvel. A base de dados é cifrada (SQLCipher) com uma chave guardada no Keychain/Keystore, a app pede Face ID / impressão digital / código ao abrir e ao voltar ao fim de 1 minuto, e esconde o conteúdo no ecrã de apps recentes. As notificações não mostram notas clínicas.

## Tecnologia

Expo SDK 57 (React Native) com TypeScript e Expo Router. Ver [`AGENTS.md`](AGENTS.md) para as regras de desenvolvimento.

| Pasta | Conteúdo |
|---|---|
| `src/app` | Ecrãs (cada ficheiro é uma rota) |
| `src/components` | Componentes partilhados |
| `src/db` | Esquema, migrações e acesso à base de dados |
| `src/lib` | Ficheiros, notificações, segurança, formatação |

## Instalar no Android (APK de teste)

Cada alteração na `main` gera um APK automaticamente no GitHub Actions:

1. Abrir o separador **Actions** do repositório e escolher a execução mais recente de **Android APK** com sucesso.
2. Em **Artifacts**, descarregar `appbaby-apk` (um ZIP com o APK) no telemóvel.
3. Abrir o APK e permitir a instalação de apps desta fonte quando o Android pedir.

O APK é assinado com uma chave de teste: serve para experimentar, não para publicar na Google Play.

## Correr no telemóvel (desenvolvimento)

A app usa módulos nativos (digitalização, SQLCipher), por isso não corre na Expo Go: precisa de uma *development build*.

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android   # ou ios
npx expo start --dev-client
```

Para uma versão de teste instalável sem servidor de desenvolvimento: `npx eas-cli@latest build --profile preview --platform android` (gera um APK).

No iOS, instalar no próprio iPhone exige uma conta Apple Developer.

## Verificações

```bash
npx tsc --noEmit
npx expo lint
```

## Próximos marcos

2. Vacinas (PNV para pessoas; vacinas e desparasitações para animais), medicação com lembretes, crescimento/peso, OCR e pesquisa no texto, exportar resumo em PDF.
3. Cópia de segurança cifrada, sincronização (servidores na UE) e partilha familiar.
