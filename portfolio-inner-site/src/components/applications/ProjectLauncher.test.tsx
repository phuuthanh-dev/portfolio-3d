import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MyPortfolio, VietAuction, Fluxora, RrLivestream } from './ProjectLauncher';

// The launcher decides what to embed; window dragging and resizing are separate concerns.
jest.mock('../os/Window', () => ({ children }: { children: React.ReactNode }) => <div>{children}</div>);

const controls = { onClose: jest.fn(), onInteract: jest.fn(), onMinimize: jest.fn() };

test.each([
    ['my-portfolio', MyPortfolio, 'https://phuuthanh-portfolio.vercel.app/'],
    ['fluxora', Fluxora, 'https://fluxora.io.vn/'],
    ['rr-livestream', RrLivestream, 'https://rr-livestream.vercel.app'],
] as const)('%s displays its configured live site without extra links', (name, Component, url) => {
    render(<Component {...controls} />);
    expect(screen.getByTitle(`${name} live website`)).toHaveAttribute('src', url);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/if the site cannot be displayed/i)).not.toBeInTheDocument();
});

test('VietAuction shows a waiting message without exposing its disabled demo', () => {
    render(<VietAuction {...controls} />);
    expect(screen.queryByTitle('vietauction live website')).not.toBeInTheDocument();
    expect(screen.getByText(/live demo is not available yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
