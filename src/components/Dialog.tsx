interface DialogProps {
    children?: preact.JSX.Element
    open: boolean
    onClose: () => void
    bgType?: 'dark' | 'blur'
}

export default function Dialog({ children, open = true, onClose, bgType = 'dark' }: DialogProps) {
    return open && (
        <>
            <div className={`fixed  inset-0 h-full bg w-full pointer-cursor ${bgType === 'dark' ? 'bg-black/70' : 'backdrop-blur-xs'}`}
                onClick={onClose} />
            <div className={`fixed  inset-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center`}>
                {children}
            </div>
        </>
    )
}
