import { initBotId } from 'botid/client/core';

// Only the contact page submits to this endpoint. Basic mode has no Deep Analysis charge.
if (/^\/(?:zh\/)?contact\/?$/.test(window.location.pathname)) {
  initBotId({ protect: [{ path: '/api/enquiries', method: 'POST', advancedOptions: { checkLevel: 'basic' } }] });
}
