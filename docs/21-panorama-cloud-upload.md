# Semua aset ke Supabase Storage — link publish bisa dibuka di perangkat lain

## Masalah

Contoh kasus: `https://virtour360real.vercel.app/#/p/salimbangunproperty-my-id`
dibuat oleh akun yang baru coba upload. Link-nya ada di feed/publish, tetapi panorama
tidak pernah tampil di browser pengunjung.

Penyebabnya terlihat pada payload `GET /api/public?id=salimbangunproperty-my-id`:

```json
"panorama": "blob:https://virtour360real.vercel.app/a857b3ea-..."
```

`blob:` adalah URL object yang hanya hidup di tab/browser yang membuatnya. Begitu
tab ditutup atau link dibuka di perangkat lain, URL itu basi. Hal yang sama juga
berlaku untuk **audio scene** dan **gambar pengganti** yang diunggah lewat panel
Studio: keduanya dulu disimpan sebagai Blob + object URL di IndexedDB.

Akar teknisnya:

- `isRemote` aktif di produksi, jadi `addPanorama()` memanggil
  `uploadPanoramaFile()` (`src/lib/remoteStore.ts`).
- Fungsi itu meng-upload memakai **anon/public key** ke bucket `panoramas`.
- Bucket `panoramas` belum ada (publishable key tidak boleh membuat bucket), jadi
  upload gagal dan aplikasi fallback ke `blob:` dengan notifikasi “Upload cloud gagal”.
- Aset audio/gambar tidak punya jalur upload sama sekali — selalu object URL lokal.
- Saat publish, `PublishModal` mengirim scene dengan `panorama: blob:...` apa adanya.

## Perbaikan

1. `api/storage.js` (Vercel Function, service key hanya di server):
   - memverifikasi token sesi (`verifySession`),
   - membuat bucket publik `panoramas` otomatis bila belum ada (dan memperbarui
     bucket lama menjadi publik),
   - menerima `kind: "panorama" | "audio" | "image"`,
   - mengembalikan **signed upload URL** + `publicUrl`,
   - `DELETE { url }` menghapus object milik sesi yang sedang login.
   - Path panorama lama tetap `<owner>/<id>.<ext>` agar URL lama tidak rusak;
     audio/gambar memakai `<owner>/<kind>/<id>.<ext>`.
2. `src/lib/remoteStore.ts`:
   - `uploadAssetFile(id, file, kind)` dipakai untuk ketiga jenis aset.
   - Mode server meminta signed URL ke `/api/storage`, lalu browser meng-upload
     langsung ke Supabase Storage dengan `uploadToSignedUrl()`.
   - Ini menghindari batas body 4,5 MB Vercel Function sekaligus tidak
     memerlukan kebijakan RLS anon untuk insert.
   - `removeStorageFile(url)` dipakai saat aset dihapus/diganti.
3. `src/lib/db.ts` → `StoredAsset.url` menyimpan URL Storage permanen. Saat state
   dimuat, URL itu dipakai langsung; object URL hanya dibuat untuk aset lokal lama.
4. `src/context/AppContext.tsx` → `ensurePublicScenes()`:
   - saat publish, semua `blob:` pada `panorama`, `thumbnail`, dan `audio` di-upload
     ke Storage memakai `kind` yang tepat,
   - URL publik disimpan ke IndexedDB/state remote, lalu dipakai di payload,
   - jika masih gagal, publish **ditolak** dengan pesan jelas agar tidak
     menghasilkan link rusak baru.
   - `replaceSceneImage()` dan `setSceneAudio()` juga meng-upload langsung saat
     file dipilih; hapus/ganti aset ikut menghapus object Storage.
5. `src/components/auth/PublishModal.tsx` memakai `ensurePublicScenes()` sebelum
   `publishPublicPayload()`. Publish ulang dengan UID yang sama menyembuhkan tour lama.
6. `api/public.js` (GET): payload lama yang masih berisi `blob:` langsung dinormalisasi
   memakai `thumbnail` base64. Audio `blob:` dibuang daripada dikirim ke pengunjung.
   Jadi tour lama **langsung bisa dilihat** (resolusi rendah) tanpa menunggu publish ulang.
7. `src/components/viewer/PublicViewerModal.tsx`: pengunjung sekarang mendapat tombol
   play/pause audio scene bila scene yang aktif punya audio dari Storage.

## Pemulihan tour yang sudah terlanjur dipublish

Untuk `salimbangunproperty-my-id`, `GET /api/public?id=...` sekarang mengembalikan
`panorama` berupa `data:image/jpeg;base64,...` (dari thumbnail) sehingga link lama
langsung menampilkan gambar. Kualitasnya masih 320 px; setelah pemilik publish ulang,
payload akan otomatis berisi URL Storage beresolusi penuh.

## Yang perlu dilakukan pemilik tour lama

Buka `#/studio` dengan akun pemilik → **Publish & bagikan** → **Publish ulang**
(nama/slug tetap `salimbangunproperty-my-id`). Semua aset yang masih ber-`blob:`
di browser pemilik akan otomatis di-upload ke cloud, lalu link yang sama langsung
bisa dibuka siapa pun dengan panorama penuh dan audio.

## Verifikasi

```text
npm run typecheck   ✅
npm test            ✅ 46/46
npm run build       ✅
```

Hasil verifikasi produksi setelah deploy (`75c905c`, bundle `index-BmO99spc.js`):

1. `GET /api/public?id=salimbangunproperty-my-id` → kedua scene memakai
   `panorama: data:image/jpeg;base64,...` (fallback thumbnail), bukan `blob:`.
2. `POST /api/storage` tanpa token → `401 {"error":"Masuk dulu untuk mengunggah aset."}`.
3. Browser bersih tanpa login membuka `#/p/salimbangunproperty-my-id`: canvas viewer
   tampil, judul `layout 2`, counter `1 / 2 scene`, 3 marker hotspot, 0 error konsol.
4. Klik scene berikutnya → judul `kos`, counter `2 / 2 scene`, masih 0 error konsol.
5. Login produksi → `POST /api/storage` untuk `kind: audio` dan `kind: image`:
   path `awe_gmail_com/audio/<id>.wav` dan `awe_gmail_com/image/<id>.png`,
   upload signed → `200`, URL publik → `200`.
6. `DELETE /api/storage` dengan token yang sama → `200`; object uji langsung dihapus,
   sehingga tidak menyisakan sampah di bucket.
7. Screenshot QA ulang: 26 screenshot, 0 flag (dark/light, desktop/mobile).

Dengan demikian semua aset yang diunggah — panorama 360°, audio scene, dan gambar
pengganti — berada di satu bucket `panoramas` dan bisa dipakai dari perangkat mana pun.
