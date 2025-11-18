import { getCookie, setCookie, removeCookie } from './cookies'

const AUTH_COOKIE_NAME = 'isAuthenticated'

export function isAuthenticated(): boolean {
  return getCookie(AUTH_COOKIE_NAME) === 'true'
}

export function setAuthenticated(value: boolean): void {
  if (value) {
    setCookie(AUTH_COOKIE_NAME, 'true')
  } else {
    removeCookie(AUTH_COOKIE_NAME)
  }
}
