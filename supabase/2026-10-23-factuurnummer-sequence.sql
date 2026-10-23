-- Factuurnummers uit één teller (23 oktober 2026).
--
-- De routes telden tot nu toe zelf de facturen van dit jaar en deden er één
-- bij. Twee betalingen in dezelfde seconde kregen daardoor hetzelfde nummer,
-- en na het verwijderen van een factuur werd een nummer opnieuw uitgegeven.
-- Een sequence geeft elk nummer precies één keer uit.
--
-- Bewuste keuze: één doorlopende teller, niet per jaar opnieuw vanaf 001.
-- Het jaartal in het nummer blijft (SY-2027-012), alleen het volgnummer loopt
-- door. Dat is eenvoudiger en kan nooit botsen; een gat of een sprong in de
-- nummering is voor de boekhouding geen probleem, een dubbel nummer wel.
-- De opmaak blijft precies zoals hij was: SY-<jaar>-<nummer, minstens drie
-- cijfers>.
--
-- Draai dit één keer in de Supabase SQL editor.

create sequence if not exists public.factuurnummer_seq;

-- Doorgaan na het hoogste nummer dat er al is, over alle jaren heen. Het
-- volgende nummer wordt max + 1; zonder facturen begint hij bij 001.
select setval(
  'public.factuurnummer_seq',
  coalesce(
    (
      select max((regexp_match(invoice_number, '(\d+)$'))[1]::integer)
      from public.invoices
      where invoice_number ~ '^SY-\d{4}-\d+$'
    ),
    0
  ) + 1,
  false
);

-- Het volgende nummer, bijvoorbeeld SY-2026-007
create or replace function public.volgend_factuurnummer()
returns text
language sql
security definer
set search_path = public
as $$
  select 'SY-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.factuurnummer_seq')::text, 3, '0');
$$;

-- Alleen de server (service role) mag nummers uitgeven
revoke all on function public.volgend_factuurnummer() from public;
revoke all on function public.volgend_factuurnummer() from anon;
revoke all on function public.volgend_factuurnummer() from authenticated;
grant execute on function public.volgend_factuurnummer() to service_role;
