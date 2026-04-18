-- Role-based RLS helpers + reference data policies

-- Helper function: check if current user has a role in profiles
CREATE OR REPLACE FUNCTION public.has_role(required_role "Role")
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.has_role('SUPERADMIN') OR public.has_role('ADMIN_CENTER');
$$;

-- Reference tables: readable by authenticated; writable only by admins
ALTER TABLE public."Center" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MachineType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Machine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GymClass" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassCenterSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Exercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Meal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MembershipPlan" ENABLE ROW LEVEL SECURITY;

-- Centers
DROP POLICY IF EXISTS "Center: read (authenticated)" ON public."Center";
CREATE POLICY "Center: read (authenticated)"
ON public."Center" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Center: write (admin)" ON public."Center";
CREATE POLICY "Center: write (admin)"
ON public."Center" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- MachineType
DROP POLICY IF EXISTS "MachineType: read (authenticated)" ON public."MachineType";
CREATE POLICY "MachineType: read (authenticated)"
ON public."MachineType" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "MachineType: write (admin)" ON public."MachineType";
CREATE POLICY "MachineType: write (admin)"
ON public."MachineType" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Machine
DROP POLICY IF EXISTS "Machine: read (authenticated)" ON public."Machine";
CREATE POLICY "Machine: read (authenticated)"
ON public."Machine" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Machine: write (admin)" ON public."Machine";
CREATE POLICY "Machine: write (admin)"
ON public."Machine" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- GymClass
DROP POLICY IF EXISTS "GymClass: read (authenticated)" ON public."GymClass";
CREATE POLICY "GymClass: read (authenticated)"
ON public."GymClass" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "GymClass: write (admin)" ON public."GymClass";
CREATE POLICY "GymClass: write (admin)"
ON public."GymClass" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ClassCenterSchedule
DROP POLICY IF EXISTS "ClassCenterSchedule: read (authenticated)" ON public."ClassCenterSchedule";
CREATE POLICY "ClassCenterSchedule: read (authenticated)"
ON public."ClassCenterSchedule" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "ClassCenterSchedule: write (admin)" ON public."ClassCenterSchedule";
CREATE POLICY "ClassCenterSchedule: write (admin)"
ON public."ClassCenterSchedule" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Exercise
DROP POLICY IF EXISTS "Exercise: read (authenticated)" ON public."Exercise";
CREATE POLICY "Exercise: read (authenticated)"
ON public."Exercise" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Exercise: write (admin)" ON public."Exercise";
CREATE POLICY "Exercise: write (admin)"
ON public."Exercise" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Meal
DROP POLICY IF EXISTS "Meal: read (authenticated)" ON public."Meal";
CREATE POLICY "Meal: read (authenticated)"
ON public."Meal" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Meal: write (admin)" ON public."Meal";
CREATE POLICY "Meal: write (admin)"
ON public."Meal" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- MembershipPlan
DROP POLICY IF EXISTS "MembershipPlan: read (authenticated)" ON public."MembershipPlan";
CREATE POLICY "MembershipPlan: read (authenticated)"
ON public."MembershipPlan" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "MembershipPlan: write (admin)" ON public."MembershipPlan";
CREATE POLICY "MembershipPlan: write (admin)"
ON public."MembershipPlan" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

