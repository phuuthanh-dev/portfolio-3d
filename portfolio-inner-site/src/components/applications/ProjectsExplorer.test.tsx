import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectsExplorer from './ProjectsExplorer';

jest.mock('../os/Window', () => ({ children }: { children: React.ReactNode }) => <div>{children}</div>);

test('opens project details, respects disabled links, and switches previews', () => {
    render(<ProjectsExplorer onClose={jest.fn()} onInteract={jest.fn()} onMinimize={jest.fn()} />);
    expect(screen.getByRole('heading', { name: 'VietAuction' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /live product/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /source/i })).toHaveAttribute('href', 'https://github.com/vietauction');

    fireEvent.click(screen.getByRole('button', { name: /fluxora/i }));
    expect(screen.getByRole('heading', { name: 'Fluxora' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fluxora/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: /live product/i })).toHaveAttribute('href', 'https://fluxora.io.vn/');
    expect(screen.getByRole('img', { name: /fluxora project preview/i })).toHaveAttribute('src', '/portfolio-projects/fluxora-demo.gif');

    fireEvent.click(screen.getByRole('button', { name: /my-portfolio/i }));
    expect(screen.getByRole('heading', { name: 'my-portfolio' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /live product/i })).toHaveAttribute('href', 'https://phuuthanh-portfolio.vercel.app/');
    expect(screen.getByRole('link', { name: /source/i })).toHaveAttribute('href', 'https://github.com/phuuthanh-dev/my-portfolio');
});
