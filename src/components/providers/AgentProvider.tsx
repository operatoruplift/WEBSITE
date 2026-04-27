"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Agent {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'busy';
    description?: string;
}

interface AgentContextType {
    activeAgentId: string;
    activeAgent: Agent | null;
    setActiveAgent: (id: string) => void;
    agents: Agent[];
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const MOCK_AGENTS: Agent[] = [
    { id: 'inbox', name: 'Inbox helper', status: 'online', description: 'Drafts replies and clears your inbox' },
    { id: 'calendar', name: 'Calendar helper', status: 'online', description: 'Schedules meetings and manages your day' },
    { id: 'research', name: 'Research helper', status: 'online', description: 'Finds and summarizes information' },
    { id: 'reminders', name: 'Reminders', status: 'online', description: 'Morning briefings and follow-ups' },
];

export function AgentProvider({ children }: { children: ReactNode }) {
    const [activeAgentId, setActiveAgentId] = useState('inbox');
    const activeAgent = MOCK_AGENTS.find(a => a.id === activeAgentId) || MOCK_AGENTS[0];
    return (
        <AgentContext.Provider value={{ activeAgentId, activeAgent, setActiveAgent: setActiveAgentId, agents: MOCK_AGENTS }}>
            {children}
        </AgentContext.Provider>
    );
}

export function useAgent() {
    const context = useContext(AgentContext);
    if (context === undefined) throw new Error('useAgent must be used within an AgentProvider');
    return context;
}
