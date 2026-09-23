# Modul Data Master Terpadu

## Tujuan
Menyediakan satu sumber data terkelola untuk produk apotek, kategori, supplier, dan satuan agar transaksi kasir konsisten dan siap dikembangkan menjadi modul stok.

## Ruang Lingkup Tahap Pertama
- Halaman `/master-data` dengan tab Produk, Kategori, Supplier, dan Satuan.
- CRUD untuk setiap entitas dengan validasi dasar dan status aktif/nonaktif.
- Produk memiliki SKU, nama, kategori, supplier, harga beli, harga jual, stok minimum, dan satuan.
- Produk mendukung beberapa satuan penjualan seperti tablet, strip, box, botol, dan vial.
- Setiap satuan produk memiliki faktor konversi terhadap satuan dasar dan harga jual sendiri.
- Produk aktif tersedia pada kasir; produk nonaktif tidak dapat ditambahkan ke transaksi baru.

## Struktur Antarmuka
- Header halaman: judul, ringkasan jumlah produk aktif, dan tombol tambah.
- Tab navigasi horizontal yang dapat di-scroll pada mobile.
- Desktop: tabel padat dengan pencarian, filter status/kategori, dan aksi edit/nonaktifkan.
- Mobile/tablet: daftar card dengan field utama, badge status, dan aksi yang mudah disentuh.
- Form tambah/edit memakai dialog atau panel yang responsif; field satuan memakai editor baris.

## Aturan Data
- SKU unik dan wajib.
- Nama produk wajib.
- Harga beli dan jual tidak boleh negatif.
- Faktor konversi harus bilangan positif.
- Satuan dasar wajib ada sebelum satuan turunan.
- Produk nonaktif dipertahankan untuk riwayat transaksi, tetapi tidak muncul sebagai pilihan baru di kasir.
- Penghapusan permanen tidak digunakan untuk data yang sudah dipakai transaksi.

## Integrasi Kasir
Kasir membaca produk aktif dan daftar satuannya dari sumber data master yang sama. Pemilihan satuan memperbarui harga serta batas kuantitas berdasarkan faktor konversi dan stok yang tersedia. Perubahan master tidak mengubah snapshot nama/harga pada transaksi yang sudah selesai.

## Tahapan Implementasi
1. Bangun halaman dan komponen UI Data Master dengan data lokal terstruktur mengikuti model domain saat ini.
2. Pisahkan model produk, kategori, supplier, dan satuan agar dipakai bersama oleh kasir.
3. Tambahkan validasi form dan state CRUD.
4. Sambungkan kasir ke data master bersama.
5. Siapkan titik integrasi penyimpanan persisten untuk tahap stok/database.

## Validasi
- Build/type-check.
- Browser desktop: tabel, tab, tambah/edit produk.
- Browser mobile dan tablet: tab horizontal, card, form satuan, tanpa overflow.
- Kasir: produk aktif dan semua pilihan satuan tetap tersedia.

## Di Luar Cakupan
Pembelian supplier, penerimaan stok, batch/kedaluwarsa, audit log, autentikasi/role, dan database persistence penuh dikerjakan pada tahap berikutnya agar modul pertama tetap terukur.
