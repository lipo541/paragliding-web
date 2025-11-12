export default function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <button className="px-4 py-2 text-sm font-medium text-foreground border border-foreground/20 rounded-md hover:border-foreground/40 hover:bg-foreground/5 transition-all">
        Sign In
      </button>
      <button className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
        Sign Up
      </button>
    </div>
  );
}
