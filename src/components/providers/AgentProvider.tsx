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
    { id: 'founder-ops', name: 'Founder Ops', status: 'online', description: 'Orchestrating company operations' },
    { id: 'growth-lead', name: 'Growth Lead', status: 'online', description: 'Managing marketing campaigns' },
    { id: 'dev-rel', name: 'DevRel', status: 'busy', description: 'Engaging with developer community' },
    { id: 'support-bot', name: 'Support Bot', status: 'offline', description: 'Handling customer tickets' },
];

export function AgentProvider({ children }: { children: ReactNode }) {
    const [activeAgentId, setActiveAgentId] = useState('founder-ops');
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
