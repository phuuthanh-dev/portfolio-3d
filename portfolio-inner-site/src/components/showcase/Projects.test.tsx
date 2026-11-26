import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProjectMedia } from './Projects';

const base = {
    name: 'Demo', category: 'Web', image: '/still.png', caption: 'A preview',
    introduction: [], details: [], links: [],
};

const motionPreference = (reduced: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: () => ({ matches: reduced, addEventListener: jest.fn(), removeEventListener: jest.fn() }),
    });
};

test('shows an animated image and falls back to the still image when loading fails', () => {
    motionPreference(false);
    render(<ProjectMedia project={{ ...base, media: '/demo.gif' }} figure={1} />);
    const image = screen.getByRole('img', { name: 'Demo project preview' });
    expect(image).toHaveAttribute('src', '/demo.gif');
    fireEvent.error(image);
    expect(image).toHaveAttribute('src', '/still.png');
});

test('plays a muted looping video when motion is allowed', () => {
    motionPreference(false);
    const { container } = render(<ProjectMedia project={{ ...base, media: '/demo.mp4' }} figure={1} />);
    const video = container.querySelector('video');
    expect(video).toHaveAttribute('src', '/demo.mp4');
    expect(video).toHaveAttribute('poster', '/still.png');
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(video?.muted).toBe(true);
});

test('shows the still poster when reduced motion is preferred', () => {
    motionPreference(true);
    const { container } = render(<ProjectMedia project={{ ...base, media: '/demo.webm' }} figure={1} />);
    expect(container.querySelector('video')).toBeNull();
    expect(screen.getByRole('img', { name: 'Demo project preview' })).toHaveAttribute('src', '/still.png');
});
