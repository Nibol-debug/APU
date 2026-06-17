# PRD – Sistem Informasi Manajemen Data Pegawai
## LAZWaf Al Azhar (Google Apps Script)

> **Versi:** 1.0.0 · **Tanggal:** 17 Juni 2026 · **Status:** Draft  
> **Platform:** Google Apps Script + Google Sheets  
> **Sumber Data:** [Spreadsheet Pegawai LAZWaf Al Azhar](https://docs.google.com/spreadsheets/d/1tlv5QzBo6L5rHa-tUuykp4ljADSLaSJq8qvukJ4TgYY)

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Konteks Organisasi](#2-konteks-organisasi)
3. [Analisis Data Sumber](#3-analisis-data-sumber)
4. [Arsitektur & Teknologi](#4-arsitektur--teknologi)
5. [Fitur: Tampilan Awal](#5-fitur-tampilan-awal)
6. [Fitur: Login & Autentikasi](#6-fitur-login--autentikasi)
7. [Fitur: Dashboard](#7-fitur-dashboard)
8. [Fitur: Hak Akses](#8-fitur-hak-akses)
9. [Fitur: Data Pegawai](#9-fitur-data-pegawai)
10. [Fitur: Riwayat Karir](#10-fitur-riwayat-karir)
11. [Fitur Tambahan](#11-fitur-tambahan)
12. [Struktur Database (Google Sheets)](#12-struktur-database-google-sheets)
13. [Functional Requirements](#13-functional-requirements)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Milestone Pengembangan](#15-milestone-pengembangan)

---

## 1. Ringkasan Eksekutif

Aplikasi ini menggantikan pengelolaan data karyawan yang saat ini dilakukan secara manual di Google Sheets dengan antarmuka web terstruktur berbasis **Google Apps Script**. Data sumber yang ada mencakup **lebih dari 100 karyawan** yang tersebar di 5+ divisi dengan histori karir yang kompleks (hingga 12 riwayat jabatan per orang).

**Masalah yang diselesaikan:**
- Data tersebar di banyak baris/kolom tanpa UI yang ramah pengguna
- Tidak ada kontrol akses — siapa pun yang punya link bisa melihat semua data sensitif (KTP, no HP, dll.)
- Sulit membuat laporan ringkasan (total per divisi, per status, per gender) tanpa formula manual
- Tidak ada notifikasi otomatis untuk karyawan kontrak yang akan habis masa kerjanya

---

## 2. Konteks Organisasi

### Struktur Divisi (dari data aktual)

| Kode | Nama Divisi | Jumlah Karyawan (saat ini) |
|------|-------------|---------------------------|
| SEK | Sekretariat | ±24 orang |
| KEU | Keuangan | ±9 orang |
| LAZ | LAZ Al Azhar | ±1 orang (Direktur) |
| FUN | Fundraising & Partnership | ±27 orang |
| PRO | Program | ±8+ orang |
| *(lainnya)* | KPW, Wakaf, dll. | TBD |

### Unit dalam Divisi (dari data aktual)

| Divisi | Unit |
|--------|------|
| Sekretariat | Direksi, Kelembagaan, Humas/GA/IT, Diklat & Litbang |
| Keuangan | Direksi, Pengeluaran, Penerimaan, Anggaran & Akuntansi |
| Fundraising | Internal Fundraising, Eksternal Fundraising |
| Program | Program |

### Status Kepegawaian (dari data aktual)

| Status | Gaji/Honorarium | Tunjangan (Kesehatan, Transport, dll.) | Kontrak Tertulis |
|--------|:-:|:-:|:-:|
| **Tetap** | ✅ | ✅ Penuh | ✅ |
| **Kontrak** | ✅ | ✅ Penuh | ✅ (waktu tertentu) |
| **Relawan** | ✅ | ❌ Tidak ada | Opsional |

> **Catatan penting:** Relawan di LAZWaf Al Azhar **bukan sukarelawan tanpa bayaran**. Mereka tetap menerima gaji/honorarium, tetapi **tidak mendapatkan komponen tunjangan** apa pun (kesehatan, transport, makan, BPJS, dll.). Perbedaan dengan Kontrak/Tetap **hanya pada paket tunjangan**, bukan pada status berbayar/tidak berbayar. Ini perlu tercermin di sistem agar laporan payroll dan kepegawaian akurat.

### Sistem Level Jabatan (dari data aktual)

| Grade | Contoh Jabatan |
|-------|---------------|
| 5A, 5C | Kepala Divisi, Direktur |
| 4A, 4B, 4C | Manager Senior |
| 3A, 3B, 3C | Manager, Koordinator Senior |
| 2A, 2B, 2C | Koordinator, Staf Senior |
| 1, 1C | Staf Junior, Non-Staf |

### Hierarki Jabatan (dari data aktual)

```
Kepala Divisi / Direktur  (Level 5)
    └── Manager             (Level 4)
         └── Koordinator    (Level 3)
              └── Staf       (Level 2)
                   └── Non-Staf / Relawan  (Level 1)
```

---

## 3. Analisis Data Sumber

### Kolom-Kolom di Spreadsheet Sumber

Berdasarkan data aktual, spreadsheet memiliki struktur kolom berikut yang akan dimigrasikan ke sistem:

#### Blok A – Identitas & Posisi
| Kolom | Field | Contoh Data |
|-------|-------|-------------|
| A | No. (urut per divisi) | 1, 2, 3… |
| B | Employee ID | `20103008013` |
| C | Full Name | `Rahmatullah Sidik` |
| D | Current Position | `Kepala Divisi Sekretariat LAZWaf…` |
| E | Department | `Sekretariat`, `Keuangan`, `Fundraising`, `Program` |
| F | Unit | `Direksi`, `Kelembagaan`, `Humas, GA, dan IT` |
| G | Employment Status | `Tetap`, `Kontrak`, `Relawan` |
| H | Level | `5A`, `4B`, `3C`, `2A`, `1` |

#### Blok B – Kontak & Kepegawaian
| Kolom | Field | Contoh Data |
|-------|-------|-------------|
| I | Mobile Phone Number | `081280571098` |
| J | Place of Birth | `Bekasi` |
| K | Date of Birth | `8/21/1977` |
| L | Age | `48` (auto-hitung) |
| M | Join Date | `1/1/2010` |
| N | Count Date (Today) | `6/17/2026` (auto) |
| O | Employment Count (Year) | `16` (auto-hitung) |
| P | Employment Count (Month) | `5` (auto-hitung) |
| Q | Employment Count (Day) | `16` (auto-hitung) |
| R | Email | *(kosong di data sumber – perlu diisi)* |

#### Blok C – Data Pribadi
| Kolom | Field | Contoh Data |
|-------|-------|-------------|
| S | Education | *(kosong – perlu diisi)* |
| T | Citizen ID (NIK) | `3674052108770003` |
| U | Citizen ID Address | *(kosong – perlu diisi)* |
| V | Residential Address | *(kosong – perlu diisi)* |
| W | Gender | `L` (Laki-laki), `P` (Perempuan) |
| X | Marital Status | `Menikah`, `Single`, `Janda` |

#### Blok D – Data Keluarga
| Kolom | Field | Contoh Data |
|-------|-------|-------------|
| Y | Spouse Name | `PURWANTI` |
| Z | Spouse Date of Birth | `4 Apr 1980` |
| AA | Child Name 1 | `ALMA HAYYA SHIDDIQY` |
| AB | Child DOB 1 | `3 Jul 2007` |
| AC | Child Name 2 | `SALIMA SHIDDIQY` |
| AD | Child DOB 2 | `25 Mar 2012` |
| AE | Child Name 3 | `ILMAN HANNAN SIDIK` |
| AF | Child DOB 3 | `18 Sep 2015` |
| AG | Child Name 4 | *(opsional)* |
| AH | Child DOB 4 | *(opsional)* |

#### Blok E – Pendidikan
| Kolom | Field | Contoh Data |
|-------|-------|-------------|
| AI | Graduation Date | `9/3/2002` |
| AJ | Educational Institution | `UIN Syarif Hidayatullah` |
| AK | Institution Place | `Jakarta` |

#### Blok F – Jabatan & Riwayat Karir
| Kolom | Field | Contoh Data |
|-------|-------|-------------|
| AL | Job Level | `Kepala Divisi`, `Manager`, `Koordinator`, `Staf` |
| AM | Career Start | `Staf Program Charity` |
| AN | Career Path 1 Date | `1/1/2011` |
| AO | Career Path 1 | `Manager Program` |
| … | (sampai Career Path 12) | |
| BK | Career Path 12 | *(kolom terakhir)* |

> **Catatan:** Setiap karyawan bisa memiliki hingga **12 riwayat jabatan** dengan tanggal mulai masing-masing. Ini adalah fitur penting yang harus ditangani secara terstruktur di database baru.

### Temuan & Isu Data Sumber

| Isu | Dampak | Penanganan di Sistem |
|-----|--------|---------------------|
| Kolom Email (R) sebagian besar kosong | Tidak bisa kirim notifikasi | Form wajib isi email saat edit data |
| Format tanggal tidak konsisten (`8/21/1977`, `3 Jul 2007`, `13/01/1982`) | Error parsing | Sistem normalisasi otomatis saat migrasi |
| Kolom NIK Address & Residential Address kosong | Data tidak lengkap | Tandai sebagai field opsional dengan indikator kelengkapan |
| Kolom Education (S) kosong | Data pendidikan tidak ada | Pakai kolom AJ (Educational Institution) sebagai fallback |
| Career Path tersebar di 26 kolom (AM–BK) | Sulit di-query | Normalisasi ke tabel terpisah `career_history` |
| Row separator divisi (bukan data karyawan) | Perlu di-skip saat import | Filter baris di mana kolom B bukan Employee ID |
| Employee ID format `YYYYMMNNXXX` | Bisa decode join date & urutan | Tampilkan parsing di UI |

---

## 4. Arsitektur & Teknologi

### Stack

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Google Apps Script (GAS) – `doGet`, `doPost`, triggers |
| **Database** | Google Sheets (spreadsheet terpisah dari data sumber, atau sheet tambahan) |
| **Frontend** | HTML Service + Bootstrap 5 + Vanilla JS |
| **Auth** | Google OAuth 2.0 via `Session.getActiveUser()` |
| **Storage Dokumen** | Google Drive (folder per karyawan) |
| **Email** | `GmailApp` / `MailApp` GAS |
| **Scheduler** | Time-based Trigger GAS |

### Alur Data Sumber → Sistem Baru

```
Google Sheets Sumber  ──import──▶  Sheet: pegawai  ──normalisasi──▶  Sheet: career_history
(data mentah saat ini)              (data bersih)                      (riwayat karir)
```

---

## 5. Fitur: Tampilan Awal

Halaman pertama setelah login. Menampilkan **angka saja** (tanpa grafik) dalam bentuk kartu.

### Widget Statistik (Berdasarkan Data Aktual)

Semua widget menampilkan angka dan dapat dikonfigurasi di **Master Akses** oleh Super Admin.

| Kode Widget | Label | Sumber Kalkulasi |
|-------------|-------|-----------------|
| `TOTAL_AKTIF` | Total Karyawan Aktif | COUNT(status = aktif) |
| `TOTAL_TETAP` | Karyawan Tetap | COUNT(employment_status = 'Tetap') |
| `TOTAL_KONTRAK` | Karyawan Kontrak | COUNT(employment_status = 'Kontrak') |
| `TOTAL_RELAWAN` | Relawan (Berbayar, Tanpa Tunjangan) | COUNT(employment_status = 'Relawan') |
| `JK_PRIA` | Laki-Laki | COUNT(gender = 'L') |
| `JK_WANITA` | Perempuan | COUNT(gender = 'P') |
| `PER_DIVISI` | Per Divisi | Tabel: Nama Divisi \| Angka |
| `PER_UNIT` | Per Unit | Tabel: Nama Unit \| Angka |
| `PER_LEVEL` | Per Level Jabatan | Tabel: Level \| Angka |
| `MASA_KERJA_AVG` | Rata-rata Masa Kerja | AVG(employment_count_year) |
| `KONTRAK_30_HARI` | Kontrak Habis < 30 Hari | COUNT(kontrak yang akan habis) |
| `JOIN_BULAN_INI` | Masuk Bulan Ini | COUNT(join_date bulan berjalan) |
| `ULTAH_MINGGU_INI` | Ulang Tahun Minggu Ini | COUNT(date_of_birth minggu ini) |

### Konfigurasi Widget di Master Akses

- Toggle **aktif/nonaktif** per widget
- Atur **urutan tampil** (input angka)
- Ubah **label** sesuai istilah internal LAZWaf
- Atur **visibilitas per role** (contoh: widget detail unit hanya untuk Admin HR ke atas)

---

## 6. Fitur: Login & Autentikasi

### Mekanisme
- Login via Google Account (`Session.getActiveUser().getEmail()`)
- Email divalidasi ke sheet `users` — harus terdaftar dan berstatus aktif
- Sesi disimpan via `PropertiesService.getUserProperties()`
- Durasi sesi: **8 jam kerja** (dapat dikonfigurasi)

### Halaman Login
- Tampilkan logo LAZWaf Al Azhar
- Tombol "Masuk dengan Google"
- Jika email tidak terdaftar: tampilkan pesan dan kontak Admin HR

### Audit Login
Setiap login berhasil/gagal dicatat di sheet `audit_log` dengan: email, timestamp, status, user agent.

---

## 7. Fitur: Dashboard

### Layout Utama
```
┌─────────────────────────────────────────────────────────┐
│ HEADER: Logo LAZWaf | Nama User | Divisi | Logout       │
├──────────┬──────────────────────────────────────────────┤
│          │  [Widget] [Widget] [Widget] [Widget]          │
│ SIDEBAR  │                                              │
│ Navigasi │  [Tabel Per Divisi]   [Tabel Per Unit]       │
│          │                                              │
│          │  [Widget] [Widget] [Widget]                  │
├──────────┴──────────────────────────────────────────────┤
│ FOOTER: LAZWaf Al Azhar | v1.0 | Updated: 17 Jun 2026  │
└─────────────────────────────────────────────────────────┘
```

### Perilaku Dashboard
- Data di-refresh setiap kali halaman dibuka
- Tombol **Refresh Manual** tersedia
- Timestamp "Terakhir diperbarui: HH:MM" ditampilkan di setiap widget
- Widget Per Divisi menampilkan hanya divisi yang ada datanya

---

## 8. Fitur: Hak Akses

### Role Default

| Role | Deskripsi | Siapa |
|------|-----------|-------|
| **Super Admin** | Akses penuh + konfigurasi sistem | IT / Pimpinan |
| **Admin HR** | Kelola semua data karyawan | Tim HRD |
| **Manager Divisi** | Lihat data karyawan divisinya saja | Kepala Divisi / Manager |
| **Staf Viewer** | Lihat data terbatas | Karyawan umum |

### Matrix Permission

| Modul | Super Admin | Admin HR | Manager Divisi | Staf Viewer |
|-------|:-----------:|:--------:|:--------------:|:-----------:|
| Dashboard (semua widget) | ✅ | ✅ | ✅ (divisi sendiri) | ✅ (terbatas) |
| Data Pegawai – View | ✅ | ✅ | ✅ (divisi sendiri) | ❌ |
| Data Pegawai – Tambah | ✅ | ✅ | ❌ | ❌ |
| Data Pegawai – Edit | ✅ | ✅ | ❌ | ❌ |
| Data Pegawai – Nonaktifkan | ✅ | ✅ | ❌ | ❌ |
| Data Pegawai – Hapus | ✅ | ❌ | ❌ | ❌ |
| Riwayat Karir – View | ✅ | ✅ | ✅ (divisi sendiri) | ❌ |
| Riwayat Karir – Edit | ✅ | ✅ | ❌ | ❌ |
| Master Data | ✅ | ✅ (view+edit) | ✅ (view) | ❌ |
| Laporan & Export | ✅ | ✅ | ✅ (divisi sendiri) | ❌ |
| Hak Akses – Role | ✅ | ❌ | ❌ | ❌ |
| Hak Akses – User | ✅ | ❌ | ❌ | ❌ |
| Master Akses / Config Widget | ✅ | ❌ | ❌ | ❌ |
| Audit Log | ✅ | ✅ (view) | ❌ | ❌ |
| App Settings | ✅ | ❌ | ❌ | ❌ |

### Pembatasan Data Berdasarkan Role

- **Manager Divisi:** query ke sheet `pegawai` otomatis ter-filter `WHERE departement = [divisi_manager]`
- **Admin HR** dengan cabang tertentu (jika ada KPW): dapat dibatasi per wilayah
- Kolom **NIK, No. HP, Alamat** hanya tampil untuk Admin HR ke atas

---

## 9. Fitur: Data Pegawai

### Form Data Pegawai (Multi-Step)

#### Step 1 – Identitas & Posisi
```
Employee ID*      : [auto-generate / manual]
Nama Lengkap*     : [text]
Posisi Saat Ini*  : [text]
Departemen*       : [dropdown: Sekretariat | Keuangan | LAZ Al Azhar | Fundraising | Program | ...]
Unit*             : [dropdown: dinamis berdasarkan Departemen]
Status Kepegawaian*: [dropdown: Tetap | Kontrak | Relawan]
// Catatan UI: tampilkan tooltip "Relawan: berbayar tanpa tunjangan"
Level*            : [dropdown: 5A | 5C | 4A | 4B | 4C | 3A | 3B | 3C | 2A | 2B | 2C | 1 | 1C]
Job Level*        : [dropdown: Kepala Divisi | Manager | Koordinator | Staf | Non Staf | Relawan]
Tanggal Masuk*    : [date]
```

#### Step 2 – Data Pribadi
```
Tempat Lahir*     : [text]
Tanggal Lahir*    : [date]
Jenis Kelamin*    : [radio: L | P]
Status Nikah*     : [dropdown: Menikah | Single | Janda | Duda]
No. HP*           : [text, format 08xx / +62xx]
Email Kantor      : [email]
NIK               : [text, 16 digit]
Alamat KTP        : [textarea]
Alamat Domisili   : [textarea]
```

#### Step 3 – Pendidikan
```
Pendidikan Terakhir : [dropdown: SD|SMP|SMA/SMK|D3|S1|S2|S3]
Nama Institusi      : [text]   ← dari kolom AJ
Kota Institusi      : [text]   ← dari kolom AK
Tanggal Lulus       : [date]   ← dari kolom AI
```

#### Step 4 – Data Keluarga *(Opsional)*
```
Nama Pasangan     : [text]
Tanggal Lahir Pasangan: [date]

Anak 1 - Nama     : [text]
Anak 1 - Tanggal Lahir: [date]

Anak 2 - Nama     : [text]   ← tambah baris dinamis (maks. 10 anak)
...
```

> **Catatan dari data aktual:** Beberapa karyawan memiliki 4 anak (mis. Rahmatullah Sidik, Ahmad Rizal). Form harus mendukung tambah anak secara dinamis, tidak dibatasi 4.

#### Step 5 – Riwayat Karir *(Lihat Bagian 10)*

### Tampilan Daftar Karyawan

**Kolom yang tampil di tabel:**

| Kolom | Keterangan |
|-------|------------|
| Employee ID | |
| Nama Lengkap | |
| Posisi Saat Ini | disingkat jika terlalu panjang |
| Departemen | |
| Unit | |
| Status | badge warna: Tetap (hijau) / Kontrak (kuning) / Relawan (abu-abu) — ketiganya berbayar, Relawan tanpa tunjangan |
| Level | |
| Masa Kerja | "16 th 5 bl" (dari kolom O, P) |
| Aksi | [👁 Detail] [✏ Edit] [⏸ Nonaktifkan] |

**Filter yang tersedia:**
- Departemen (Sekretariat, Keuangan, LAZ, Fundraising, Program, Semua)
- Unit (dinamis berdasarkan departemen dipilih)
- Status Kepegawaian (Tetap / Kontrak / Relawan / Semua)
- Job Level (Kepala Divisi / Manager / Koordinator / Staf / Non-Staf / Semua)
- Gender (L / P / Semua)
- Status Aktif (Aktif / Nonaktif / Semua)

**Pencarian:** Nama, Employee ID, NIK, Posisi

### Halaman Detail Karyawan

Tab navigasi:
1. **Profil** — semua data identitas, kontak, pribadi
2. **Kepegawaian** — posisi, departemen, level, masa kerja (auto-hitung)
3. **Keluarga** — pasangan + daftar anak
4. **Riwayat Karir** — timeline karir (lihat bagian 10)
5. **Dokumen** — lampiran file
6. **Log Perubahan** — siapa mengubah apa, kapan

### Masa Kerja Auto-Hitung

Berdasarkan logika yang sudah ada di spreadsheet (kolom O, P, Q):

```
Masa Kerja = TODAY() - Join Date
Tampil sebagai: "16 tahun 5 bulan 16 hari"
```

---

## 10. Fitur: Riwayat Karir

Ini adalah fitur **kritis** karena data sumber memiliki hingga 12 riwayat jabatan per karyawan tersebar di 26 kolom.

### Struktur Data Riwayat Karir

Data dari kolom `AM` (Career Start) hingga `BK` (Career Path 12 + tanggal) akan dinormalisasi ke sheet `career_history`:

```
career_history sheet:
| id | employee_id | urutan | jabatan | tanggal_mulai | tanggal_selesai | keterangan |
```

**Contoh konversi dari Rahmatullah Sidik (baris 3):**

| # | Jabatan | Mulai | Selesai |
|---|---------|-------|---------|
| 0 | Staf Program Charity | *(dari join date 2010)* | 1 Jan 2011 |
| 1 | Manager Program | 1 Jan 2011 | 1 Feb 2012 |
| 2 | Manager Program | 1 Feb 2012 | 1 Feb 2013 |
| 3 | Manager Program | 1 Feb 2013 | 27 Des 2016 |
| 4 | Kepala Divisi Program dan Pendayagunaan | 27 Des 2016 | 2 Jan 2017 |
| 5 | Kepala Divisi Program dan Pendayagunaan | 2 Jan 2017 | 2 Jan 2019 |
| 6 | Kepala Divisi Diklat Litbang | 2 Jan 2019 | *...* |
| … | … | … | … |
| 11 | Kepala Sekretariat LAZWaf (Posisi saat ini) | 1 Okt 2024 | *(sekarang)* |

### Tampilan Timeline Karir

```
[2010] ──●── Staf Program Charity
         │
[2011] ──●── Manager Program
         │
[2012] ──●── Manager Program
         │
...
         │
[2024] ──●── Kepala Divisi Sekretariat LAZWaf Al Azhar ◀ (saat ini)
```

### Fitur CRUD Riwayat Karir

- **Tambah** entri karir baru (saat promosi/mutasi)
- **Edit** entri yang sudah ada
- **Hapus** entri (dengan konfirmasi, hanya Admin HR ke atas)
- **Urut ulang** jika tanggal tidak berurutan

---

## 11. Fitur Tambahan

### 11.1 Import Data dari Spreadsheet Sumber

Karena data sumber sudah ada di Google Sheets, fitur import sangat prioritas:

- Tombol **"Import dari Sheets Sumber"** di halaman Data Pegawai
- Sistem baca data dari spreadsheet sumber via Sheets API
- **Preview sebelum import:** tampilkan tabel baris yang akan diimport
- Validasi otomatis:
  - Skip baris yang bukan data karyawan (baris header divisi seperti "Divisi Sekretariat")
  - Tandai baris dengan format tanggal tidak konsisten untuk direview manual
  - Deteksi Employee ID duplikat
- Normalisasi otomatis:
  - Format tanggal: `8/21/1977`, `3 Jul 2007`, `13/01/1982` → format standar `YYYY-MM-DD`
  - Gender: `L` → `Laki-laki`, `P` → `Perempuan`
  - Status: `Tetap`, `Kontrak`, `Relawan` (ketiganya berbayar — label ditampilkan apa adanya tanpa relabeling)
- Setelah disetujui, data dimasukkan ke sheet `pegawai` dan career path ke sheet `career_history`

### 11.2 Export & Laporan

| Laporan | Filter | Format |
|---------|--------|--------|
| Daftar Karyawan Aktif | Divisi, Unit, Status | Excel, PDF |
| Rekap per Divisi | Semua | Excel |
| Karyawan dengan Kontrak Akan Habis | Rentang hari | Excel |
| Riwayat Karir Karyawan | Per orang | PDF |
| Statistik Gender & Status | Semua / per Divisi | Excel |
| Karyawan Berdasarkan Level | Semua | Excel |
| Karyawan Baru Periode Tertentu | Rentang tanggal | Excel |

### 11.3 Notifikasi Otomatis

Berjalan via **GAS Time-based Trigger** setiap hari pukul 07:00 WIB:

| Jenis | Trigger | Penerima |
|-------|---------|---------|
| Kontrak akan habis 30 hari | H-30 | Admin HR + email karyawan |
| Kontrak akan habis 14 hari | H-14 | Admin HR + Kepala Divisi |
| Kontrak akan habis 7 hari | H-7 | Admin HR + Kepala Divisi + Direksi |
| Ulang tahun karyawan | Hari H | Admin HR (rekap harian) |
| Masa kerja anniversary | Hari H (tahun bulat) | Admin HR (opsional) |
| Kolom Email belum diisi | Mingguan | Admin HR (daftar karyawan tanpa email) |

### 11.4 Manajemen Dokumen

- Upload dokumen ke Google Drive (folder per karyawan: `/SIMDP/{EmployeeID}/`)
- Kategori dokumen: KTP, Ijazah, SK Pengangkatan, Kontrak Kerja, NPWP, BPJS, Foto KTP, Foto Formal
- Preview file PDF/gambar langsung di aplikasi
- Indikator kelengkapan dokumen per karyawan

### 11.5 Audit Log

Setiap aksi tercatat:

| Field | Contoh |
|-------|--------|
| Timestamp | `2026-06-17 09:45:22` |
| User | `admin.hr@alazhar.or.id` |
| Aksi | `EDIT` |
| Modul | `Data Pegawai` |
| Employee ID | `20103008013` |
| Field diubah | `Current Position` |
| Nilai lama | `Wakil Direktur` |
| Nilai baru | `Kepala Divisi Sekretariat` |

### 11.6 Master Data

| Master | Field |
|--------|-------|
| Divisi | Kode, Nama, Kepala Divisi, Status |
| Unit | Kode, Nama, Divisi induk, Status |
| Level/Grade | Kode, Label (5A, 4B, dst.), Deskripsi |
| Status Kepegawaian | Tetap, Kontrak, Relawan |
| Jenis Dokumen | Nama, Wajib/Opsional |

---

## 12. Struktur Database (Google Sheets)

### Daftar Sheet

| Sheet Name | Fungsi |
|------------|--------|
| `pegawai` | Data utama karyawan (1 baris = 1 karyawan) |
| `career_history` | Riwayat karir dinormalisasi (1 baris = 1 jabatan) |
| `family_members` | Data keluarga (pasangan + anak, multi-row per karyawan) |
| `users` | Akun pengguna sistem |
| `roles` | Definisi peran |
| `permissions` | Izin per role per modul |
| `master_divisi` | Data divisi |
| `master_unit` | Data unit dalam divisi |
| `master_level` | Daftar level jabatan |
| `dokumen_pegawai` | Referensi dokumen di Drive |
| `audit_log` | Log semua aktivitas |
| `dashboard_config` | Konfigurasi widget |
| `notifikasi_config` | Setting notifikasi |
| `app_settings` | Konfigurasi aplikasi |

### Sheet: `pegawai` — Struktur Kolom

```
id, employee_id, full_name, current_position, departement, unit,
employment_status, level, job_level, join_date, email_kantor, email_pribadi,
mobile_phone, place_of_birth, date_of_birth, gender, marital_status,
nik, nik_address, residential_address, education_level, institution_name,
institution_place, graduation_date, is_active, inactive_date, inactive_reason,
created_at, updated_at, updated_by
```

### Sheet: `career_history` — Struktur Kolom

```
id, employee_id, urutan, jabatan, departement, unit, tanggal_mulai,
tanggal_selesai, keterangan, is_current, created_at, updated_by
```

### Sheet: `family_members` — Struktur Kolom

```
id, employee_id, tipe (pasangan/anak), nama, tanggal_lahir, urutan_anak
```

---

## 13. Functional Requirements

### Prioritas High

| ID | Fitur | Modul |
|----|-------|-------|
| FR-001 | Import data dari spreadsheet sumber LAZWaf | Data Pegawai |
| FR-002 | Tampilkan widget angka di landing page (total, gender, divisi, unit, status) | Dashboard |
| FR-003 | Konfigurasi widget di Master Akses (aktif/nonaktif, urutan, label) | Master Akses |
| FR-004 | Login via Google OAuth + validasi ke sheet users | Auth |
| FR-005 | CRUD lengkap data pegawai dengan form multi-step | Data Pegawai |
| FR-006 | Auto-hitung masa kerja (tahun, bulan, hari) dari tanggal masuk | Data Pegawai |
| FR-007 | Timeline riwayat karir (normalisasi dari 12 career path columns) | Karir |
| FR-008 | Tambah/edit riwayat karir per karyawan | Karir |
| FR-009 | Filter karyawan by divisi, unit, level, status, gender | Data Pegawai |
| FR-010 | Manajemen role & permission per modul | Hak Akses |
| FR-011 | Manager Divisi hanya melihat data karyawan divisinya | Hak Akses |
| FR-012 | Audit log semua aksi CRUD | Log |

### Prioritas Medium

| ID | Fitur | Modul |
|----|-------|-------|
| FR-013 | Export daftar karyawan ke Excel | Laporan |
| FR-014 | Notifikasi email kontrak akan habis (H-30, H-14, H-7) | Notifikasi |
| FR-015 | Notifikasi ulang tahun karyawan (harian, ke Admin HR) | Notifikasi |
| FR-016 | Upload dokumen karyawan ke Google Drive | Dokumen |
| FR-017 | Laporan rekap per divisi & per status | Laporan |
| FR-018 | Master data divisi, unit, level | Master Data |
| FR-019 | Manajemen akun user (tambah, edit role, nonaktifkan) | Hak Akses |
| FR-020 | Input data keluarga dinamis (pasangan + anak, jumlah fleksibel) | Data Pegawai |

### Prioritas Low

| ID | Fitur | Modul |
|----|-------|-------|
| FR-021 | Export riwayat karir per karyawan ke PDF | Laporan |
| FR-022 | Indikator kelengkapan profil karyawan | Data Pegawai |
| FR-023 | Pengaturan aplikasi (nama org, logo, durasi sesi) | Settings |
| FR-024 | Laporan karyawan baru per periode | Laporan |
| FR-025 | Force logout pengguna aktif | Auth |

---

## 14. Non-Functional Requirements

### Performa
- Halaman dashboard tampil dalam < 3 detik (untuk dataset 100–500 karyawan)
- Proses import batch (100+ baris) selesai < 30 detik dengan feedback progress
- Query filter karyawan selesai < 2 detik

### Keamanan
- Semua endpoint validasi sesi dan permission sebelum memproses
- NIK, No. HP, Alamat hanya tampil untuk role yang berwenang
- Data sumber (spreadsheet asli) tidak dimodifikasi — hanya dibaca saat import

### Kompatibilitas
- Berjalan di Chrome, Firefox, Safari (versi terbaru)
- Responsif untuk mobile (akses darurat, bukan penggunaan utama)

### Keandalan
- GAS execution timeout dihindari dengan batching untuk proses berat
- Data tidak pernah dihapus permanen kecuali oleh Super Admin dengan konfirmasi berlapis

---

## 15. Milestone Pengembangan

| Fase | Durasi | Deliverable |
|------|--------|-------------|
| **Fase 1 – Fondasi** | 1 minggu | Setup project GAS, struktur semua sheet, login OAuth, routing halaman |
| **Fase 2 – Import & Core Data** | 2 minggu | Import data dari sumber, CRUD pegawai, normalisasi career path, keluarga |
| **Fase 3 – Dashboard & Akses** | 1 minggu | Widget statistik, konfigurasi widget, hak akses role & user |
| **Fase 4 – Produktivitas** | 2 minggu | Filter & pencarian, audit log, export Excel, laporan |
| **Fase 5 – Otomasi** | 1 minggu | Notifikasi email, upload dokumen Drive, pengaturan app |
| **Fase 6 – QA & Go Live** | 1 minggu | UAT bersama tim HRD, bug fixing, deployment |

**Total Estimasi: ±8 minggu**

---

## Lampiran: Daftar Divisi & Unit (dari Data Aktual)

```
Sekretariat
├── Direksi
├── Kelembagaan
├── Humas, GA, dan IT
└── Diklat & Litbang

Keuangan
├── Direksi
├── Pengeluaran
├── Penerimaan
└── Anggaran & Akuntansi

LAZ Al Azhar
└── Direksi

Fundraising & Partnership
├── Internal Fundraising
└── Eksternal Fundraising

Program
└── Program
```

> **Catatan:** Divisi KPW (Kantor Perwakilan Wilayah) seperti Sulawesi Selatan disebutkan dalam riwayat karir beberapa karyawan — perlu dikonfirmasi apakah masih aktif sebagai divisi tersendiri.

---

## Lampiran: Kode Employee ID

Format Employee ID dari data aktual: `YYYYMMNNXXX`

| Segmen | Contoh | Arti |
|--------|--------|------|
| YYYY | `2010` | Tahun bergabung |
| MM | `03` | Bulan bergabung |
| NN | `08` | Tanggal bergabung |
| XXX | `013` | Nomor urut karyawan |

Contoh: `20103008013` → bergabung 30 Maret 2010, nomor urut 13

---

*Dokumen ini dibuat berdasarkan analisis langsung terhadap data spreadsheet aktual LAZWaf Al Azhar.*  
*PRD – SIMDP LAZWaf Al Azhar · v1.0.0 · 17 Juni 2026*
