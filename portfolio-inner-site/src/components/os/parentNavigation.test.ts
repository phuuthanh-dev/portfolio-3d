import { parentNavigationPath } from './parentNavigation';

test('only accepts supported routes from the actual embedded parent and referrer origin', () => {
    const parent = {} as Window;
    const child = {} as Window;
    const base = { source: parent, origin: 'https://scene.example', data: { type: 'portfolio:navigate', path: '/about' } } as MessageEvent;
    expect(parentNavigationPath(base, 'https://scene.example/page', parent, child)).toBe('/about');
    expect(parentNavigationPath({ ...base, data: { type: 'portfolio:navigate', path: '/experience' } } as MessageEvent, 'https://scene.example/', parent, child)).toBe('/experience');
    expect(parentNavigationPath({ ...base, origin: 'https://evil.example' } as MessageEvent, 'https://scene.example/', parent, child)).toBeNull();
    expect(parentNavigationPath({ ...base, source: child } as MessageEvent, 'https://scene.example/', parent, child)).toBeNull();
    expect(parentNavigationPath({ ...base, data: { type: 'portfolio:navigate', path: '/contact' } } as MessageEvent, 'https://scene.example/', parent, child)).toBeNull();
    expect(parentNavigationPath(base, '', parent, child)).toBeNull();
    expect(parentNavigationPath({ ...base, source: child } as MessageEvent, 'https://scene.example/', child, child)).toBeNull();
});
