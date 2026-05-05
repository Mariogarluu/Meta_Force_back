-- Asegura que AiChatSession.updatedAt tenga un valor por defecto y deje de
-- romper inserts que no lo envien explicitamente.
ALTER TABLE public."AiChatSession"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
