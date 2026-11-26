import React, { useEffect, useState } from 'react';
import portfolio from '../../portfolio.config.json';
import Window from '../os/Window';
import './ProjectsExplorer.css';

type ProjectLink = { label: string; url: string; enabled?: boolean };
type Project = {
    name: string;
    category: string;
    description: string;
    image?: string | null;
    media?: string | null;
    caption?: string;
    introduction?: string[];
    details?: string[];
    links: ProjectLink[];
};

const myPortfolio = portfolio.desktopApps.myPortfolio;
const projects: Project[] = [
    ...portfolio.projects as Project[],
    {
        name: myPortfolio.name,
        category: myPortfolio.category,
        description: myPortfolio.description,
        image: myPortfolio.image,
        links: [
            { label: 'Live product', url: myPortfolio.website },
            { label: 'Source', url: myPortfolio.source },
        ],
    },
];
const asset = (src: string) => src.startsWith('/') ? process.env.PUBLIC_URL + src : src;

const ProjectsExplorer: React.FC<WindowAppProps> = ({ onClose, onInteract, onMinimize }) => {
    const [selected, setSelected] = useState(0);
    const [mediaFailed, setMediaFailed] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(() =>
        typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    useEffect(() => {
        if (typeof window.matchMedia !== 'function') return;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
        setReducedMotion(query.matches);
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    useEffect(() => setMediaFailed(false), [selected]);

    const project = projects[selected];
    const animation = project && !reducedMotion && !mediaFailed && project.media ? asset(project.media) : undefined;
    const still = project?.image ? asset(project.image) : undefined;
    const video = animation && /\.(mp4|webm)(?:[?#].*)?$/i.test(animation);
    const links = project?.links.filter(link => link.enabled !== false) || [];

    return (
        <Window
            top={24}
            left={Math.max(0, Math.min(72, window.innerWidth - 320))}
            width={Math.max(280, Math.min(940, window.innerWidth - 24))}
            height={Math.max(240, Math.min(700, window.innerHeight - 64))}
            windowTitle="Projects Explorer"
            windowBarIcon="windowExplorerIcon"
            closeWindow={onClose}
            onInteract={onInteract}
            minimizeWindow={onMinimize}
            bottomLeftText={`${projects.length} project${projects.length === 1 ? '' : 's'}`}
        >
            <div className="projects-explorer">
                <div className="projects-explorer-toolbar" aria-label="Projects Explorer location">
                    <span>Address</span><span className="projects-explorer-address">C:\Thanh\Projects</span>
                </div>
                <div className="projects-explorer-content">
                    <nav className="projects-explorer-list" aria-label="Choose a project">
                        <h2>My projects</h2>
                        {projects.map((item, index) => (
                            <button type="button" key={item.name} className="projects-explorer-item"
                                aria-pressed={index === selected} onClick={() => setSelected(index)}>
                                <span aria-hidden="true">▣</span><span>{item.name}</span>
                            </button>
                        ))}
                    </nav>
                    {project ? (
                        <article className="projects-explorer-detail" aria-labelledby="project-explorer-title">
                            <div className="projects-explorer-heading">
                                <span className="projects-explorer-label">PROJECT FILE</span>
                                <h1 id="project-explorer-title">{project.name}</h1>
                                <p>{project.category}</p>
                            </div>
                            <div className="projects-explorer-preview">
                                {video ? (
                                    <video src={animation} poster={still} autoPlay muted loop playsInline preload="metadata"
                                        aria-label={`${project.name} project preview`} onError={() => setMediaFailed(true)} />
                                ) : animation || still ? (
                                    <img src={animation || still} alt={`${project.name} project preview`}
                                        onError={animation ? () => setMediaFailed(true) : undefined} />
                                ) : <p>Preview coming soon.</p>}
                            </div>
                            {project.caption && <p className="projects-explorer-caption">{project.caption}</p>}
                            <h2>Overview</h2>
                            <p>{project.description}</p>
                            {project.introduction?.slice(0, 1).map(text => <p key={text}>{text}</p>)}
                            {project.details?.map(text => <p key={text}>{text}</p>)}
                            {links.length > 0 && <div className="projects-explorer-links" aria-label="Project links">
                                {links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}
                            </div>}
                        </article>
                    ) : <p className="projects-explorer-empty">Projects will be updated soon.</p>}
                </div>
            </div>
        </Window>
    );
};

export default ProjectsExplorer;
