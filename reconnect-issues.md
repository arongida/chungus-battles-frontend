1. client.reconnect(token, RootSchema) — the second argument tells the SDK the schema class.
  This adds &skipHandshake=1 to the WebSocket URL so the server skips the schema handshake
  phase. This is likely needed for production but requires the client schema to exactly match
  the server schema for decoding.
  2. Schema field order — Colyseus encodes fields by index (declaration order). The frontend
  PlayerSchema and DraftState have fields in a different order than the backend, which causes
  decode corruption when skipHandshake=1 is used. These need to be synced exactly.
  3. Root cause of the production silence — in production, onStateChange and all messages go
  silent after JOIN_ROOM. The new onLeave/onDrop listeners we added (which are now reverted)
  would tell you whether the WebSocket is dropping or just not delivering messages. That
  diagnostic is worth re-adding when you approach this fresh.