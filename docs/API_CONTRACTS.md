# Contratti API — My Fridge

Questo documento riassume il contratto tra l'app mobile e il futuro backend.
La specifica completa è in [`openapi.yaml`](./openapi.yaml).

## Perché esiste già ora

Il backend verrà sviluppato in un secondo momento. Per non bloccare lo
sviluppo mobile, l'app è scritta contro l'interfaccia
[`IFoodApi`](../src/api/IFoodApi.ts) e oggi la implementa `LocalFoodApi`
(salvataggio su `AsyncStorage`, sul dispositivo). Quando il backend sarà
pronto basterà implementare `RemoteFoodApi` (già presente come scheletro in
[`src/api/RemoteFoodApi.ts`](../src/api/RemoteFoodApi.ts)) seguendo lo
stesso contratto, senza toccare le schermate.

## Risorse

### FoodItem

| Campo       | Tipo               | Note                                   |
|-------------|--------------------|-----------------------------------------|
| id          | string (uuid)      | generato dal backend                    |
| name        | string             |                                          |
| quantity    | number             | es. `1`, `2.5`                          |
| unit        | string             | es. `pz`, `g`, `l`                      |
| expiryDate  | string (date)      | formato `YYYY-MM-DD`                    |
| photoUrl    | string (uri), opz. | URL pubblico dell'immagine caricata     |
| barcode     | string, opz.       | codice a barre se aggiunto via scanner  |
| createdAt   | string (date-time) |                                          |
| updatedAt   | string (date-time) |                                          |

Nota: sul dispositivo il campo si chiama `photoUri` (path locale); lato
backend diventa `photoUrl` (URL remoto) dopo l'upload tramite
`POST /items/{id}/photo`.

### Endpoint principali

| Metodo | Path                      | Descrizione                                  |
|--------|---------------------------|-----------------------------------------------|
| GET    | `/items`                  | Elenco alimenti dell'utente autenticato      |
| POST   | `/items`                  | Crea un alimento                              |
| GET    | `/items/{id}`             | Dettaglio alimento                            |
| PATCH  | `/items/{id}`             | Aggiornamento parziale                        |
| DELETE | `/items/{id}`             | Elimina alimento                              |
| POST   | `/items/{id}/photo`       | Upload foto (multipart), ritorna `photoUrl`  |
| GET    | `/barcode/{code}`         | Proxy/cache verso il database prodotti esterno|
| GET    | `/notifications/settings` | Preferenze notifiche dell'utente             |
| PUT    | `/notifications/settings` | Aggiorna le preferenze notifiche             |

Tutte le richieste (tranne eventualmente `/barcode`) richiedono
autenticazione `Bearer <JWT>` (schema definito ma da collegare a un sistema
di auth quando verrà introdotto).

### Barcode / database prodotti

Oggi l'app chiama direttamente [Open Food Facts](https://world.openfoodfacts.org)
da `src/services/barcodeLookupService.ts`. Il contratto prevede che in
futuro questa chiamata passi dal backend (`GET /barcode/{code}`), che farà da
proxy/cache verso Open Food Facts o un database equivalente: questo evita
rate-limit lato client, permette di aggiungere una cache e disaccoppia
l'app dal fornitore scelto.

### Notifiche

Le notifiche di scadenza sono programmate **localmente sul device** con
`expo-notifications` (vedi `src/services/notificationService.ts`), in base
a due soglie configurabili dall'utente (`firstReminderDaysBefore`,
`secondReminderDaysBefore`, default 3 e 1 giorno). Il contratto
`/notifications/settings` serve a sincronizzare queste preferenze tra
dispositivi quando ci sarà un account utente; finché non esiste il backend,
sono salvate solo su `AsyncStorage`.
