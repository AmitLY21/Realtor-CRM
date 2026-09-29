# Realtor CRM — WhatsApp Web Companion (Chrome Extension)

תוסף דפדפן (Chrome / Edge Manifest V3) לניטור והעברת הודעות נדל״ן מקבוצות וואטסאפ ייעודיות ישירות אל מערכת **Realtor CRM**.

---

## 🌟 תכונות עיקריות

- **כפתור סנכרון מוטמע ב-WhatsApp Web**: כפתור חכם ומהיר ("סנכרן ל-CRM") המוטמע בסרגל השיחה הפעילה בוואטסאפ ווב, המאפשר הפעלה וכיבוי של ניטור הקבוצה בלחיצה אחת.
- **זיהוי פסיבי ואוטומטי**: האזנה בזמן-אמת (באמצעות `MutationObserver`) להודעות נכנסות בקבוצות מנוטרות בלבד.
- **סינון מבוסס מילות מפתח נדל״ניות**: סינון חכם של הודעות ספאם וצ'אט כללי באמצעות מילון מונחי נדל״ן ישראליים (`למכירה`, `להשכרה`, `חדרים`, `שיווק`, `מבוקש`, `קומה`, `מ"ר`, `דירה`, `פנטהאוז`, `דופלקס`, `גג`, `גן`, `טאבו`, `בלעדיות` ועוד).
- **תור אופליין (Buffer)**: אגירת הודעות ב-`chrome.storage.local` (FIFO עד 200 פריטים) גם כאשר הלשונית של ה-CRM סגורה, וסנכרון אוטומטי בעת פתיחת המערכת.
- **גשר תקשורת (CRM Bridge)**: הזרקת אירועי `window.CustomEvent` ישירות לדפדפן של ה-CRM לקליטה חלקה בממשק המשתמש (`REALTOR_CRM_WHATSAPP_LISTINGS`).
- **פאנל ניהול נוח (Popup)**: ממשק עברי מלא (RTL) להצגת סטטוס חיבור, ניהול רשימת קבוצות מנוטרות, וריקון תור ההודעות.
- **אבטחה ואפס סיכון לחסימה**: התוסף פועל בצד הלקוח (Client-Side) ברמת ה-DOM בלבד ללא שימוש ב-API לא רשמי, ללא שליחת הודעות וללא סריקת חשבון.

---

## 🚀 הוראות התקנה (Developer Mode)

התוסף כבר מקומפל ומוכן לשימוש ישיר מתוך תיקיית `extension/`!

### שלבי התקנה ב-Google Chrome או Microsoft Edge:

1. פתח את הדפדפן וגש לכתובת:
   - ב-Chrome: `chrome://extensions`
   - ב-Edge: `edge://extensions`
2. הפעל את **מצב מפתח (Developer mode)** באמצעות המתג בפינה העליונה (בימין או בשמאל, תלוי בשפת הדפדפן).
3. לחץ על הכפתור **טען תוסף לא ארוז (Load unpacked)**.
4. בחר את התיקייה `extension` מתוך פרויקט `Realtor-CRM`:
   ```
   /Users/Amit.Levy/VibeCodingProjects/Realtor-CRM/extension
   ```
5. התוסף **"Realtor CRM - WhatsApp Web Companion"** יופיע כעת ברשימת התוספים הפעילים ויוצג בסרגל הכלים של הדפדפן.

---

## 🛠️ פקודות פיתוח ובנייה

אם תרצה לערוך את קבצי ה-TypeScript ב-`src/` ולקמפל מחדש:

```bash
# היכנס לתיקיית התוסף
cd extension

# התקנת תלויות (אם נדרש)
npm install

# בדיקת טיפוסי TypeScript
npm run typecheck

# קימפול לקבצי dist/
npm run build
```

---

## 📐 ארכיטקטורה ורכיבים

```
extension/
├── manifest.json            # Manifest V3 configuration
├── package.json             # Build scripts & devDependencies
├── tsconfig.json            # Strict TypeScript configuration
├── vite.config.ts           # Vite bundler configuration
├── build.ts                 # Multi-target standalone IIFE bundler
├── icons/                   # Extension icons (16px, 48px, 128px)
├── src/
│   ├── types.ts             # Shared data contracts
│   ├── whatsapp-observer.ts # Injected into https://web.whatsapp.com/*
│   ├── crm-bridge.ts        # Injected into http://localhost:* and 127.0.0.1:*
│   ├── background.ts        # Service worker (FIFO queue, badge, tabs)
│   ├── popup.html           # Hebrew RTL UI control panel
│   └── popup.ts             # Popup view-controller & storage synchronization
└── dist/                    # Ready-to-load unpacked bundle
    ├── manifest.json (root)
    ├── background.js
    ├── crm-bridge.js
    ├── whatsapp-observer.js
    ├── popup.html
    └── popup.js
```

### 1. `whatsapp-observer.ts` (WhatsApp Web)
- רץ בעמוד `https://web.whatsapp.com/*`.
- מאתר את כותרת השיחה הפעילה ומזריק כפתור "סנכרן ל-CRM".
- מצב פעיל (ירוק אמרלד עם סימון `✓`) מציין שהקבוצה מנוטרת.
- מאזין להודעות נכנסות חדשות דרך `MutationObserver`.
- מסנן הודעות יוצאות של המשתמש (`.message-out`, `data-id="true_..."`).
- מבצע חילוץ פרטים: גוף ההודעה, שם השולח, מספר טלפון (מתוך `data-pre-plain-text`), חותמת זמן ושם הקבוצה.
- בודק מילות מפתח נדל״ניות ומעביר ל-Background Service Worker.

### 2. `background.ts` (Service Worker)
- מנהל את ה-Storage המקומי:
  - `monitored_groups`: רשימת הקבוצות המאושרות לניטור.
  - `pending_listings`: תור FIFO (עד 200 פריטים) של מודעות שהוקלטו.
- מציג באייקון התוסף מספר עם כמות המודעות הממתינות.
- בודק אם לשונית ה-CRM (`http://localhost:*`) פתוחה ומעביר אליה מיידית את המודעות.

### 3. `crm-bridge.ts` (Realtor CRM Bridge)
- רץ על הלוקלהוסט של מערכת ה-CRM.
- מקשיב להודעות `FLUSH_LISTINGS` מה-Service Worker ומשדר אירוע `CustomEvent`:
  ```javascript
  window.dispatchEvent(new CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS', {
    detail: listings // מערך של WhatsAppMessagePayload
  }));
  ```
- מאזין לאישור קליטה מה-CRM:
  ```javascript
  window.dispatchEvent(new CustomEvent('REALTOR_CRM_ACK_LISTING', {
    detail: { ids: ['msg_id_1', 'msg_id_2'] }
  }));
  ```
- תומך בבקשת סנכרון יזומה מה-CRM:
  ```javascript
  window.dispatchEvent(new CustomEvent('REALTOR_CRM_REQUEST_FLUSH'));
  ```

### 4. `popup.html` & `popup.ts` (לוח בקרה)
- עיצוב עברי אלגנטי ונקי.
- אינדיקטורים צבעוניים: האם וואטסאפ ווב פתוח? האם ה-CRM פתוח?
- מונה מודעות ממתינות + כפתור "רוקן תור".
- רשימת קבוצות מנוטרות עם כפתור מחיקה מהיר והוספה ידנית לפי שם.
- כפתורי קיצור דרך לפתיחה ומיקוד של הלשוניות.

---

## 🔍 בדיקת תקינות מקומית (Verification)

1. **אימות קימפול**:
   ```bash
   cd extension && npm run build
   ```
2. **אימות טיפוסים**:
   ```bash
   cd extension && npm run typecheck
   ```
3. **בדיקת קבצי הפלט**:
   כל הקבצים ב-`dist/` נבנים כ-IIFE עצמאיים ללא `import` או תלויות הדדיות, ומבטיחים אפס שגיאות הרצה ב-Chrome Extension Engine.
