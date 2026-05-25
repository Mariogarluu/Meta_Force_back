-- Crear buckets de almacenamiento
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('tickets', 'tickets', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acceso para profiles (Público para lectura, Autenticado para escritura)
CREATE POLICY "Avatar public access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'profiles' );

CREATE POLICY "Avatar upload access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );

CREATE POLICY "Avatar update access" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );

-- Configurar políticas de acceso para tickets
CREATE POLICY "Tickets access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'tickets' AND auth.role() = 'authenticated' );

CREATE POLICY "Tickets upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'tickets' AND auth.role() = 'authenticated' );
