import { useEffect, useState } from "preact/hooks";
import { doc, getDoc } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";

export default function PrintBorrowersForm({ id }: { id: string }) {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const snap = await getDoc(doc(firebaseFirestore, "borrowRequests", id));
            if (snap.exists()) {
                setData(snap.data());
            }
        };

        fetchData();
    }, [id]);

    if (!data) return <p className="p-6 text-center">Loading form...</p>;

    // Helper: Convert date to "April 17" format (no year)
    const formatShortDate = (dateStr: string): string => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
        });
    };

    // Smart Period Display (same as table)
    const getIntendedPeriod = (): string => {
        if (data.startDate && data.returnDate) {
            const startFormatted = formatShortDate(data.startDate);
            const endFormatted = formatShortDate(data.returnDate);
            if (startFormatted && endFormatted) {
                return `${startFormatted} - ${endFormatted}`;
            }
        }

        // Fallback to period field
        if (data.period && data.period.toString().trim() !== "") {
            return data.period.toString().trim();
        }

        return "—";
    };

    return (
        <div className="p-8 text-sm max-w-4xl mx-auto bg-white" id="printable-form">

            {/* ==================== HEADER WITH LOGO ==================== */}
            <div className="flex items-start justify-between border-b border-black pb-6 mb-8">
                
                {/* Left Side - Logo + Agency Name */}
                <div className="flex items-center gap-4">
                    <img 
                        src="PIWAD-LOGO.png" 
                        alt="PILI WATER DISTRICT Logo" 
                        className="w-24 h-24 object-contain"
                    />
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider text-black">
                            PILI WATER DISTRICT
                        </h1>
                        <p className="text-sm text-black mt-1">
                            Sta. Rita Agro Industrial Park<br />
                            San Jose, Pili, Camarines Sur
                        </p>
                    </div>
                </div>

                {/* Right Side - Form Info */}
                <div className="text-right text-xs leading-tight">
                    <p className="italic">Form No. AGSD-PGSD 002</p>
                    <p className="italic">August 2017</p>
                    <p className="italic">Rev. 00</p>
                </div>
            </div>

            {/* ==================== TITLE ==================== */}
            <h1 className="text-center font-bold text-xl mb-8 tracking-wider">
                EQUIPMENT / MATERIAL BORROWERS FORM
            </h1>

            {/* ==================== HEADER INFO ==================== */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
                <div>
                    <label className="block font-medium text-xs mb-1">Request No:</label>
                    <div className="border border-gray-700 p-2 bg-gray-50 min-h-[38px]">
                        {data.requestNo || '—'}
                    </div>
                </div>

                <div>
                    <label className="block font-medium text-xs mb-1">Date:</label>
                    <div className="border border-gray-700 p-2 bg-gray-50 min-h-[38px]">
                        {data.date || '—'}
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block font-medium text-xs mb-1">Name of Requestor:</label>
                    <div className="border border-gray-700 p-2 bg-gray-50 min-h-[38px]">
                        {data.requestor || '—'}
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block font-medium text-xs mb-1">Purpose:</label>
                    <div className="border border-gray-700 p-2 bg-gray-50 min-h-[38px]">
                        {data.purpose || '—'}
                    </div>
                </div>
            </div>

            {/* ==================== INTENDED PERIOD (Fixed: April 17 - April 29) ==================== */}
            <div className="mb-8">
                <label className="block font-medium text-xs mb-1">Intended Period of Use:</label>
                <div className="border border-gray-700 p-3 bg-gray-50 min-h-[42px] font-medium">
                    {getIntendedPeriod()}
                </div>
            </div>

            {/* ==================== ITEMS TABLE ==================== */}
            <h2 className="font-bold mb-3 text-base">
                Checklist of Requested Items (To be filled by Guard on Duty)
            </h2>

            <table className="w-full border border-black text-sm mb-8">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-3 text-left font-semibold">Particulars</th>
                        <th className="border border-black p-3 text-center font-semibold w-28">Quantity</th>
                        <th className="border border-black p-3 text-left font-semibold">Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items?.map((item: any, index: number) => (
                        <tr key={index}>
                            <td className="border border-black p-3 align-top">{item.particulars || '—'}</td>
                            <td className="border border-black p-3 text-center align-top">{item.quantity || '—'}</td>
                            <td className="border border-black p-3 align-top">{item.remarks || '—'}</td>
                        </tr>
                    )) || (
                        <tr>
                            <td colSpan={3} className="border border-black p-8 text-center text-gray-500">
                                No items found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* ==================== TERMS ==================== */}
            <div className="text-xs leading-relaxed space-y-2 mb-10">
                <p>1. This certifies that I have received the above listed Equipment/Materials completely and in good order.</p>
                <p>2. In case of damage or loss, I shall be responsible for its repair or loss.</p>
            </div>

            {/* ==================== SIGNATURES ==================== */}
            <div className="grid grid-cols-3 gap-8 text-xs text-center mt-12">
                <div>
                    <div className="border-b border-black w-full mb-1 h-8"></div>
                    <p className="font-medium">Borrower's Name &amp; Signature</p>
                </div>
                <div>
                    <div className="border-b border-black w-full mb-1 h-8"></div>
                    <p className="font-medium">Items Checked By</p>
                </div>
                <div>
                    <div className="border-b border-black w-full mb-1 h-8"></div>
                    <p className="font-medium">Recommending Approval</p>
                </div>
            </div>

            {/* ==================== RETURN SECTION ==================== */}
            <div className="mt-16">
                <h2 className="font-bold text-base mb-4">
                    To be accomplished upon return of equipment
                </h2>
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <label className="block text-xs font-medium mb-1">Date Returned:</label>
                        <div className="border border-gray-700 p-3 min-h-[42px]"></div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Received By:</label>
                        <div className="border border-gray-700 p-3 min-h-[42px]"></div>
                    </div>
                </div>
            </div>

        </div>
    );
}