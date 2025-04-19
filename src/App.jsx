import { useState, useEffect } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [invoer, setInvoer] = useState({});

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

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
        <h1 className="text-xl font-bold">📦 Besteltool</h1>
        <p className="text-sm text-gray-600">Laden van productlijst...</p>
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
