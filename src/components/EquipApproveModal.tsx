import { useEffect } from "preact/hooks";

interface EquipApproveModalProps {
    isOpen: boolean;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;

    onConfirm: () => void;
    onCancel: () => void;

    children?: preact.ComponentChildren;
}

export default function EquipApproveModal({
    isOpen,
    title = "Confirm Action",
    description = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    loading = false,
    onConfirm,
    onCancel,
    children,
}: EquipApproveModalProps) {

    // ESC key close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };

        if (isOpen) window.addEventListener("keydown", handleEsc);

        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={onCancel}
        >
            <div
                className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title */}
                <h2 className="text-lg font-bold text-gray-800 mb-3">
                    {title}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">
                    {description}
                </p>

                {/* Extra dynamic content */}
                {children && (
                    <div className="mb-4 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
                        {children}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-5">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm rounded-md bg-gray-500 text-white hover:bg-gray-600 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}