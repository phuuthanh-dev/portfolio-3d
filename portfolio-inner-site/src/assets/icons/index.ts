import React from 'react';

import windowResize from './windowResize.png';
import maximize from './maximize.png';
import minimize from './minimize.png';
import computerBig from './computerBig.png';
import computerSmall from './computerSmall.png';
import myComputer from './myComputer.png';
import showcaseIcon from './showcaseTp.svg';
import doomIcon from './doomIcon.png';
import thanhdleIcon from './thanhdleIcon.svg';
import terminalIcon from './terminalIcon.svg';
import projectsExplorerIcon from './projectsExplorerIcon.svg';
import myPortfolioIcon from './showcaseTp.svg';
import vietAuctionIcon from './vietAuctionIcon.svg';
import fluxoraIcon from './fluxora-brand.svg';
import rrLivestreamIcon from './rr-brand.png';
import credits from './credits.png';
import volumeOn from './volumeOn.png';
import volumeOff from './volumeOff.png';
import trailIcon from './trailIcon.png';
import windowGameIcon from './windowGameIcon.png';
import windowExplorerIcon from './windowExplorerIcon.png';
import windowsStartIcon from './windowsStartIcon.png';
import scrabbleIcon from './scrabbleIcon.png';
import close from './close.png';

const icons = {
    windowResize: windowResize,
    maximize: maximize,
    minimize: minimize,
    computerBig: computerBig,
    computerSmall: computerSmall,
    myComputer: myComputer,
    showcaseIcon: showcaseIcon,
    doomIcon: doomIcon,
    volumeOn: volumeOn,
    volumeOff: volumeOff,
    credits: credits,
    scrabbleIcon: scrabbleIcon,
    thanhdleIcon: thanhdleIcon,
    terminalIcon: terminalIcon,
    projectsExplorerIcon: projectsExplorerIcon,
    myPortfolioIcon: myPortfolioIcon,
    vietAuctionIcon: vietAuctionIcon,
    fluxoraIcon: fluxoraIcon,
    rrLivestreamIcon: rrLivestreamIcon,
    close: close,
    windowGameIcon: windowGameIcon,
    windowExplorerIcon: windowExplorerIcon,
    windowsStartIcon: windowsStartIcon,
    trailIcon: trailIcon,
};

export type IconName = keyof typeof icons;

const getIconByName = (
    iconName: IconName
    // @ts-ignore
): React.FC<React.SVGAttributes<SVGElement>> => icons[iconName];

export default getIconByName;
