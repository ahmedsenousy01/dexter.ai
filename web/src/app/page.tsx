"use client"

import { useState } from "react"
import { DexterChat } from "@/components/dexter-chat"
import { DexterHub } from "@/components/dexter-hub"
import { Header } from "@/components/header"

export default function Home() {
  const [activeModule, setActiveModule] = useState<"chat" | "hub">("chat")

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="flex-1 overflow-hidden">{activeModule === "chat" ? <DexterChat /> : <DexterHub />}</main>
    </div>
  )
}

