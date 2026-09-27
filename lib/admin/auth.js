// HTTP Basic Auth for admin

export function sjekKAuth(req, passord) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) return false;

  const credentials = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
  const [_, pass] = credentials.split(':');
  return pass === passord;
}
