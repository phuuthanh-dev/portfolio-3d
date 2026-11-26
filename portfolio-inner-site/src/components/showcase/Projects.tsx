import React, { useEffect, useState } from 'react';
import portfolio from '../../portfolio.config.json';
import ResumeDownload from './ResumeDownload';
import './Projects.css';

type ProjectLink = { label: string; url: string; enabled?: boolean };
type Project = {
    name: string;
    category: string;
    image?: string | null;
    // Optional animated GIF, MP4, or WebM. `image` remains the still fallback.
    media?: string | null;
    introduction: string[];
    caption: string;
    details: string[];
    links: ProjectLink[];
};

const publicAsset = (src: string) => src.startsWith('/') ? process.env.PUBLIC_URL + src : src;

export const ProjectMedia: React.FC<{ project: Project; figure: number }> = ({ project, figure }) => {
    const [failed, setFailed] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(() =>
        typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    useEffect(() => {
        if (typeof window.matchMedia !== 'function') return;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
        setReducedMotion(query.matches);
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);
    useEffect(() => setFailed(false), [project.media]);

    const still = project.image ? publicAsset(project.image) : undefined;
    const animation = !failed && !reducedMotion && project.media ? publicAsset(project.media) : undefined;
    const isVideo = animation && /\.(mp4|webm)(?:[?#].*)?$/i.test(animation);

    return (
        <div className="captioned-image project-media">
            {animation && isVideo ? (
                <video src={animation} poster={still} autoPlay muted loop playsInline preload="metadata"
                    aria-label={`${project.name} project preview`} onError={() => setFailed(true)} />
            ) : animation || still ? (
                <img src={animation || still} loading="lazy" alt={`${project.name} project preview`}
                    onError={animation ? () => setFailed(true) : undefined} />
            ) : (
                <p>Project preview is unavailable.</p>
            )}
            <p style={{ width: '80%' }}><sub><b>Figure {figure}:</b> {project.caption}</sub></p>
        </div>
    );
};

const Projects: React.FC = () => {
    const items = portfolio.projects as Project[];
    let figureNumber = 0;

    return (
        <div className="site-page-content">
            <h1>Software</h1>
            <h3>Projects</h3>
            <br />
            <p>Below are some of the projects I have worked on, from web platforms to workflow automation.</p>
            <br />
            <ResumeDownload />
            {items.length === 0 ? <p>Projects will be updated soon.</p> : items.map((project) => {
                const figure = (project.image || project.media) ? ++figureNumber : null;
                const links = project.links.filter((link) => link.enabled !== false);
                return (
                    <article className="text-block project-entry" key={project.name}>
                        <h2>{project.name}</h2>
                        <h3>{project.category}</h3>
                        <br />
                        {project.introduction.map((paragraph) => <React.Fragment key={paragraph}><p>{paragraph}</p><br /></React.Fragment>)}
                        {figure && <ProjectMedia project={project} figure={figure} />}
                        {project.details.map((paragraph) => <React.Fragment key={paragraph}><p>{paragraph}</p><br /></React.Fragment>)}
                        {links.length > 0 && (
                            <>
                                <h3>Links:</h3>
                                <ul>
                                    {links.map((link) => (
                                        <li key={link.url}>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                <p><b>[{link.label === 'Source' ? 'GitHub' : 'Website'}]</b> - {link.label === 'Source' ? `${project.name} source` : `${project.name} website`}</p>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </article>
                );
            })}
        </div>
    );
};

export default Projects;
