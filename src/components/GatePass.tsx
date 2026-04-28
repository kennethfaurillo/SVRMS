import { useEffect, useRef, useState } from "preact/hooks";

type GatePassProps = {
  request: any;           // BorrowRequest data
  onClose: () => void;
};

export default function GatePass({ request, onClose }: GatePassProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<any>(request);

  const handlePrint = () => {
    window.print();
  };

  const handleChange = (field: string, value: any) => {
  setForm((prev: any) => ({
    ...prev,
    [field]: value,
  }));
};

  useEffect(() => {
    setForm(request);
  }, [request]);

  const renderGatePassContent = () => `
    <div>
      <!-- HEADER -->
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:10px;">
        <div style="display:flex; gap:10px;">
          <img src="${window.location.origin}/PIWAD-LOGO.png" style="height:60px;" />
          <div>
            <strong>PILI WATER DISTRICT</strong><br/>
            Sta. Rita Agro Industrial Park<br/>
            San Jose, Pili, Camarines Sur
          </div>
        </div>

        <div style="text-align:right; font-size:12px;">
          Form No. AGSD-PGSD 001<br/>
          August 2017<br/>
          Rev. 00
        </div>
      </div>

      <h2 style="text-align:center;">GATE PASS</h2>

     <input
  value={form.requestor || ""}
  onInput={(e: any) => handleChange("requestor", e.target.value)}
  className="border-b border-gray-400 px-2 outline-none"
/>

      <!-- TABLE -->
      <table border="1" width="100%">
        <tr>
          <th>QTY</th>
          <th>ITEM</th>
          <th>RETURN</th>
          <th>REMARKS</th>
        </tr>

        ${
          request.items?.length
            ? request.items.map((item: any) => `
              <tr>
                <td>${item.quantity}</td>
                <td>${item.particulars}</td>
                <td>${request.returnDate || "—"}</td>
                <td>${item.remarks || "—"}</td>
              </tr>
            `).join("")
            : `
              <tr>
                <td colspan="4" style="text-align:center;">No items</td>
              </tr>
            `
        }
      </table>

      <p><b>Purpose:</b> ${request.purpose || "_____"}</p>

      <br/>

      <div style="margin-top:40px; display:table; width:100%; table-layout:fixed; font-size:12px; text-align:center;">

 
  <div style="display:table-cell; width:33%; padding:0 10px;">
    <div style="height:40px;"></div>
    <div style="border-top:2px solid #000; margin-bottom:5px;"></div>
    Guard on Duty<br/>
    <span style="font-size:10px;">Date/Time: _____________</span>
  </div>

 
  <div style="display:table-cell; width:33%; padding:0 10px;">
    <div style="height:40px;"></div>
    <div style="border-top:2px solid #000; margin-bottom:5px;"></div>
    Borrower Name & Signature
  </div>

  
  <div style="display:table-cell; width:33%; padding:0 10px;">
    <div style="height:40px;"></div>
    <div style="border-top:2px solid #000; margin-bottom:5px;"></div>
    Issued By:<br/>
    <b>SHIELA V. BERSOLA</b><br/>
    <span style="font-size:10px;">Admin./General Services Chief</span>
  </div>

</div>
  `;

  const getPrintHtml = () => {
  return `
  <html>
    <head>
      <title>Gate Pass</title>

      <style>
        @page {
          size: A4;
          margin: 8mm;
        }

        body {
          margin: 0;
          font-family: Arial;
        }

        .page {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }

        .gatepass {
          height: 50%;
          border: 2px solid #000;
          box-sizing: border-box;
          padding: 12px;

          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          border: 1px solid #000;
          padding: 6px;
        }
      </style>
    </head>

    <body>

      <div class="page">

        ${[1,2].map(() => `
          <div class="gatepass">

            <!-- HEADER -->
            <div class="header">
              <div>
                <strong>PILI WATER DISTRICT</strong><br/>
                Sta. Rita Agro Industrial Park<br/>
                San Jose, Pili, Camarines Sur
              </div>
              <div style="text-align:right; font-size:12px;">
                Form No. AGSD-PGSD 001<br/>
                August 2017<br/>
                Rev. 00
              </div>
            </div>

            <h3 style="text-align:center;">GATE PASS</h3>

            <p><b>Requestor:</b> ${form.requestor || "_____"}</p>

            <p><b>Purpose:</b> ${form.purpose || "_____"}</p>

            <div style="margin-top:auto; display:grid; grid-template-columns:1fr 1fr 1fr; text-align:center; font-size:12px;">
              <div>
                <div style="border-top:2px solid #000; height:40px;"></div>
                Guard on Duty
              </div>

              <div>
                <div style="border-top:2px solid #000; height:40px;"></div>
                Borrower Signature
              </div>

              <div>
                <div style="border-top:2px solid #000; height:40px;"></div>
                Issued By
              </div>
            </div>

          </div>
        `).join("")}

      </div>

    </body>
  </html>
  `;
};
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

     <div
  className="fixed inset-0 flex items-center justify-center z-50 p-4"
  style={{ background: "rgba(0,0,0,0.6)" }}
>
        <div id="gatepass" ref={printRef} className="bg-white w-full max-w-4xl shadow-2xl p-8 font-serif text-sm">

          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div className="flex items-center gap-4">
              <img 
                src="/PIWAD-LOGO.png" 
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
              This is to authorize <span className="font-medium underline">{form.requestor || "________________"}</span> 
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
                    <td className="border border-black p-2 align-top">
                      <input
                        value={form.returnDate || ""}
                        onInput={(e: any) => handleChange("returnDate", e.target.value)}
                        className="border px-1"
                      />
                    </td>
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
            <input
              value={form.purpose || ""}
              onInput={(e: any) => handleChange("purpose", e.target.value)}
              className="border-b border-gray-400 px-2 outline-none"
            />
                        </span>
          </div>

          {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-8 text-center text-xs mt-auto">
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