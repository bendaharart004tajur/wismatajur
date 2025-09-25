
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Scopes required for Google Sheets API
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Function to get authenticated Google Sheets client
export async function getGoogleSheetsClient() {
  // HARDCODED FOR TESTING - REMOVE LATER
  const serviceAccountEmail = 'wismatajur@custom-sun-472617-u0.iam.gserviceaccount.com';
  // HARDCODED FOR TESTING - REMOVE LATER
  const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2cpHfmkBJ5mPO
WdjVcmyGw/qtb6Igxpi1281+ImCzERx0orF6Y3d/fPT31qsCYJs/ENYnsHlniIJ2
YWMJnLvErwX/HRF5c1L1dtuo34Ffr4uYFsnEWh2yZ3KiXfeLOXbOl9o8fpSi0jya
Ig5ALuMDGfApSTIEuliwjXHV0X30cKhu5mFo3vpS61q/fpmCmIVsQuIj3Cbz6Nl+
sWqAUJ1uh2dxAvJSrEtfU8OfG/naPu/g6niqlxd7yO/ysLLqM7aeDRLGk6L81oUk
g2QbSDvTNBmEnQ36ilvEx+VkKuBK4shlPSPCdKQ5n4/e8SSQJgVnqQHoQ/wK3uBS
Xd5jgfKfAgMBAAECggEAJpIcEriKhNUHHpXSCHXzSZ5e/ZGPJfy2RiQc0mC0Lscc
S/AlMymaFsK1Czw/1PXVfESz8ZoWYHP0mNBH3r1a2N7jlqZvjkx6KlihYZc2w6La
ESIoL7GZe6DxFDBnZ/CTFGP4CDf+dlmZ5D/04U7IQVyXcDMANw2qOFD+0uRCC431
EIbW79LM03mXGXC1ZTpYkP+Y/pMok3irr1hYry6YiZc1oyvIBf/3dBEmIdnBcgVz
4/aogw8vzOVKlWLOweU6mH8qn0EAC8nTafIhOZ4C9lu5W7Ntp44HUM1wiud5OByu
0x98GPbRlwrRodsZrPA5l6ZmjhAD+LG/gXbc5GcsWQKBgQD9oghIZu/7VrQYIY1Y
Xbguy2eIvFmR/NK53gztstnekVD8fdhRXbycM2+difWlDGsdRQQuz0aFr6VbEc3u
RP8KZw9G8Qao9jLCyLQ//P8EhIrQyXLZp40jCQR2s1+XXDkbUDlXlqZsH1GOmEQM
uODDTNC8Wc8sPScXKBlxLPy6lQKBgQC4Jnb38JalJQFtBXRe8uHSAw87py3mDKnA
p66FIEEmEtsxM7MBJwvaeypNdRD8GYLugG626eYR+K9/6bXr7t/HqImXdl0dj6/D
/SQYdsS0xz+ecD6FyjpFtR2983DM4oG2Gjz2KUaWTS7bz4D/Ooy8exxM8FGhd+pf
Uw7RaMbfYwKBgQCKYdadEjTLcCHwrJW+6dttBKOnkgRYx5V9va5WHmgKrESAjnTw
5/DZVKMIVFZHSABFRvuiQosas5vHlW5DGzf/x/0o2qaklzdY2UKnSvUk1OAcTF0y
bd1uiSP7U6DLJ5Es2td+d36zrV7FK0StoE1ZoVad/W4wl+j1FHbVLhNyBQKBgEIS
8x71gWgSBhfzHBUxetta461Yx/xCUOpigBkeQKIDpAhcb38bXoJvLPeL6KM8GCGx
jYguFrIeFAKGfhMAq+S80Vm6S6DevIdLHhd1DhF7aJVV2ukwbYYzfU95uOCa6UXI
1lTQ7JXjbcvLAZMSlArQ9Y+ZrwCLwVmguLFkse7XAoGAD25+8cpMUL0H+fmItq0K
kKh8Oe+Qt9w/nV6zTkgpJxNa0yEaiIOM0epDPnsQN5GGVQ9kJAl/cnv9gW8+K2+P
vve7f3ighjsqOJrLI8TlubHTyNlaxV/vtEWY5Uvx16PQwtqdSkbKV5WhOW21qFa0
ne92VFG34x1IM0zO6KuxNqo=
-----END PRIVATE KEY-----`;

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Missing Google service account credentials.');
  }

  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// HARDCODED FOR TESTING - REMOVE LATER
export const SPREADSHEET_ID = '1gX_TZmLKB9tu8qXlQ3qr6Q9RzRcrCg07uKKZRohRhUY';
if (!SPREADSHEET_ID) {
  throw new Error('Missing GOOGLE_SHEET_ID.');
}

// Helper to convert sheet data to JSON
// Assumes the first row is the header
export function sheetDataToJson<T>(values: any[][]): T[] {
    if (!values || values.length < 2) {
        return [];
    }
    const header = values[0];
    const dataRows = values.slice(1);

    return dataRows.map(row => {
        const rowData: any = {};
        header.forEach((key, index) => {
            rowData[key] = row[index];
        });
        return rowData as T;
    });
}
