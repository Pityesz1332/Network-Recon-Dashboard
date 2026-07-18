function tag(scope: string): string {
  return `[${scope}]`
}

export const logger = {
  info(scope: string, ...args: unknown[]): void {
    console.log(tag(scope), ...args)
  },
  warn(scope: string, ...args: unknown[]): void {
    console.warn(tag(scope), ...args)
  },
  error(scope: string, ...args: unknown[]): void {
    console.error(tag(scope), ...args)
  }
}
