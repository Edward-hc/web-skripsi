/**
 * Saat input number berisi "0", ketika user mulai mengetik angka lain,
 * nilai 0 langsung hilang dan diganti input baru.
 *
 * Terapkan sekali pada root (mis. document).
 */
export function enableZeroReplaceBehavior(root = document) {
  if (!root || root.__zeroReplaceBehaviorEnabled) return;
  root.__zeroReplaceBehaviorEnabled = true;

  // Select seluruh isi saat focus, supaya mengetik langsung replace.
  root.addEventListener(
    "focusin",
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement)) return;
      if (el.type !== "number") return;
      if (String(el.value) === "0") {
        // sedikit delay agar aman di beberapa browser
        setTimeout(() => {
          try {
            el.select();
          } catch {
            /* ignore */
          }
        }, 0);
      }
    },
    true
  );

  // Kalau nilai masih "0" dan user menekan digit/./, kosongkan dulu.
  root.addEventListener(
    "keydown",
    (e) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement)) return;
      if (el.type !== "number") return;
      if (String(el.value) !== "0") return;
      if (el.readOnly || el.disabled) return;

      const k = e.key;
      const isDigit = k.length === 1 && k >= "0" && k <= "9";
      const isDot = k === "." || k === ",";
      if (isDigit || isDot) {
        // jangan hapus kalau user memang menekan "0" lagi
        if (k === "0") return;
        el.value = "";
      }
    },
    true
  );
}

