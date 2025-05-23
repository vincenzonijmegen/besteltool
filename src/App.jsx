import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const STORAGE_KEY = "besteltool_invoer";

export default function App() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [invoer, setInvoer] = useState({});
  const [adminData, setAdminData] = useState(null);

  // Ophalen van JSON (centrale productlijst)
  useEffect(() => {
    fetch("https://yknympukfnazpvoxufwd.supabase.co/storage/v1/object/public/besteldata/data.json")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  // Ophalen van lokale opslag
  useEffect(() => {
    const opgeslagen = localStorage.getItem(STORAGE_KEY);
    if (opgeslagen) {
      try {
        setInvoer(JSON.parse(opgeslagen));
      } catch (err) {
        console.error("Ongeldige localStorage-inhoud");
      }
    }
  }, []);

  // Admin Excel-upload
  const handleAdminUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(sheet);
      const grouped = parsed.reduce((acc, row) => {
        const { Leverancier, Product, Prijs } = row;
        if (!acc[Leverancier]) acc[Leverancier] = [];
        acc[Leverancier].push({ naam: Product, prijs: Prijs });
        return acc;
      }, {});
      setAdminData(grouped);
    };
    reader.readAsBinaryString(file);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(adminData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
  };

  const handleChange = (lev, naam, val) => {
    const nieuw = {
      ...invoer,
      [lev]: { ...(invoer[lev] || {}), [naam]: val },
    };
    setInvoer(nieuw);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nieuw));
  };

  const resetInvoer = (lev) => {
    const nieuw = { ...invoer, [lev]: {} };
    setInvoer(nieuw);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nieuw));
  };

  const whatsappText = (lev) => {
    const lijst = Object.entries(invoer[lev] || {})
      .filter(([_, v]) => v && v > 0)
      .map(([naam, v]) => `- ${naam}: ${v}`)
      .join("\n");
    return `Hallo, hierbij mijn bestelling voor ${lev}:\n${lijst}`;
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">📦 Besteltool</h1>

      {/* Admin-upload */}
      <details className="hidden sm:block border rounded p-2">
        <summary className="font-semibold cursor-pointer">📥 Admin Excel upload</summary>
        <div className="mt-2 space-y-2">
          <input type="file" accept=".xlsx" onChange={handleAdminUpload} />
          {adminData && (
            <button
              onClick={exportToJSON}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Exporteer naar JSON
            </button>
          )}
        </div>
      </details>

      {!data ? (
        <p className="text-sm text-gray-600">Laden van centrale productlijst...</p>
      ) : (
        <>
          {/* Leveranciersknoppen */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(data).map((lev) => (
              <button
                key={lev}
                onClick={() => setSelected(lev)}
                className={`py-2 px-4 rounded ${
                  lev === selected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {lev}
              </button>
            ))}
          </div>

          {/* Productlijst */}
          {selected && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{selected}</h2>

              {data[selected].map((item) => (
                <div key={item.naam} className="flex justify-between items-center">
                  <span className="text-sm flex-1">{item.naam}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        handleChange(
                          selected,
                          item.naam,
                          Math.max((invoer[selected]?.[item.naam] || 0) - 1, 0)
                        )
                      }
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      –
                    </button>
                    <div className="w-8 text-center">
                      {invoer[selected]?.[item.naam] || 0}
                    </div>
                    <button
                      onClick={() =>
                        handleChange(
                          selected,
                          item.naam,
                          (invoer[selected]?.[item.naam] || 0) + 1
                        )
                      }
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {/* Actieknoppen */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => resetInvoer(selected)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded"
                >
                  Wissen
                </button>

                <a
                  href={`mailto:info@ijssalonvincenzo.nl?subject=Bestelling ${selected}&body=${encodeURIComponent(
                    whatsappText(selected)
                  )}`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 rounded"
                >
                  Verstuur via e-mail
                </a>

                {selected === "Profi Gelato" && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      whatsappText(selected)
                    )}`}
                    target="_blank"
                    className="flex-1 bg-green-600 text-white text-center py-2 rounded"
                  >
                    Verstuur via WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
