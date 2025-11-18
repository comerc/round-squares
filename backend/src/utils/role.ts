export function determineRole(username: string): 'admin' | 'survivor' | 'nikita' {
  if (username.toLowerCase() === 'admin') {
    return 'admin'
  }
  if (username === 'Никита') {
    return 'nikita'
  }
  return 'survivor'
}
