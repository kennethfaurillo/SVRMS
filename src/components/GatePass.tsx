import { useEffect, useRef } from "preact/hooks";

type GatePassProps = {
  request: any;           // BorrowRequest data
  onClose: () => void;
};

export default function GatePass({ request, onClose }: GatePassProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Auto print when component mounts (optional)
  useEffect(() => {
    // Uncomment if you want auto print
    // setTimeout(() => window.print(), 500);
  }, []);

  return (
    <>
      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #gatepass, #gatepass * { visibility: visible; }
            #gatepass { position: absolute; left: 0; top: 0; width: 100%; }
            button { display: none !important; }
          }
        `}
      </style>

      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div id="gatepass" ref={printRef} className="bg-white w-full max-w-4xl shadow-2xl p-8 font-serif text-sm">

          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div className="flex items-center gap-4">
              <img 
                src="/piwad-logo.png" 
                alt="PIWAD Logo" 
                className="w-16 h-16" 
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
              <div>
                <h1 className="font-bold text-xl">PILI WATER DISTRICT</h1>
                <p className="text-xs">Sta. Rita Agro Industrial Park,<br />San Jose, Pili, Camarines Sur</p>
              </div>
            </div>

            <div className="text-right text-xs">
              <p>Form No. AGSD-PGSD 001</p>
              <p>August 2017</p>
              <p>Rev. 00</p>
            </div>
          </div>

          <h2 className="text-center font-bold text-2xl mb-8">GATE PASS</h2>

          <div className="mb-6">
            <div className="flex gap-8">
              <div>
                <span className="font-medium">Date:</span> 
                <span className="ml-2 border-b border-dotted border-gray-400 px-8">
                  {new Date().toLocaleDateString('en-CA')}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-2">
              TO PIWAD GUARDS
            </p>
            <p>
              This is to authorize <span className="font-medium underline">{request.requestor || "________________"}</span> 
              {' '}to bring out from the District premises the following:
            </p>
          </div>

          {/* Table */}
          <table className="w-full border border-black text-sm mb-8">
            <thead>
              <tr className="border-b border-black">
                <th className="border border-black p-2 text-left w-24">QTY/UNIT</th>
                <th className="border border-black p-2 text-left">ITEM/DESCRIPTION</th>
                <th className="border border-black p-2 text-left w-32">DATE RETURNED</th>
                <th className="border border-black p-2 text-left">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {request.items && request.items.length > 0 ? (
                request.items.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-black">
                    <td className="border border-black p-2 align-top">{item.quantity || '—'}</td>
                    <td className="border border-black p-2 align-top">{item.particulars || '—'}</td>
                    <td className="border border-black p-2 align-top">{request.returnDate || '—'}</td>
                    <td className="border border-black p-2 align-top text-xs">{item.remarks || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border border-black p-8 text-center text-gray-400">
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mb-8">
            <span className="font-medium">PURPOSE: </span>
            <span className="border-b border-dotted border-gray-400 px-4">
              {request.purpose || "______________________________"}
            </span>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 mt-12 text-center text-xs">
            <div>
              <div className="border-b border-black pb-1 mb-1 h-8"></div>
              <p>Guard on Duty</p>
              <p className="text-[10px] text-gray-500">Date/Time: ________________</p>
            </div>

            <div>
              <div className="border-b border-black pb-1 mb-1 h-8"></div>
              <p>Borrower Name & Signature</p>
            </div>

            <div>
              <div className="border-b border-black pb-1 mb-1 h-8"></div>
              <p>Issued By:</p>
              <p className="font-medium">SHIELA V. BERSOLA</p>
              <p className="text-[10px]">Admin./General Services Chief</p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-center gap-4 mt-12 print:hidden">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 transition"
            >
              🖨️ Print Gate Pass
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-8 py-3 rounded hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}