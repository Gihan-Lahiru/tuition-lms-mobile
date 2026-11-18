export function getBackendOrigin() {
  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('172.');
    if (isLocal) {
      return 'http://localhost:5001';
    }
  }
  return (
    import.meta.env.VITE_BACKEND_ORIGIN ||
    'https://tutionproject-backendv2-qpji.vercel.app'
  ).replace(/\/api\/?$/, '');
}

export function resolveAvatarUrl(userOrUrl) {
  if (!userOrUrl) return '';
  const raw =
    typeof userOrUrl === 'string'
      ? userOrUrl
      : userOrUrl?.profilePicture ||
        userOrUrl?.profile_picture ||
        userOrUrl?.avatar ||
        userOrUrl?.photoUrl ||
        userOrUrl?.image;

  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().replace(/\\/g, '/');
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const base = getBackendOrigin();
  return trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/${trimmed}`;
}
