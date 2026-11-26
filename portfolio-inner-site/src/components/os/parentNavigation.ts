/** Accept scene navigation only from the actual embedding page and its origin. */
export function parentNavigationPath(
    event: MessageEvent,
    referrer: string,
    parentWindow: Window,
    currentWindow: Window
): '/about' | '/experience' | null {
    if (parentWindow === currentWindow || event.source !== parentWindow || !referrer) return null;
    let parentOrigin: string;
    try {
        parentOrigin = new URL(referrer).origin;
    } catch {
        return null;
    }
    if (event.origin !== parentOrigin || event.data?.type !== 'portfolio:navigate') return null;
    return event.data.path === '/about' || event.data.path === '/experience' ? event.data.path : null;
}
