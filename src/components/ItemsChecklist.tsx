// ItemsChecklist.tsx
import { useState, useEffect } from "preact/hooks";

interface ItemsChecklistProps {
  borrowRequest: any;
  onSubmit: (checklist: any[], allGood: boolean) => void;
}

export default function ItemsChecklist({ borrowRequest, onSubmit }: ItemsChecklistProps) {
  
  const [checklist, setChecklist] = useState<any[]>([]);

  useEffect(() => {
    if (!borrowRequest?.items) return;

    const list = borrowRequest.items.map((item: any, i: number) => ({
      name: item.particulars || item.name || "Unknown",
      quantity: Number(item.quantity ?? item.qty ?? 1),
      condition: "" as "" | "good" | "defective",
    }));

    setChecklist(list);
  }, [borrowRequest]);

  const toggle = (index: number, type: "good" | "defective") => {
    const newList = [...checklist];
    newList[index].condition = newList[index].condition === type ? "" : type;
    setChecklist(newList);
  };

  const handleSubmit = () => {
    const allGood = checklist.every(item => item.condition === "good");
    onSubmit(checklist, allGood);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center mb-4">Items Condition Checklist</h2>
      <p className="text-center mb-6">
        Request #{borrowRequest?.requestNo} - {borrowRequest?.requestor}
      </p>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Item</th>
            <th className="p-3 text-center">Qty</th>
            <th className="p-3 text-center">Good</th>
            <th className="p-3 text-center">Defective</th>
          </tr>
        </thead>
        <tbody>
          {checklist.map((item, index) => (
            <tr key={index}>
              <td className="p-3 border">{item.name}</td>
              <td className="p-3 border text-center">{item.quantity}</td>
              <td className="p-3 border text-center">
                <input 
                  type="checkbox" 
                  checked={item.condition === "good"}
                  onChange={() => toggle(index, "good")}
                />
              </td>
              <td className="p-3 border text-center">
                <input 
                  type="checkbox" 
                  checked={item.condition === "defective"}
                  onChange={() => toggle(index, "defective")}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-center">
        <button 
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-10 py-3 rounded hover:bg-blue-700"
        >
          Submit Checklist
        </button>
      </div>
    </div>
  );
}