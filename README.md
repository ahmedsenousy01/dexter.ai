# 🤖 Dexter AI - Your AI-Powered Cybersecurity Assistant

## 🌟 Overview

Dexter is an AI-powered cybersecurity assistant designed to help security engineers automate workflows, analyze data, and enhance security operations seamlessly. Unlike traditional AI models that require extensive fine-tuning, Dexter provides built-in **workflows** that integrate directly with sensitive company data, leveraging tools like **LangChain** and **LangGraph** for secure and efficient processing.

## ✨ Features

- 🧠 **AI-Powered Security Assistance** - Get real-time insights and recommendations
- 🔄 **Workflows Automation** - Execute complex security operations without manual intervention
- 🔒 **Data Processing** - Securely analyze sensitive company data without the need for extensive fine-tuning
- 🔌 **Integration with Existing Tools** - Supports APIs, logs, and databases for a seamless experience
- 👨‍💻 **Built by Security Engineers, for Security Engineers**

## 🤔 Why Dexter?

While tools like ChatGPT provide general-purpose AI capabilities, Dexter is tailored specifically for cybersecurity professionals, offering:

1. 🛡️ **Enhanced Security Workflows** - Execute predefined or custom workflows without exposing sensitive data
2. 🔗 **Seamless Enterprise Integration** - Easily integrates with existing security infrastructure
3. ⚡ **Minimal Setup & Customization** - No need to fine-tune models; just set up workflows and start using

## 🚀 Getting Started

### System Requirements

- Ubuntu/WSL2 environment
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/ahmedsenousy01/dexter.ai.git
cd dexter.ai

# Make the setup script executable
chmod +x setup.sh

# Run the setup script (this will install all dependencies)
./setup.sh
```

The setup script will automatically install and configure:

- 🐍 Python (via UV)
- 📦 Node.js (via NVM)
- 📥 pnpm (package manager)
- 🔧 All project dependencies

### Project Structure

The project consists of three main components:

- 🌐 Web Frontend (Next.js)
- 🖥️ Server Backend (Hono)
- 🤖 AI Agent (LangGraph)

### Running the Project

Once everything is installed, you can start all components with a single command:

```bash
pnpm start:all
```

This will concurrently run:

- The Next.js frontend
- The Hono backend server
- The LangGraph AI agent

## 🗺️ Roadmap

- [ ] Implement core security workflows
- [ ] Develop UI/UX for seamless interaction
- [ ] Improve AI model accuracy with more security-specific datasets
- [ ] Beta testing with security professionals

---

**🛡️ Dexter - Built by Security Engineers, for Security Engineers.**
