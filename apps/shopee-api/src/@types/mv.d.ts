declare module 'mv' {
  function mv(
    source: string,
    dest: string,
    callback: (err: Error | null) => void
  ): void
  function mv(
    source: string,
    dest: string,
    options: { mkdirp?: boolean; clobber?: boolean },
    callback: (err: Error | null) => void
  ): void
  export = mv
}

