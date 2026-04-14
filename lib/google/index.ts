// Barrel export for Google integration
export {
    getConsentUrl,
    exchangeCode,
    isGoogleConnected,
    disconnectGoogle,
} from './oauth';

export {
    listEvents,
    findFreeSlots,
    createEvent,
    type CalendarEvent,
    type FreeSlot,
} from './calendar';

export {
    listMessages,
    readMessage,
    createDraft,
    sendDraft,
    sendEmail,
    type GmailMessage,
    type DraftResult,
    type SendResult,
} from './gmail';
