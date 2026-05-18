import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Operator Uplift — AI that runs on your terms. Drafts your replies, schedules your meetings, waits for your tap before sending anything.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    backgroundColor: '#FAFAF9',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
            >
                {/* Left column — brand + headline + subhead */}
                <div
                    style={{
                        flex: '1 1 58%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '0 30px 0 64px',
                    }}
                >
                    {/* Logo */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: 36,
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                background: '#F97316',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 900,
                                fontSize: 24,
                                letterSpacing: -1,
                                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.25)',
                            }}
                        >
                            OU
                        </div>
                    </div>

                    {/* AI ASSISTANT eyebrow */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 28,
                        }}
                    >
                        <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 5, background: '#F97316' }} />
                        <div
                            style={{
                                color: '#737373',
                                fontSize: 14,
                                fontWeight: 700,
                                letterSpacing: 3,
                                textTransform: 'uppercase',
                            }}
                        >
                            AI Assistant
                        </div>
                    </div>

                    {/* Headline */}
                    <div
                        style={{
                            color: '#0A0A0A',
                            fontSize: 78,
                            fontWeight: 800,
                            letterSpacing: -3.5,
                            lineHeight: 0.95,
                            marginBottom: 30,
                            display: 'flex',
                        }}
                    >
                        AI that runs on your terms.
                    </div>

                    {/* Subhead */}
                    <div
                        style={{
                            color: '#525252',
                            fontSize: 20,
                            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                            lineHeight: 1.45,
                            maxWidth: 540,
                            display: 'flex',
                        }}
                    >
                        Operator Uplift drafts your replies, schedules your meetings, and waits for your tap before sending anything.
                    </div>
                </div>

                {/* Right column — iMessage-style approval card */}
                <div
                    style={{
                        flex: '1 1 42%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 64px 0 16px',
                    }}
                >
                    <div
                        style={{
                            width: 400,
                            background: 'white',
                            borderRadius: 22,
                            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                            padding: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        {/* Inbox header */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 6,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 5, background: '#22C55E' }} />
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: 2,
                                        color: '#525252',
                                    }}
                                >
                                    INBOX
                                </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#737373', display: 'flex' }}>Operator</div>
                        </div>

                        {/* User: "Reply to mom..." */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div
                                style={{
                                    maxWidth: 280,
                                    background: '#3B82F6',
                                    color: 'white',
                                    padding: '8px 14px',
                                    borderRadius: 18,
                                    fontSize: 15,
                                    lineHeight: 1.3,
                                    display: 'flex',
                                }}
                            >
                                Reply to mom about Sunday dinner
                            </div>
                        </div>

                        {/* Bot drafts reply */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <div
                                style={{
                                    maxWidth: 290,
                                    background: '#F4F4F5',
                                    color: '#1A1A1A',
                                    padding: '8px 14px',
                                    borderRadius: 18,
                                    fontSize: 14,
                                    lineHeight: 1.35,
                                    display: 'flex',
                                }}
                            >
                                "Sounds great mom, see you at 6. Want me to bring dessert?", send?
                            </div>
                        </div>

                        {/* TAP TO APPROVE pill */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 2 }}>
                            <div
                                style={{
                                    padding: '4px 10px',
                                    border: '1.5px solid #F97316',
                                    background: 'rgba(249, 115, 22, 0.06)',
                                    borderRadius: 6,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: 2,
                                    color: '#F97316',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                }}
                            >
                                Tap to Approve
                            </div>
                        </div>

                        {/* User: "send it" */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                            <div
                                style={{
                                    background: '#3B82F6',
                                    color: 'white',
                                    padding: '8px 14px',
                                    borderRadius: 18,
                                    fontSize: 15,
                                    display: 'flex',
                                }}
                            >
                                send it
                            </div>
                        </div>

                        {/* Bot: receipt confirmation */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <div
                                style={{
                                    background: '#F4F4F5',
                                    color: '#1A1A1A',
                                    padding: '8px 14px',
                                    borderRadius: 18,
                                    fontSize: 15,
                                    display: 'flex',
                                }}
                            >
                                Sent. Receipt saved.
                            </div>
                        </div>

                        {/* Receipt pill */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 2 }}>
                            <div
                                style={{
                                    padding: '4px 10px',
                                    border: '1.5px solid rgba(34, 197, 94, 0.45)',
                                    background: 'rgba(34, 197, 94, 0.08)',
                                    borderRadius: 6,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: 2,
                                    color: '#16A34A',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                }}
                            >
                                Sent, Receipt #042
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size },
    );
}
