# Panduan Ganti Sender Email (Gmail)

## 1. Siapkan App Password

1. Buka https://myaccount.google.com/apppasswords
   - *(Harus aktifkan 2-Step Verification dulu)*
2. Pilih **Mail** → **Other (beri nama)** → "Employee Finder"
3. Copy **16 digit password** yang muncul

![App Password](https://support.google.com/accounts/answer/185833)

---

## 2. Ubah di `.env`

Edit file `.env` di root proyek:

```env
SMTP_USER=emailbaru@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
```

> **16 digit App Password** ditulis **pakai spasi** (4 digit - 4 digit - 4 digit - 4 digit).

---

## 3. (Opsional) Ubah Nama Pengirim Tampilan

Di halaman **Results** → **Komposer Email** → field **Nama Pengirim** bisa diedit langsung. Ini yang muncul di inbox penerima.

Default: `CVDrop-AI` → terlihat sebagai "CVDrop-AI <emailbaru@gmail.com>"

---

## 4. Test Kirim

```bash
curl -X POST http://localhost:8000/api/v1/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "emailkamu@gmail.com",
    "subject": "Test",
    "content": "Test kirim dari Employee Finder"
  }'
```

Response `{"simulated":false}` = berhasil.

---

## Troubleshooting

| Error | Penyebab | Solusi |
|---|---|---|
| `SMTP not configured` | `.env` tidak terbaca | Pastikan file `.env` ada di folder `backend/` |
| `Authentication failed` | App Password salah | Generate ulang di https://myaccount.google.com/apppasswords |
| `Username and Password not accepted` | 2FA belum aktif | Aktifkan 2-Step Verification dulu |
| `Too many login attempts` | Salah password berkali-kali | Tunggu 1-2 jam, lalu coba lagi |

---

## Notes

- **Wajib** pakai **App Password** (16 digit), bukan password login Gmail biasa
- App Password **tidak perlu diingat** — tinggal generate ulang kapan aja
- Gmail pengirim = Gmail yang authorize App Password
- Bisa pakai akun Gmail **mana saja**, tinggal ganti `SMTP_USER` dan `SMTP_PASSWORD`
