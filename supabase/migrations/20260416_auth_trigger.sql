-- Función que se ejecuta cada vez que un usuario se registra en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, status, role)
  VALUES (
    new.id::text, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'Nuevo Usuario'), 
    'ACTIVE', 
    'USER'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para automatizar la creación del perfil público
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
