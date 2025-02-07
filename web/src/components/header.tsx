import { Shield } from "lucide-react"

interface HeaderProps {
  activeModule: "chat" | "hub"
  setActiveModule: (module: "chat" | "hub") => void
}

export function Header({ activeModule, setActiveModule }: HeaderProps) {
  return (
    <header className="bg-card p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Shield className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-primary">Dexter.ai</h1>
      </div>
      <nav>
        <ul className="flex space-x-4">
          <li>
            <button
              onClick={() => setActiveModule("chat")}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeModule === "chat"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              Dexter Chat
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveModule("hub")}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeModule === "hub"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              Dexter Hub
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}

