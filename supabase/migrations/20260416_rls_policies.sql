-- Habilitar RLS en las tablas principales
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Diet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExerciseLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Políticas para "User"
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
ON "User" FOR SELECT 
USING (auth.uid()::text = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
ON "User" FOR UPDATE 
USING (auth.uid()::text = id);

-- Políticas para "Workout"
CREATE POLICY "Los usuarios pueden ver sus propias rutinas" 
ON "Workout" FOR SELECT 
USING (auth.uid()::text = "userId");

CREATE POLICY "Los usuarios pueden crear sus propias rutinas" 
ON "Workout" FOR INSERT 
WITH CHECK (auth.uid()::text = "userId");

-- Políticas para "Diet"
CREATE POLICY "Los usuarios pueden ver sus propias dietas" 
ON "Diet" FOR SELECT 
USING (auth.uid()::text = "userId");

-- Políticas para "ExerciseLog"
CREATE POLICY "Los usuarios pueden ver sus logs" 
ON "ExerciseLog" FOR SELECT 
USING (auth.uid()::text = "userId");

CREATE POLICY "Los usuarios pueden insertar sus logs" 
ON "ExerciseLog" FOR INSERT 
WITH CHECK (auth.uid()::text = "userId");
