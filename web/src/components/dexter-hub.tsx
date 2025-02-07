"use client"

import { useState } from "react"
import { Send, Search, MoreVertical, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: number
  text: string
  sender: string
  mentions: string[]
  timestamp: Date
}

const USERS = [
  { id: 1, name: "Alice Smith", role: "Security Analyst", status: "online" },
  { id: 2, name: "Bob Johnson", role: "Developer", status: "offline" },
  { id: 3, name: "Charlie Brown", role: "System Admin", status: "online" },
  { id: 4, name: "Dexter AI", role: "AI Assistant", status: "online" },
]

export function DexterHub() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSendMessage = () => {
    if (input.trim()) {
      const mentions = input.match(/@(\w+)/g) || []
      setMessages([
        ...messages,
        {
          id: Date.now(),
          text: input,
          sender: "You",
          mentions: mentions.map((m) => m.slice(1)),
          timestamp: new Date(),
        },
      ])
      setInput("")
      // Simulate Dexter's response if mentioned
      if (mentions.includes("@dexter")) {
        setTimeout(() => {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: Date.now(),
              text: "I'm here to help! What can I do for you?",
              sender: "Dexter",
              mentions: [],
              timestamp: new Date(),
            },
          ])
        }, 1000)
      }
    }
  }

  const filteredUsers = USERS.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex h-full bg-white">
      <div className="w-80 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search team members"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 border-none text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-3 flex items-center space-x-3 hover:bg-gray-50">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`/placeholder-${user.name.split(" ")[0].toLowerCase()}.jpg`} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                {user.status === "online" && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{user.name}</h3>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User Name</p>
              <p className="text-xs text-gray-500 truncate">user@example.com</p>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-400">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5" />
            <h2 className="text-sm font-medium">Team Chat</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {USERS.filter((u) => u.status === "online").length} online
          </Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={`/placeholder-${message.sender.toLowerCase()}.jpg`} alt={message.sender} />
                <AvatarFallback>{message.sender[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2">
                  <span className="text-sm font-medium">{message.sender}</span>
                  <span className="text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-900">
                  {message.text.split(" ").map((word, index) => {
                    if (word.startsWith("@")) {
                      const mention = word.slice(1)
                      return (
                        <span
                          key={index}
                          className={`font-medium ${
                            mention.toLowerCase() === "dexter" ? "text-blue-600" : "text-blue-600"
                          }`}
                        >
                          {word}{" "}
                        </span>
                      )
                    }
                    return word + " "
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type a message... (Use @dexter to mention)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-gray-50 border-none text-sm"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="bg-black text-white hover:bg-black/90 rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

