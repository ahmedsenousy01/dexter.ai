"use client";

import { useState } from "react";
import { Send, Search, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: number;
  text: string;
  sender: "user" | "dexter";
  timestamp: Date;
}

interface ChatThread {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

export function DexterChat() {
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([
    {
      id: 1,
      name: "Understanding Next.js Client Components",
      lastMessage: "Here's what you need to know about Client Components...",
      timestamp: new Date(),
      messages: [],
    },
    {
      id: 2,
      name: "Security Analysis Report",
      lastMessage: "I've analyzed your system security...",
      timestamp: new Date(Date.now() - 3600000),
      messages: [],
    },
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeChat =
    chatThreads.find((thread) => thread.id === activeChatId) || chatThreads[0];

  const handleSendMessage = () => {
    if (input.trim()) {
      const newMessage = {
        id: Date.now(),
        text: input,
        sender: "user" as const,
        timestamp: new Date(),
      };
      setChatThreads((threads) =>
        threads.map((thread) =>
          thread.id === activeChatId
            ? {
                ...thread,
                lastMessage: input,
                timestamp: new Date(),
                messages: [...thread.messages, newMessage],
              }
            : thread,
        ),
      );
      setInput("");
      // Simulate Dexter's response
      setTimeout(() => {
        setChatThreads((threads) =>
          threads.map((thread) =>
            thread.id === activeChatId
              ? {
                  ...thread,
                  lastMessage: "I'm processing your request...",
                  timestamp: new Date(),
                  messages: [
                    ...thread.messages,
                    {
                      id: Date.now(),
                      text: "I'm processing your request. Please wait a moment.",
                      sender: "dexter",
                      timestamp: new Date(),
                    },
                  ],
                }
              : thread,
          ),
        );
      }, 1000);
    }
  };

  const createNewChat = () => {
    const newChatId = Math.max(...chatThreads.map((thread) => thread.id)) + 1;
    const newThread = {
      id: newChatId,
      name: `New Chat ${newChatId}`,
      lastMessage: "Start a new conversation...",
      timestamp: new Date(),
      messages: [],
    };
    setChatThreads([newThread, ...chatThreads]);
    setActiveChatId(newChatId);
  };

  const filteredThreads = chatThreads.filter((thread) =>
    thread.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full bg-white">
      <div className="flex w-80 flex-col border-r border-gray-100">
        <div className="border-b border-gray-100 p-3">
          <div className="flex items-center justify-between">
            {!isSearchOpen ? (
              <>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-gray-900"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-gray-900"
                    onClick={createNewChat}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex w-full items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search chats"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-none bg-gray-50 text-sm"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-900"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveChatId(thread.id)}
              className={`flex w-full items-start space-x-3 p-3 hover:bg-gray-50 ${
                activeChatId === thread.id ? "bg-gray-50" : ""
              }`}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src="/placeholder-dexter.jpg" />
                <AvatarFallback>D</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-baseline justify-between">
                  <h3 className="truncate text-sm font-medium">
                    {thread.name}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {thread.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="truncate text-sm text-gray-500">
                  {thread.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">User Name</p>
              <p className="truncate text-xs text-gray-500">user@example.com</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-dexter.jpg" />
              <AvatarFallback>D</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-medium">{activeChat.name}</h2>
              <p className="text-xs text-gray-500">Active now</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {activeChat.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-[70%] items-end space-x-2 ${
                  message.sender === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={
                      message.sender === "user"
                        ? "/placeholder-user.jpg"
                        : "/placeholder-dexter.jpg"
                    }
                    alt={message.sender === "user" ? "User" : "Dexter"}
                  />
                  <AvatarFallback>
                    {message.sender === "user" ? "U" : "D"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div
                    className={`rounded-2xl p-3 ${
                      message.sender === "user"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.text}
                  </div>
                  <span className="mt-1 text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 p-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 border-none bg-gray-50 text-sm"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="rounded-full bg-black text-white hover:bg-black/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
