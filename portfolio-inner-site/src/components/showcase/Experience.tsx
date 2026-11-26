import React from 'react';
import portfolio from '../../portfolio.config.json';
import ResumeDownload from './ResumeDownload';

type ExperienceItem = {
    company: string;
    role: string;
    period: string;
    location?: string;
    summary: string;
    highlights: string[];
};

const Experience: React.FC = () => {
    const items = portfolio.profile.experience as ExperienceItem[];

    return (
        <div className="site-page-content">
            <h1>Experience</h1>
            <br />
            <p>Here is a look at the teams I have worked with and the software I have helped build.</p>
            <br />
            <ResumeDownload />
            {items.length === 0 ? <p>Experience details will be updated soon.</p> : items.map((item) => (
                <article className="text-block" key={`${item.company}-${item.period}`}>
                    <h2>{item.company}</h2>
                    <h3>{item.role}</h3>
                    <p><b>{item.period}</b>{item.location && <> · {item.location}</>}</p>
                    <br />
                    <p>{item.summary}</p>
                    <br />
                    <ul>
                        {item.highlights.map((highlight) => <li key={highlight}><p>{highlight}</p></li>)}
                    </ul>
                </article>
            ))}
        </div>
    );
};

export default Experience;
