import React from 'react';
import Window from '../os/Window';
import Wordle from '../wordle/Wordle';
import portfolio from '../../portfolio.config.json';

export interface HenordleAppProps extends WindowAppProps {}

const HenordleApp: React.FC<HenordleAppProps> = (props) => {
    // Fit the initial window inside the available desktop, leaving room for the
    // taskbar. The game content remains scrollable on very short screens.
    const width = Math.max(280, Math.min(600, window.innerWidth - 24));
    const height = Math.max(220, Math.min(660, window.innerHeight - 64));
    const left = Math.max(8, Math.min(300, window.innerWidth - width - 8));
    return (
        <Window
            top={20}
            left={left}
            width={width}
            height={height}
            windowBarIcon="windowGameIcon"
            windowTitle="Pixel Word"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`© ${new Date().getFullYear()} ${portfolio.profile.name}`}
        >
            <div className="site-page">
                <Wordle isForeground={props.isForeground} />
            </div>
        </Window>
    );
};

export default HenordleApp;
