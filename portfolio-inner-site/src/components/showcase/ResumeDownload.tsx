import React from 'react';
import printer from '../../assets/resume/printer.gif';
import portfolio from '../../portfolio.config.json';

export interface ResumeDownloadProps {
    altText?: string;
}

const ResumeDownload: React.FC<ResumeDownloadProps> = ({ altText }) => {
    const cv = portfolio.profile.cv;
    if (!cv) return null;
    const href = cv.startsWith('/') ? process.env.PUBLIC_URL + cv : cv;

    return (
        <div style={styles.resumeContainer}>
            <img style={styles.resumePrinter} alt="" src={printer} />
            <div style={styles.resumeContainerText}>
                <h3>{altText || 'Looking for my resume?'}</h3>
                <a href={href} download>
                    <p>Click here to download it!</p>
                </a>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    resumeContainer: {
        display: 'flex',
        backgroundColor: 'white',
        padding: 12,
        boxSizing: 'border-box',
        border: '2px solid black',
        borderLeftWidth: 0,
        borderRightWidth: 0,
        width: '100%',
        alignItems: 'center',
    },
    resumeContainerText: { display: 'flex', flexDirection: 'column', minWidth: 0 },
    resumePrinter: { width: 56, height: 48, paddingRight: 24, flexShrink: 0, boxSizing: 'content-box' },
};

export default ResumeDownload;
