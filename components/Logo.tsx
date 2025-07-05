

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Logo: React.FC = () => {
    const { theme } = useTheme();

    const handleLogoClick = () => {
        // This reloads the page and clears selection state, effectively returning to the home screen.
        window.location.href = window.location.pathname;
    };
    
    const textColorClass = theme === 'light' ? 'text-neutral-800' : 'text-neutral-200';

    return (
        <div onClick={handleLogoClick} className="flex items-center justify-center cursor-pointer">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tighter">
                <span className={textColorClass}>MReser</span>
                <span className="text-secondary -ms-1">v</span>
            </div>
        </div>
    );
};

export default Logo;