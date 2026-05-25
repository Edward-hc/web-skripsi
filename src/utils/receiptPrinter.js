function rupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Cetak nota customer dari data invoice penjualan.
 * - `invoiceData`: hasil dari `sales_invoice_detail.php` ({ header, items }).
 * - `extras`: opsional (bayar, kembalian) untuk nota POS saat transaksi baru.
 */
export function printSalesReceipt(invoiceData, extras = {}) {
  const header = invoiceData?.header || {};
  const items = Array.isArray(invoiceData?.items) ? invoiceData.items : [];

  const printedAt = extras?.printedAt instanceof Date ? extras.printedAt : new Date();
  const tanggalJamCetak = printedAt.toLocaleString("id-ID");
  const kasir = extras?.kasir || header.kasir || "-";
  const penjualanID = header.penjualanID ?? "-";
  const lokasi = header.lokasi || "-";
  const alamatToko = extras?.alamatToko || header.alamatToko || "";

  const total = header.totalPenjualan ?? header.totalTransaksi ?? 0;
  const totalDiskon = header.totalDiskon ?? 0;
  const subtotal = Math.max(0, Number(total || 0) + Number(totalDiskon || 0));

  const bayar = extras?.bayar;
  const kembalian = extras?.kembalian;

  const yyyy = printedAt.getFullYear();
  const mm = String(printedAt.getMonth() + 1).padStart(2, "0");
  const dd = String(printedAt.getDate()).padStart(2, "0");
  const notaID =
    penjualanID !== "-" && penjualanID !== null && penjualanID !== undefined
      ? `NJ${yyyy}${mm}${dd}-${String(penjualanID).padStart(6, "0")}`
      : `NJ${yyyy}${mm}${dd}`;

  const rows = items
    .map((it) => {
      const nama = `${it.namaVarian || "-"}${it.namaProduk ? ` (${it.namaProduk})` : ""}`;
      const qty = Number(
        it.jumlahTersisa !== undefined && it.jumlahTersisa !== null
          ? it.jumlahTersisa
          : it.jumlah || 0
      );
      if (qty <= 0) {
        return "";
      }
      const harga = Number(it.hargaSatuan || 0);
      const grossLine = qty * harga;
      const jumlahAsli = Number(it.jumlah || 0);
      const subfull = Number(it.subtotal || 0);
      let lineSubtotalNet;
      if (it.subtotalTersisa !== undefined && it.subtotalTersisa !== null) {
        lineSubtotalNet = Number(it.subtotalTersisa);
      } else if (jumlahAsli > 0) {
        lineSubtotalNet = (qty / jumlahAsli) * subfull;
      } else {
        lineSubtotalNet = subfull;
      }
      const discItem = Math.max(0, grossLine - lineSubtotalNet);
      return `
        <tr><td class="item-name" colspan="2">${escapeHtml(nama)}</td></tr>
        <tr>
          <td class="item-sub">${qty} x ${rupiah(harga)}</td>
          <td class="item-amt">${rupiah(grossLine)}</td>
        </tr>
        ${
          discItem > 0
            ? `
              <tr>
                <td class="item-sub">DISC</td>
                <td class="item-amt">-${rupiah(discItem)}</td>
              </tr>
            `
            : ""
        }
      `;
    })
    .join("");

  const html = `<!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nota Penjualan</title>
    <style>
      /* Thermal 80mm */
      @page { size: 80mm auto; margin: 3mm; }
      html, body { padding: 0; margin: 0; }
      body {
        width: 80mm;
        font-family: "Courier New", Courier, monospace;
        font-size: 11px;
        color: #111;
      }
      .center { text-align: center; }
      .muted { color: #111; }
      .hr { border-top: 1px dashed #111; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; vertical-align: top; }
      .title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
      .small { font-size: 10px; }
      .kv { display: flex; justify-content: space-between; gap: 8px; }
      .kv .k { white-space: nowrap; }
      .kv .v { text-align: right; white-space: nowrap; }
      .items td { padding: 1px 0; }
      .item-name { word-break: break-word; }
      .item-sub { padding-right: 6px; white-space: nowrap; }
      .item-amt { text-align: right; white-space: nowrap; width: 1%; }
    </style>
  </head>
  <body>
    <div class="center">
      <div class="title">${escapeHtml(lokasi)}</div>
      ${alamatToko ? `<div class="small">${escapeHtml(alamatToko)}</div>` : ""}
    </div>

    <div class="hr"></div>
    <div class="kv"><div class="k">Tgl/Jam</div><div class="v">${escapeHtml(tanggalJamCetak)}</div></div>
    <div class="kv"><div class="k">Kasir</div><div class="v">${escapeHtml(kasir)}</div></div>
    <div class="kv"><div class="k">NotaID</div><div class="v">${escapeHtml(notaID)}</div></div>
    <div class="kv"><div class="k">Customer</div><div class="v">${escapeHtml(header.namaPembeli || "-")}</div></div>
    <div class="kv"><div class="k">Metode</div><div class="v">${escapeHtml(header.metodePembayaran || "-")}</div></div>

    <div class="hr"></div>
    <table class="items">
      <tbody>
        ${rows || `<tr><td>Tidak ada item</td><td></td></tr>`}
      </tbody>
    </table>

    <div class="hr"></div>
    <div class="kv"><div class="k">Subtotal</div><div class="v">${rupiah(subtotal)}</div></div>
    <div class="kv"><div class="k">TOTAL DISC</div><div class="v">-${rupiah(totalDiskon)}</div></div>
    <div class="kv"><div class="k"><strong>TOTAL</strong></div><div class="v"><strong>${rupiah(total)}</strong></div></div>
    ${
      typeof bayar === "number"
        ? `<div class="kv"><div class="k">Bayar</div><div class="v">${rupiah(bayar)}</div></div>`
        : ""
    }
    ${
      typeof kembalian === "number"
        ? `<div class="kv"><div class="k">Kembali</div><div class="v">${rupiah(kembalian)}</div></div>`
        : ""
    }

    <div class="hr"></div>
    <div class="center small">TERIMA KASIH</div>
    <div class="center small">Barang yang sudah dibeli</div>
    <div class="center small">tidak dapat dikembalikan</div>
  </body>
  </html>`;

  // Cetak di tab yang sama lewat iframe (tanpa buka tab/window baru)
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      /* ignore */
    }
  };

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    cleanup();
    alert("Gagal menyiapkan cetak nota.");
    return;
  }

  let printed = false;
  const doPrintOnce = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } finally {
      // onafterprint tidak selalu jalan di semua browser untuk iframe
      setTimeout(cleanup, 500);
    }
  };

  // cleanup yang lebih rapi kalau event tersedia
  try {
    win.onafterprint = () => setTimeout(cleanup, 0);
  } catch {
    /* ignore */
  }

  iframe.onload = () => {
    // pastikan DOM sudah siap sebelum print
    setTimeout(doPrintOnce, 0);
  };

  doc.open();
  doc.write(html);
  doc.close();

  // Fallback 1x (jaga-jaga onload tidak terpanggil)
  setTimeout(doPrintOnce, 250);
}

