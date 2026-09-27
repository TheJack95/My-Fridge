# My Fridge

App mobile (Expo / React Native / TypeScript) per tenere traccia degli
alimenti nel frigo: CRUD completo, foto, scadenze, scansione barcode con
lookup su database prodotti pubblico, e notifiche configurabili per i
prodotti in scadenza.

Il backend arriverà in un secondo momento: questa repo contiene solo l'app
mobile più i **contratti API** per il futuro BE (vedi `docs/`).

## Funzionalità

- CRUD alimenti: nome, quantità/unità, data di scadenza, foto.
- Scansione barcode con fotocamera (`expo-camera`) e lookup automatico del
  nome prodotto su [Open Food Facts](https://world.openfoodfacts.org).
- Notifiche locali di scadenza, con **due promemoria configurabili**
  (giorni prima della scadenza, default 3 e 1 giorno).
- Persistenza locale (`AsyncStorage`) dietro un'interfaccia (`IFoodApi`)
  pronta per essere sostituita da un client HTTP quando il backend esiste.

## Stack

- Expo (React Native) + TypeScript
- `@react-navigation` per la navigazione
- `expo-camera` per la fotocamera e la scansione barcode
- `expo-image-picker` per scattare/scegliere foto
- `expo-notifications` per i promemoria di scadenza
- `@react-native-async-storage/async-storage` per la persistenza locale

## Avvio

```bash
npm install
npm start
```

Poi apri l'app con Expo Go (scansiona il QR code) oppure:

```bash
npm run android
npm run ios
```

## Build (EAS Build)

Il progetto è configurato per [EAS Build](https://docs.expo.dev/build/introduction/)
(vedi `eas.json`). Per creare una build installabile (APK/IPA) serve un
account Expo:

```bash
npm install -g eas-cli
eas login
eas init          # collega il progetto a un account/progetto EAS (una tantum)
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

Profili disponibili in `eas.json`:

- `development`: build con `expo-dev-client` per lo sviluppo con moduli nativi
- `preview`: APK Android/build interna installabile per il test
- `production`: build per lo store (con `autoIncrement` del build number)

Per lo sviluppo quotidiano basta Expo Go; la build `development` serve se
vuoi testare l'app come binario nativo con `expo-dev-client`.

## Struttura del progetto

```
src/
  types/            Tipi condivisi (FoodItem, NotificationSettings, ...)
  api/
    IFoodApi.ts       Contratto usato dalle screen (indipendente dall'impl.)
    LocalFoodApi.ts   Implementazione attuale, su AsyncStorage
    RemoteFoodApi.ts  Scheletro del client HTTP per il futuro backend
  services/
    barcodeLookupService.ts  Lookup su Open Food Facts
    notificationService.ts   Pianificazione/cancellazione notifiche locali
    settingsRepository.ts    Persistenza preferenze notifiche
  context/          Stato globale (FoodContext) via React Context
  navigation/       Stack di navigazione
  screens/          FridgeList, ItemForm, Scanner, Settings
  components/       FoodListItem, ExpiryBadge
docs/
  openapi.yaml          Specifica OpenAPI 3 del futuro backend
  API_CONTRACTS.md      Riepilogo leggibile del contratto
```

## Backend futuro

L'app non chiama alcun backend proprio: usa `LocalFoodApi` per il CRUD e
chiama Open Food Facts direttamente per il barcode. Il contratto in
`docs/openapi.yaml` descrive come sarà l'API quando verrà implementata
(CRUD alimenti, upload foto, proxy barcode, sync preferenze notifiche).
Quando sarà pronta, basterà completare `src/api/RemoteFoodApi.ts` e
sostituirne l'uso al posto di `LocalFoodApi` in `src/context/FoodContext.tsx`.
