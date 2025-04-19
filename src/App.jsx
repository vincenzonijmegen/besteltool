import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [invoer, setInvoer] = useState({});

  useEffect(() => {
    const cached = localStorage.getItem("besteldata");
    if (cached) {
      setData(JSON.parse(cached));
    }
  }, []);

  const handleUpload = (e) => {
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
      setData(grouped);
      localStorage.setItem("besteldata", JSON.stringify(grouped));
    };
    reader.readAsBinaryString(file);
  };

  const handleChange = (lev, naam, val) => {
    setInvoer({
      ...invoer,
      [lev]: { ...(invoer[lev] || {}), [naam]: val },
    });
  };

  const whatsappText = (lev) => {
    const lijst = Object.entries(invoer[lev] || {})
      .filter(([_, v]) => v && v > 0)
      .map(([naam, v]) => `- ${naam}: ${v}`)
      .join("\n");
    return `Hallo, hierbij mijn bestelling voor ${lev}:\n${lijst}`;
  };

  if (!data) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">📤 Upload bestellijst (.xlsx)</h1>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleUpload}
          className="block w-full text-sm"
        />
      </div>
    );
  }

  const leveranciers = Object.keys(data);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">📦 Besteltool</h1>
      <div className="flex flex-wrap gap-2">
        {leveranciers.map((lev) => (
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

      {selected && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{selected}</h2>
          {data[selected].map((item) => (
            <div key={item.naam} className="flex justify-between items-center">
              <span className="text-sm flex-1">{item.naam}</span>
              <input
                type="number"
                min="0"
                className="w-20 p-1 border rounded"
                value={invoer[selected]?.[item.naam] || ""}
                onChange={(e) =>
                  handleChange(selected, item.naam, parseInt(e.target.value) || "")
                }
              />
            </div>
          ))}

          {selected === "Profi Gelato" && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                whatsappText(selected)
              )}`}
              target="_blank"
              className="block mt-4 bg-green-600 text-white text-center p-2 rounded"
            >
              Verstuur via WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
