# Panorama cloud upload — link publish bisa dibuka di perangkat lain

## Masalah

Contoh kasus: `https://virtour360real.vercel.app/#/p/salimbangunproperty-my-id`
dibuat oleh akun yang baru coba upload. Link-nya ada di feed/publish, tetapi panorama
tidak pernah tampil di browser pengunjung.

Penyebabnya terlihat pada payload `GET /api/public?id=salimbangunproperty-my-id`:

```json
"panorama": "blob:https://virtour360real.vercel.app/a857b3ea-..."
```

`blob:` adalah URL object yang hanya hidup di tab/browser yang membuatnya. Begitu
tab ditutup atau link dibuka di perangkat lain, URL itu basi. Payload publish
memang menyimpan thumbnail sebagai data URL (base64), tetapi file panorama aslinya
tidak pernah berpindah ke penyimpanan permanen.

Akar teknisnya:

- `isRemote` aktif di produksi, jadi `addPanorama()` memanggil
  `uploadPanoramaFile()` (`src/lib/remoteStore.ts`).
- Fungsi itu meng-upload memakai **anon/public key** ke bucket `panoramas`.
- Bucket `panoramas` belum ada (publishable key tidak boleh membuat bucket), jadi
  upload gagal dan aplikasi fallback ke `blob:` dengan notifikasi “Upload cloud gagal”.
- Saat publish, `PublishModal` mengirim scene dengan `panorama: blob:...` apa adanya.

## Perbaikan

1. `api/storage.js` (Vercel Function, service key hanya di server):
   - memverifikasi token sesi (`verifySession`),
   - membuat bucket publik `panoramas` otomatis bila belum ada (dan memperbarui
     bucket lama menjadi publik),
   - mengembalikan **signed upload URL** + `publicUrl` untuk path
     `<email>/<id>.<ext>`.
2. `src/lib/remoteStore.ts`:
   - mode server meminta signed URL ke `/api/storage`, lalu browser meng-upload
     langsung ke Supabase Storage dengan `uploadToSignedUrl()`.
   - Ini menghindari batas body 4,5 MB Vercel Function sekaligus tidak
     memerlukan kebijakan RLS anon untuk insert.
3. `src/context/AppContext.tsx` → `ensurePublicScenes()`:
   - dicatat saat publish, mencari Blob asli di IndexedDB untuk scene yang masih
     ber-`blob:`,
   - meng-uploadnya, menyimpan `url` publik ke IndexedDB/state remote, lalu
     mengganti `scene.panorama` sebelum payload dikirim.
   - Jika masih gagal, publish **ditolak** dengan pesan jelas agar tidak
     menghasilkan link rusak baru.
4. `src/components/auth/PublishModal.tsx` memakai `ensurePublicScenes()` sebelum
   `publishPublicPayload()`. Publish ulang dengan UID yang sama sekarang menyembuhkan
   tour lama: panorama di-upload ulang lalu link yang sama menjadi valid.
5. `api/public.js` (GET): payload lama yang masih berisi `blob:` langsung dinormalisasi
   memakai `thumbnail` base64 yang sudah tersimpan. Jadi tour yang sudah terlanjur
   dipublish **langsung bisa dilihat** (resolusi rendah) tanpa menunggu pemilik
   meng-upload ulang. `PublicTourView` hanya menampilkan banner bila thumbnail pun tidak ada.

## Pemulihan tour yang sudah terlanjur dipublish

Untuk `salimbangunproperty-my-id`, `GET /api/public?id=...` sekarang mengembalikan
`panorama` berupa `data:image/jpeg;base64,...` (dari thumbnail) sehingga link lama
langsung menampilkan gambar. Kualitasnya masih 320 px; setelah pemilik publish ulang,
payload akan otomatis berisi URL Storage beresolusi penuh.

## Yang perlu dilakukan pemilik tour lama

Buka `#/studio` dengan akun pemilik → **Publish & bagikan** → **Publish ulang**
(nama/slug tetap `salimbangunproperty-my-id`). Panorama sebagai blob di browser pemilik
akan otomatis di-upload ke cloud, lalu link yang sama langsung bisa dibuka siapa pun.

## Verifikasi

```text
npm run typecheck   ✅
npm test            ✅ 46/46
npm run build       ✅
```

Hasil verifikasi produksi setelah deploy (`338c064`, bundle `index-B2PKjRMC.js`):

1. `GET /api/public?id=salimbangunproperty-my-id` → kedua scene sekarang memakai
   `panorama: data:image/jpeg;base64,...` (fallback thumbnail), bukan `blob:`.
2. `POST /api/storage` tanpa token → `401 {"error":"Masuk dulu untuk mengunggah panorama."}`
   (endpoint aktif dan menolak pengunggah anonim).
3. Browser bersih tanpa login membuka `#/p/salimbangunproperty-my-id`: canvas viewer
   tampil, judul `layout 2`, counter `1 / 2 scene`, 3 marker hotspot, 0 error konsol.
4. Klik scene berikutnya → judul `kos`, counter `2 / 2 scene`, masih 0 error konsol.
5. Screenshot QA ulang: 26 screenshot, 0 flag (dark/light, desktop/mobile).

Alur upload untuk akun baru perlu diuji dengan login di Studio: `POST /api/storage`
harus mengembalikan `path`, `token`, `publicUrl`, lalu `uploadToSignedUrl()` menghasilkan
`panorama: https://.../storage/v1/object/public/panoramas/...`.
