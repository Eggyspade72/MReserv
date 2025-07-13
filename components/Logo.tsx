

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
    logoUrl?: string | null;
    useTextLogo?: boolean;
}

const Logo: React.FC<LogoProps> = ({ logoUrl, useTextLogo = false }) => {
    const { theme } = useTheme();

    const handleLogoClick = () => {
        window.location.href = window.location.pathname;
    };
    
    const textColorClass = theme === 'light' ? 'text-neutral-800' : 'text-neutral-200';

    if (logoUrl && !useTextLogo) {
        return (
            <div onClick={handleLogoClick} className="cursor-pointer">
                <img src={logoUrl} alt="Business Logo" className="h-10 max-w-[150px] object-contain" />
            </div>
        );
    }

    return (
        <div onClick={handleLogoClick} className="flex items-center justify-center cursor-pointer group">
            <div className={`font-extrabold tracking-tighter ${useTextLogo ? 'text-sm' : 'text-2xl sm:text-3xl'}`}>
                <span className={textColorClass}>MReser</span>
                <span className="text-secondary -ms-1">v</span>
            </div>
        </div>
    );
};

export default Logo;