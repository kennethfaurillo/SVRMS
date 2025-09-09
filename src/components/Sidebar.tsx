import { ChartColumnIcon, CircleQuestionMarkIcon, ClipboardClockIcon, FileTextIcon, HomeIcon, MapPinCheckIcon, UserIcon } from 'lucide-react'
import React, { type ReactNode } from 'react'
import { Link, useRoute } from 'wouter-preact'
import { useAuth } from '../contexts/AuthContext'

const sidebarItems = [
    {
        label: 'Request Form',
        path: '/request-form',
        icon: <FileTextIcon stroke={'white'} size={20} />,
    },
    {
        label: 'Requests',
        path: '/requests',
        icon: <ClipboardClockIcon stroke={'white'} size={20} />,
    },
    {
        label: 'Approved Trips',
        path: '/trips',
        icon: <MapPinCheckIcon stroke={'white'} size={20} />,
    },
    {
        label: 'Analytics',
        path: '/analytics',
        icon: <ChartColumnIcon stroke={'white'} size={20} />,
    }
] as const

interface SidebarProps {
}

export default function Sidebar({ }: SidebarProps) {
    return (
        <aside className='relative w-50 sm:min-w-50 min-h-dvh flex-col align-middle bg-blue-600'>
            <div className='font- font-medium p-3 border-b text-white border-blue-700'>
                <Link href='/' aria-label="Go to Homepage" className={(active) => active ? 'font-bold' : 'font-medium'}>
                    <div className={`flex gap-x-2`}>
                        <HomeIcon size={24} stroke='white' /> Home
                    </div>
                </Link>
            </div>
            <nav>
                <ul>
                    {sidebarItems.map((sidebarItem) =>
                        <li key={sidebarItem.label}>
                            <SidebarItem label={sidebarItem.label}
                                path={sidebarItem.path}
                                icon={sidebarItem.icon} />
                        </li>
                    )}
                </ul>
            </nav>
            <div className='absolute w-full bottom-0'>
                <SidebarUser />
            </div>
        </aside>
    )
}

type SidebarItemLabel = typeof sidebarItems[number]['label']
type SidebarItemPath = typeof sidebarItems[number]['path']

interface SidebarItemProps {
    label: SidebarItemLabel,
    path: SidebarItemPath,
    onClick?: React.MouseEventHandler<HTMLButtonElement>,
    icon?: React.JSX.Element,
}

function SidebarItem({ label, path, onClick, icon }: SidebarItemProps) {
    const [isActive] = useRoute(path)
    return (
        <Link href={path} className={`w-full flex align-middle items-center gap-x-1 sm:gap-x-3 p-2 sm:p-3 my-1.5 sm:my-1 cursor-pointer ${isActive ? 'bg-blue-800 font-semibold border-blue-900' : 'hover:bg-blue-500 font-light'}`}
            onClick={onClick} aria-current={isActive ? "page" : undefined}>
            {icon ? icon : <CircleQuestionMarkIcon size={20} />}
            <div className={`text-xs sm:text-sm font- overflow-hide text-white `}>
                {label}
            </div>

        </Link>
    )
}

interface SidebarItemGroup {
    children?: ReactNode,
    label?: string,
}

function SidebarItemGroup({ children, label = 'Placeholder Group' }: SidebarItemGroup) {
    return (
        <div className='w-full'>
            <div className='mt-2 mx-3 text-gray-300 text-xs font-sans uppercase'>
                {label}
            </div>
            {children}
        </div>
    )
}


function SidebarUser() {
    const { user, isAdmin } = useAuth();
    const username = user?.displayName ?? user?.email
    return (
        <div className='border-t border-white/40 p-3 flex gap-x-2 bg-blue-700'>
            <UserIcon className='bg-blue-400 rounded-full p-1.5' stroke='white' size={32} />
            <div>
                <div className='text-sm font-sans font-medium text-white'>
                    {username}
                </div>
                <div className='text-xs text-gray-300/80'>
                    {isAdmin ? 'Admin' : 'User'}
                </div>
            </div>
        </div>
    )
}