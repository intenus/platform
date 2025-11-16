/**
 * Server Integration Tools (STUB)
 * These tools will be implemented later for server communication
 */

/**
 * Submit intent to server (NOT IMPLEMENTED)
 */
export const submitIntentTool = {
  description: 'Submit generated intent to Intenus server for solver execution',
  parameters: {
    type: 'object' as const,
    properties: {
      intent: {
        type: 'object' as const,
        description: 'The IGS Intent object to submit',
      },
    },
    required: ['intent'],
  },
  execute: async ({ intent }: { intent: any }) => {
    throw new Error('NOT IMPLEMENTED: Server integration pending. Intent generation successful but submission not available yet.');
  },
};

/**
 * Store intent locally (NOT IMPLEMENTED)
 */
export const storeIntentTool = {
  description: 'Store intent in local database or cache',
  parameters: {
    type: 'object' as const,
    properties: {
      intent: {
        type: 'object' as const,
        description: 'The IGS Intent object to store',
      },
      user_address: {
        type: 'string' as const,
        description: 'User address',
      },
    },
    required: ['intent', 'user_address'],
  },
  execute: async ({ intent, user_address }: { intent: any; user_address: string }) => {
    throw new Error('NOT IMPLEMENTED: Local storage integration pending.');
  },
};

/**
 * Get intent status (NOT IMPLEMENTED)
 */
export const getIntentStatusTool = {
  description: 'Check the status of a submitted intent',
  parameters: {
    type: 'object' as const,
    properties: {
      intent_id: {
        type: 'string' as const,
        description: 'Intent ID to check',
      },
    },
    required: ['intent_id'],
  },
  execute: async ({ intent_id }: { intent_id: string }) => {
    throw new Error('NOT IMPLEMENTED: Status checking not available yet.');
  },
};
