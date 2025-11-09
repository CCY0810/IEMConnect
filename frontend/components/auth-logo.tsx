export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary">
        <span className="text-lg font-bold text-primary-foreground">IE</span>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">IEM Connect</h1>
        <p className="text-sm text-muted-foreground">Professional Platform</p>
      </div>
    </div>
  )
}
