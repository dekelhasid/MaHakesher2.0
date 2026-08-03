# מה הקשר?

אתר משחק חיבורים בעברית, מוכן ל־GitHub Pages ול־Firebase Realtime Database.

## העלאה ל־GitHub Pages

1. צרו repository ריק ב־GitHub, למשל `mahakesher`.
2. העלו אליו את **כל תוכן התיקייה הזו** (לא את התיקייה ההורה).
3. ב־GitHub: `Settings` → `Pages` → בחרו `Deploy from a branch`, ענף `main` ותיקיית `/ (root)`.
4. בתוך דקות האתר יופיע בכתובת שמוצגת שם.

## חיבור ל־Firebase

1. צרו פרויקט ב־[Firebase Console](https://console.firebase.google.com/).
2. הוסיפו **Web app** והעתיקו את אובייקט ההגדרות שלו אל `js/firebase-config.js` במקום `null`:

   ```js
   window.MAHAKESHER_FIREBASE_CONFIG = {
     apiKey: "…",
     authDomain: "…",
     databaseURL: "…",
     projectId: "…",
     appId: "…"
   };
   ```

3. צרו **Realtime Database**. בלשונית Rules הדביקו את התוכן של `firebase-rules.json` ולחצו Publish.
4. ב־Authentication → Sign-in method הפעילו את **Google** ואת **Anonymous**.
5. ב־Authentication → Settings → Authorized domains הוסיפו את דומיין GitHub Pages שלכם, למשל `dekelhasid.github.io`.
6. העלו שוב ל־GitHub את `js/firebase-config.js` המעודכן.

חשוב: אין צורך ואסור לשלוח Service Account key או קובץ JSON פרטי. ה־Web config אינו סוד; ההגנה נעשית באמצעות Firebase Rules.

## ניהול

פתחו `admin.html` והתחברו עם `dekelhasid@gmail.com`. שם אפשר לשמור טיוטה, לפרסם, לארכב, לשכפל ולמחוק חידות, ולראות סטטיסטיקה ושחקנים.

## פריסת Firebase CLI (אופציונלי)

אם משתמשים ב־Firebase Hosting במקום GitHub Pages, התקינו את Firebase CLI, התחברו, בחרו את הפרויקט, ואז הריצו:

```sh
firebase deploy --only database
```

קובצי `firebase.json` ו־`firebase-rules.json` כלולים עבור פעולה זו.
