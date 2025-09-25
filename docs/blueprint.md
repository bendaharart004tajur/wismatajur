# **App Name**: RT 004 Wisma Tajur App

## Core Features:

- Login Authentication: Secure login system using email credentials pulled from the Pengurus RT Google Sheet.  This will simulate the roles of Admin, Koordinator and User based on credentials.
- Dashboard Display: Display a dashboard with summaries and quick access to relevant information based on user role.
- Data Visualization: Automatically generate data visualization and key metrics display, such as payment rate chart.
- CRUD Operations: Enable Create, Read, Update, and Delete (CRUD) operations for Warga, Anggota Keluarga, Iuran, Pengeluaran, Inventaris, Pengumuman, UMKM, Arisan and Pengurus RT, based on user roles (Admin, Koordinator, User) that reflect permissions. Google Sheets will function as the 'database'.
- Image Handling: Allow uploading and display of images (fotoProfil, uploadKTP, UploadKK, UploadPembayaran, buktiPembayaran) stored in Google Drive, linked to the respective data entries, role based for editing and adding feature, read all roles. Display image when available
- Data Filtering: Implement filtering capabilities based on role and categories like blok (for Koordinator), user id(user), or date range.
- Role-Based Access Control: Control access to features and data based on predefined roles (Admin, Koordinator, User). Koordinator can only access their blok and cannot add, edit or delete data. User can only see their own profile

## Style Guidelines:

- Primary color: Green (#3CB371), drawing inspiration from the natural imagery of Wisma Tajur and creating a sense of community.
- Background color: Light Green (#E5F8ED), a desaturated version of the primary green, offering a soft, neutral backdrop.
- Accent color: Yellow-Gold (#FFD700), analogous to green, brings in feelings of warmth and trust
- Body and headline font: 'PT Sans' (sans-serif) offers a blend of modernity and approachability, suiting both headings and body text. Note: currently only Google Fonts are supported.
- Use flat, modern icons, styled in the primary and accent colors, to represent each menu item and data category.
- Clean, card-based layout for displaying data, ensuring readability and ease of navigation.  Each card representing individual records like warga details, iuran payments, etc
- Subtle transitions and animations when loading data or navigating between sections, to enhance user experience.