import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

let cachedDoc: GoogleSpreadsheet | null = null;
let docInitPromise: Promise<GoogleSpreadsheet> | null = null;
let sheetsEnsured = false;

export async function getDoc() {
  if (cachedDoc) return cachedDoc;
  if (docInitPromise) return docInitPromise;

  docInitPromise = (async () => {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!email || !key || !sheetId) {
      throw new Error('Google Sheets credentials are not configured.');
    }

    const serviceAccountAuth = new JWT({
      email,
      key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    cachedDoc = doc;
    return doc;
  })();

  try {
    return await docInitPromise;
  } catch (e) {
    docInitPromise = null;
    throw e;
  }
}

export async function ensureSheets(doc: GoogleSpreadsheet) {
  if (sheetsEnsured) return;

  const requiredSheets = [
    { title: 'user', headers: ['id', 'username'] },
    { title: 'measurements', headers: ['id', 'userId', 'date', 'bodyweight', 'waist', 'arms', 'chest', 'thigh', 'bodyFat', 'bodyMuscle'] },
    { title: 'macro calories', headers: ['id', 'userId', 'date', 'fat', 'carbs', 'protein', 'foodDescription'] },
    { title: 'exercise tracking', headers: ['id', 'userId', 'date', 'exercise', 'sets'] }
  ];
  
  let needsReload = false;
  for (const reqSheet of requiredSheets) {
    // Case-insensitive check
    const existingSheet = Object.values(doc.sheetsById).find(
      s => s.title.toLowerCase() === reqSheet.title.toLowerCase()
    );
    
    if (!existingSheet) {
      console.log(`Sheet "${reqSheet.title}" not found. Attempting to create...`);
      try {
        await doc.addSheet({ title: reqSheet.title, headerValues: reqSheet.headers });
        console.log(`Successfully created sheet "${reqSheet.title}".`);
        needsReload = true;
      } catch (err: any) {
        // Ignore if another request just created it
        if (err.message?.includes('already exists')) {
          console.log(`Sheet "${reqSheet.title}" already exists (caught error).`);
          needsReload = true;
        } else {
          console.error(`Failed to create sheet ${reqSheet.title}:`, err);
        }
      }
    }
  }
  
  if (needsReload) {
    console.log('Reloading doc info...');
    await doc.loadInfo(); // Reload to ensure doc.sheetsByTitle is fully updated
  }

  sheetsEnsured = true;
}

export function getSheetByTitleCaseInsensitive(doc: GoogleSpreadsheet, title: string) {
  return Object.values(doc.sheetsById).find(
    s => s.title.toLowerCase() === title.toLowerCase()
  );
}
