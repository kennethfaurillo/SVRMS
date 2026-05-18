import { useEffect, useRef, useState } from "preact/hooks";

type GatePassProps = {
  request: any;           // BorrowRequest data
  onClose: () => void;
};

export default function GatePass({ request, onClose }: GatePassProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<any>(request);

const formatDateLong = (dateStr: string) => {
  if (!dateStr) return "—";

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

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

       <div style="margin-top:auto; display:grid; grid-template-columns:1fr 1fr 1fr; text-align:center; font-size:12px;">
              <div>
                <div style="font-weight:bold; font-size:13px; margin-bottom:4px; min-height:18px;">${form.guardName || ""}</div>
                <div style="border-top:2px solid #000; height:20px;"></div>
                Guard on Duty/Date&Time
              </div>

              <div>
                <div style="font-weight:bold; font-size:13px; margin-bottom:4px; min-height:18px;">${form.borrowerName || ""}</div>
                <div style="border-top:2px solid #000; height:20px;"></div>
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
                Guard on Duty/Date&Time
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
              {/* ==================== PRINT STYLES ==================== */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #gatepass, #gatepass * { visibility: visible; }
            #gatepass { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              padding: 12mm 10mm !important; 
              margin: 0 !important; 
              box-shadow: none;
            }
            img { max-width: 100% !important; height: auto !important; }
            table { 
              border-collapse: collapse !important; 
              width: 100% !important; 
            }
            th, td { 
              border: 2px solid black !important; 
              padding: 8px 6px !important; 
            }
          }
        `}
      </style>
      
        <div id="gatepass" ref={printRef} className="bg-white w-full max-w-4xl shadow-2xl p-8 font-sans text-sm">

         {/* ==================== OFFICIAL HEADER ==================== */}
          <div className="mb-8 border-b border-black pb-4">
            <img 
              src="/images/piwad-header.png" 
              alt="Pili Water District Header" 
              className="w-full h-auto"
            />
          </div>

          <h2 className="text-center font-bold text-2xl mb-8">GATE PASS</h2>

          <div className="mb-6">
            <div className="flex gap-8">
              <div>
                <span className="font-medium">Date:</span> 
                <span className="ml-2 border-b border-dotted border-gray-400 px-8">
                  {formatDateLong(new Date().toISOString())}
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
          <table className="w-full border-collapse border-2 border-black text-sm mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-2 border-black p-3 text-left w-20">QTY</th>
                <th className="border-2 border-black p-3 text-left w-24">UNIT</th>
                <th className="border-2 border-black p-3 text-left">ITEM/DESCRIPTION</th>
                <th className="border-2 border-black p-3 text-left w-40">LOCATION</th>
                <th className="border-2 border-black p-3 text-left w-40">DATE RETURNED</th>
                <th className="border-2 border-black p-3 text-left">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {request.items && request.items.length > 0 ? (
                request.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="border-2 border-black p-3 align-top text-center">{item.quantity || '—'}</td>
                    <td className="border-2 border-black p-3 align-top text-center">{item.unit || '—'}</td>
                    <td className="border-2 border-black p-3 align-top">{item.particulars || '—'}</td>
                    <td className="border-2 border-black p-3 align-top">{item.location || '—'}</td>
                    <td className="border-2 border-black p-3 align-top">
                      <input
                        type="text"
                        value={form.returnDate ? formatDateLong(form.returnDate) : ""}
                        onFocus={(e: any) => { e.target.type = "date"; }}
                        onBlur={(e: any) => { e.target.type = "text"; }}
                        onInput={(e: any) => handleChange("returnDate", e.currentTarget.value)}
                        className="border px-1 w-full text-center"
                      />
                    </td>
                    <td className="border-2 border-black p-3 align-top text-xs">{item.remarks || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="border-2 border-black p-8 text-center text-gray-400">
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
<div className="flex justify-between items-end mt-16 text-xs">

  {/* Guard on Duty */}
  <div className="w-[30%] flex flex-col text-center">
    <div className="mb-6"></div>

    <div className="w-full border-b-2 border-black mb-2"></div>

    <p className="font-medium">Guard on Duty/Date&Time</p>
  </div>

  {/* Borrower */}
  <div className="w-[30%] flex flex-col text-center">
    <div className="mb-6"></div>

    <div className="w-full border-b-2 border-black mb-2"></div>

    <p className="font-medium">Borrower's Name & Signature</p>
  </div>

  {/* Issued By */}
  <div className="w-[30%] flex flex-col text-center">
    <p className="font-medium relative -top-9">Issued By:</p>
    <p className="font-bold text-base mb-1">SHIELA V. BERSOLA</p>

    <div className="w-full border-b-2 border-black mb-2"></div>

    <p className="text-[10px] font-medium">
      Admin./General Services Chief B
    </p>
  </div>

</div>

          {/* ==================== OFFICIAL FOOTER ==================== */}
          <div className="mt-12 pt-6">
            <img 
              src="/images/A4 portrait footer.png" 
              alt="Pili Water District Footer" 
              className="w-full h-auto"
            />
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