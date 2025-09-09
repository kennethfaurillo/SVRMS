import { useState, type Dispatch, type StateUpdater } from "preact/hooks";

export default function useTheme() {
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode ? JSON.parse(savedMode) : false;
    });
    return ([darkMode, setDarkMode]) as [boolean, Dispatch<StateUpdater<boolean>>];
}
