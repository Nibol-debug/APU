📄 Product Requirements Document (PRD)

Sistem Informasi Karyawan (Apps Script)

---

1. 📌 Overview

Aplikasi ini adalah sistem berbasis Google Apps Script (Web App) untuk mengelola dan menampilkan data karyawan dengan fitur autentikasi, dashboard, dan manajemen hak akses.

---

2. 🎯 Tujuan

- Menyediakan sistem sederhana untuk monitoring data karyawan
- Mempermudah pengelolaan data pegawai berbasis web
- Mendukung multi-role (Admin, HR, Viewer)
- Menyediakan dashboard ringkasan (hanya angka)

---

3. 👥 Role & Hak Akses

Role| Hak Akses
Admin| Full akses (CRUD semua data + setting sistem)
HR| CRUD data pegawai
Viewer| Hanya lihat dashboard & data

---

4. 🧩 Fitur Utama

4.1 Tampilan Awal (Landing Page)

- Menampilkan ringkasan data (hanya angka):
  - Total karyawan
  - Jumlah berdasarkan jenis kelamin
  - Jumlah per divisi
  - Jumlah per cabang
- Bisa diatur dari menu Master Akses

---

4.2 Login System

- Login menggunakan:
  - Email + Password (custom)
  - Atau Google Account (opsional)
- Session management sederhana (via PropertiesService / Cache)

---

4.3 Dashboard

- Menampilkan statistik utama:
  - Total Karyawan
  - Laki-laki
  - Perempuan
  - Jumlah divisi
  - Jumlah cabang
- Grafik (opsional):
  - Pie chart gender
  - Bar chart divisi

---

4.4 Data Pegawai

- Field:
  - ID Pegawai
  - Nama
  - Jenis Kelamin
  - Divisi
  - Jabatan
  - Cabang
  - Status (Aktif/Nonaktif)
- Fitur:
  - Tambah data
  - Edit data
  - Hapus data
  - Search & filter

---

4.5 Hak Akses (Role Management)

- Kelola role user:
  - Assign role ke user
- Batasi fitur berdasarkan role

---

4.6 Master Akses (Setting Landing Page)

- Pilih data apa saja yang tampil di halaman awal:
  - [✔] Total Karyawan
  - [✔] Gender
  - [✔] Divisi
  - [✔] Cabang
- Output hanya angka (tanpa detail)

---

5. ➕ Fitur Tambahan (Recommended)

5.1 Export Data

- Export ke:
  - Excel (Google Sheets)
  - PDF

---

5.2 Import Data

- Upload CSV / Excel untuk bulk data pegawai

---

5.3 Audit Log

- Mencatat aktivitas:
  - Login
  - Tambah/Edit/Hapus data

---

5.4 Notifikasi

- Notifikasi saat:
  - Data ditambahkan
  - Data diubah

---

5.5 Pagination & Performance

- Batasi load data (misal 10–50 row per page)
- Hindari load semua data sekaligus

---

5.6 Search & Filter Advanced

- Filter berdasarkan:
  - Divisi
  - Cabang
  - Status

---

5.7 Mobile Friendly UI

- Responsive design (Bootstrap / Tailwind)

---

6. 🗂️ Struktur Data (Google Sheets)

Sheet: Users

| id | email | password | role |

---

Sheet: Employees

| id | nama | gender | divisi | jabatan | cabang | status |

---

Sheet: Settings

key| value
show_total| true
show_gender| true
show_divisi| true
show_cabang| true

---

Sheet: Logs

| timestamp | user | action | detail |

---

7. 🧪 Non-Functional Requirements

- Response time < 2 detik
- Aman (validasi input)
- Role-based access control
- Mudah di-scale (struktur modular)

---

8. 🏗️ Arsitektur

- Frontend: HTML + CSS + JS (Apps Script HTML Service)
- Backend: Google Apps Script
- Database: Google Sheets

---

9. 🔐 Security

- Hash password (minimal base64 / better: SHA)
- Validasi input form
- Role check di setiap endpoint

---

10. 🚀 Future Improvement

- Integrasi API HRIS
- Sistem absensi
- Payroll sederhana
- Multi-tenant (multi perusahaan)

---

11. 📊 KPI Sukses

- Data karyawan bisa diakses < 2 detik
- Error rate < 1%
- User aktif meningkat

---

12. 📝 Catatan Khusus

- Dashboard & landing page hanya menampilkan angka (numeric only)
- Tidak ada detail list di halaman awal
- Fokus ringan & cepat

---

✅ Selesai

PRD ini bisa langsung dipakai untuk development Apps Script.