- when make app in firebase in front part take credential like this

```js
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

- in setting go to cloud messaging and generate key pair ant take it

- go to service account and take code nodejs
- generate new private key generate file json add this in config and ignore in .env

- create notificationService.ts to create class and make configuration like this

```tsx
import admin from 'firebase-admin';

import { readFileSync } from 'fs';
import { resolve } from 'path';

class NotificationService {
  private readonly client: admin.app.App;

  constructor() {
    var serviceAccount = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          '../../config/social-app-4f78c-firebase-adminsdk-fbsvc-c8b694f5e0.json',
        ),
      ) as unknown as string,
    );

    this.client = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

export default new NotificationService();
```
