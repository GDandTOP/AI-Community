export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built with{' '}
          <a
            href="https://react.dev"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            React
          </a>
          ,{' '}
          <a
            href="https://firebase.google.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Firebase
          </a>
          {' '}and{' '}
          <a
            href="https://ui.shadcn.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            shadcn/ui
          </a>
          .
        </p>
        <p className="text-center text-sm text-muted-foreground md:text-right">
          © 2025 AI Community. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

