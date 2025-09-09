import { ChartColumnIcon, ClipboardClockIcon, FileTextIcon, MapPinCheckIcon, UsersIcon, FileBarChartIcon } from "lucide-react";
import type { ReactNode } from "preact/compat";
import { Link } from "wouter-preact";

export default function Home() {
    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <HomeCard href="/request-form">
                        <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <FileTextIcon className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-800 group-hover:text-blue-700">
                                    Request Form
                                </h2>
                                <p className="text-slate-600 group-hover:text-slate-700">
                                    Create a new vehicle service request
                                </p>
                            </div>
                        </div>
                    </HomeCard>
                    <HomeCard href="/requests">
                        <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-300 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                    <ClipboardClockIcon className="w-8 h-8 text-amber-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-800 group-hover:text-amber-700">
                                    Requests
                                </h2>
                                <p className="text-slate-600 group-hover:text-slate-700">
                                    View and manage your service requests
                                </p>
                            </div>
                        </div>
                    </HomeCard>
                    <HomeCard href="/trips">
                        <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-green-300 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                    <MapPinCheckIcon className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-800 group-hover:text-green-700">
                                    Approved Trips
                                </h2>
                                <p className="text-slate-600 group-hover:text-slate-700">
                                    Track your approved vehicle trips
                                </p>
                            </div>
                        </div>
                    </HomeCard>
                    <HomeCard href="/analytics">
                        <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                    <ChartColumnIcon className="w-8 h-8 text-purple-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-800 group-hover:text-purple-700">
                                    Data & Analytics
                                </h2>
                                <p className="text-slate-600 group-hover:text-slate-700">
                                    Analyze vehicle usage data
                                </p>
                                <div className="flex gap-2">
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                        Admin Only
                                    </span>
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        </div>
                    </HomeCard>
                    <div className="group cursor-not-allowed opacity-60">
                        <div className=" bg-white hover:bg-slate-50 border border-slate-200  p-8 rounded-xl shadow-sm transition-all duration-300 transform ">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center  transition-colors">
                                    <UsersIcon className="w-8 h-8 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-800 ">
                                    Management
                                </h2>
                                <p className="text-slate-600 ">
                                    Manage drivers, vehicles & availability
                                </p>
                                <div className="flex gap-2">
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                        Admin Only
                                    </span>
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="group cursor-not-allowed opacity-60">
                        <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <FileBarChartIcon className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-slate-800">
                                    Reports
                                </h2>
                                <p className="text-slate-600">
                                    Generate detailed service reports
                                </p>
                                <div className="flex gap-2">
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                        Admin Only
                                    </span>
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface HomeCardProps {
    children?: ReactNode
    href: string
}

function HomeCard({ children, href }: HomeCardProps) {
    return (
        <Link href={href}>
            {children}
        </Link>
    )
}