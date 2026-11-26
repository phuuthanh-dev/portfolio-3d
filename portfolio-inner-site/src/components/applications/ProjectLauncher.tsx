import React from 'react';
import portfolio from '../../portfolio.config.json';
import Window from '../os/Window';

type ProjectLink = { label: string; url: string; enabled?: boolean };
type Project = { name: string; description: string; links: ProjectLink[] };
type LauncherId = 'myPortfolio' | 'vietAuction' | 'fluxora' | 'rrLivestream';

const projectNames: Partial<Record<LauncherId, string>> = {
    vietAuction: 'VietAuction',
    fluxora: 'Fluxora',
    rrLivestream: 'Private Operations Platform',
};

const launcherNames: Record<LauncherId, string> = {
    myPortfolio: 'my-portfolio',
    vietAuction: 'vietauction',
    fluxora: 'fluxora',
    rrLivestream: 'rr-livestream',
};

type Props = WindowAppProps & { projectId: LauncherId };

const ProjectLauncher: React.FC<Props> = ({ projectId, onClose, onInteract, onMinimize }) => {
    const project = (portfolio.projects as Project[]).find(item => item.name === projectNames[projectId]);
    const isMyPortfolio = projectId === 'myPortfolio';
    const title = launcherNames[projectId];
    const liveUrl = isMyPortfolio
        ? portfolio.desktopApps.myPortfolio.website
        : project?.links.find(link => link.label === 'Live product' && link.enabled !== false)?.url;
    return (
        <Window
            top={40}
            left={Math.max(0, Math.min(120, window.innerWidth - 320))}
            width={Math.max(280, Math.min(900, window.innerWidth - 24))}
            height={Math.max(240, Math.min(720, window.innerHeight - 64))}
            windowTitle={title}
            windowBarIcon="windowExplorerIcon"
            closeWindow={onClose}
            onInteract={onInteract}
            minimizeWindow={onMinimize}
            bottomLeftText={`© ${new Date().getFullYear()} ${portfolio.profile.name}`}
        >
            <div style={styles.page}>
                {liveUrl ? (
                    <iframe title={`${title} live website`} src={liveUrl} style={styles.frame} referrerPolicy="strict-origin-when-cross-origin" />
                ) : (
                    <div style={styles.unavailable}>
                        <h2>{title}</h2>
                        <p>The live demo is not available yet. It can be added to the portfolio configuration when ready.</p>
                    </div>
                )}
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    page: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', backgroundColor: '#fff' },
    frame: { display: 'block', flex: 1, minHeight: 0, width: '100%', border: 0, backgroundColor: '#fff' },
    unavailable: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, padding: 24 },
};

export const MyPortfolio: React.FC<WindowAppProps> = props => <ProjectLauncher {...props} projectId="myPortfolio" />;
export const VietAuction: React.FC<WindowAppProps> = props => <ProjectLauncher {...props} projectId="vietAuction" />;
export const Fluxora: React.FC<WindowAppProps> = props => <ProjectLauncher {...props} projectId="fluxora" />;
export const RrLivestream: React.FC<WindowAppProps> = props => <ProjectLauncher {...props} projectId="rrLivestream" />;
