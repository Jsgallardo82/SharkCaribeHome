-- Boletas generales de obsequio · invitación abierta
-- 63 personas. Silla: general. Sin monto.
-- Corre en dos pasos separados en el SQL Editor.
-- La fila de prueba (isa / 3333333 / ddddddd) no está incluida.
-- Tres correos se repiten (dos personas distintas cada uno):
--   trivas2405@gmail.com, mgrimaldoortiz@gmail.com, junny@memo.com.co
-- Luz Elena Vergara Niño aparece dos veces, con el mismo documento 45487451
-- y dos correos. Si el INSERT dice que el documento está repetido, avísame.

-- ############################################################
-- PASO 1 — crea los registros (Run solo esto)
-- ############################################################

INSERT INTO public.attendee_registrations (
  full_name, document_type, document_number, email, phone,
  profile, interest, seat_type, referral_source,
  status, amount_in_cents, payment_reference, payment_confirmation, reviewed_at,
  ticket_token
) VALUES
  ('Esther Sofia Ricardo Cuello', 'CC', '1102873538', 'productoszuvid03@gmail.com', '3113853591', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-001', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Tatiana Buendia Guerra', 'CC', '1118869031', 'tbuendia@sena.edu.co', '3118288155', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-002', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Fabián De Jesús Hernández Silvera', 'CC', '72020730', 'fjhernandez@sena.edu.co', '3005332217', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-003', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Diana Luz Rada Olivares', 'CC', '32832464', 'dlrada@sena.edu.co', '3014639988', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-004', 'OBSEQUIO', now(), gen_random_uuid()),
  ('EDWIN JOHAN HINESTROZA CASTRO', 'CC', '1129508180', 'edwin.hinestroza2023@gmail.com', '3046727247', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-005', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Jacqueline Racedo Camargo', 'CC', '32668183', 'jackieracedo@hotmail.com', '3017400921', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-006', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Cerlina Arteta', 'CC', '22510630', 'carteta@sena.edu.co', '3184113644', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-007', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Luis Carlos Rico Martinez', 'CC', '1082850442', 'lcricom@sena.edu.co', '3006612209', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-008', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Amanda Miguel Medina Hurtado', 'CC', '1044434917', 'amedinau@sena.edu.co', '3167750992', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-009', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Magali andrade rivaldo', 'CC', '32664560', 'mandrader@sena.edu.co', '301415092', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-010', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Lina paola sarmiento de las aguas', 'CC', '1044430500', 'lpsarmientod@sena.edu.co', '3186737910', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-011', 'OBSEQUIO', now(), gen_random_uuid()),
  ('David Alvarez', 'CC', '1129567170', 'alvarezmoralesdavid@gmail.com', '3128380795', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-012', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Nurgenis Márquez Castillo', 'CC', '22746835', 'nmarquezc@sena.edu.co', '3015897403', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-013', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Alvaro Enrique De Alba Del Valle', 'CC', '72152532', 'adealba@sena.edu.co', '3126648613', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-014', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Oreales Daza de la Barrera', 'CC', '42209765', 'odazab@sena.edu.co', '3012265046', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-015', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Luz Elena Vergara Niño', 'CC', '45487451', 'levergara@sena.edu.co', '3176681251', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-016', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Stephanie Yepes', 'CC', '55302825', 'stepyepes84@hotmail.com', '3006828589', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-017', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Martin Ochoa', 'CC', '8186451', 'ochoacroasdaile01@gmail.com', '3102807257', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-018', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Jennifer Lobelo', 'CC', '1140832638', 'informacion.jump@gmail.com', '3005550502', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-019', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Wilder De los reyes Libreros', 'CC', '72271125', 'wdelosreyes@atlantico.gov.co', '3006828587', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-020', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Sandra Liliana Pinto', 'CC', '60356189', 'salianacy@gmail.com', '3216876545', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-021', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Glidis Rodriguez Gonzalez', 'CC', '22673880', 'glidis2023@outlook.com', '3107079693', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-022', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Carla Josefina Barros Durán', 'CC', '57403003', 'jabonesartecaxis@gmail.com', '3164332250', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-023', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Carlos Vives García', 'CC', '72343905', 'carlosvivesgarcia@gmail.com', '3015017006', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-024', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Mayra Sayury García Duque', 'CC', '55304446', 'housetakehara@gmail.com', '3227934185', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-025', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Tirso Elias Andueza Paredes', 'CC', '72157291', 'tirsoandueza@gmail.com', '3156374552', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-026', 'OBSEQUIO', now(), gen_random_uuid()),
  ('ELIANA MARGARITA SOLANO COBA', 'CC', '32832574', 'wagon.tourism@outlook.com', '3005909989', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-027', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Brigitte Marcela Segura Noriega', 'CC', '1002014149', 'seb301697@gmail.com', '3011612385', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-028', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Dilia beatriz bray rubiano', 'CC', '32658739', 'avefenixdb@hotmail.com', '3107103025', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-029', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Maria Julia Ortega Heredia', 'CC', '22733012', 'bellezajet-set@hotmail.com', '3182379150', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-030', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Steffin Hernández Vásquez', 'CC', '1045723179', 'fundacionrubato@gmail.com', '3003596485', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-031', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Alfredo Reyes Aristizábal', 'CC', '1129569983', 'alfredogerencia@fundacionrubato.com', '3245311718', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-032', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Marío Francisco Mojica Restrepo', 'CC', '13746103', 'mariofmojica1@gmail.com', '3042282961', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-033', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Arely Esther De las salas torres', 'CC', '32695204', 'arelys-1011@hotmail.com', '3012056403', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-034', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Marlene Chávez Martinez', 'CC', '22502421', 'chavezmarlene332@gmail.com', '3008004342', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-035', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Jesús puello Argumedo', 'CC', '3727308', 'puello3088@gmail.com', '3023628028', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-036', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Yesenia Escorcia Gamarra', 'CC', '1140815785', 'ryescorciag2@gmail.com', '3002328120', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-037', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Kenderlys seni Polanco cortés', 'CC', '1126248716', 'kenderlyspolanco@gmail.com', '3106164691', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-038', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Viviana Nuñez', 'CC', '1140845973', 'viviana.nmendoza@gmail.com', '3205643000', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-039', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Maria Paz Rueda Rivas', 'CC', '1066299063', 'trivas2405@gmail.com', '3008097903', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-040', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Tatiana Rivas', 'CC', '1043018856', 'trivas2405@gmail.com', '3008097903', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-041', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Camila Fernanda Rojas Grimaldo', 'CC', '1092388629', 'mgrimaldoortiz@gmail.com', '3152326449', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-042', 'OBSEQUIO', now(), gen_random_uuid()),
  ('María Fernanda Grimaldo Ortiz', 'CC', '1090533063', 'mgrimaldoortiz@gmail.com', '3152326449', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-043', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Juan David Lewis villegas', 'CC', '1048084730', 'villegasgilviviana@gmail.com', '3046730678', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-044', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Maria Leandra Charris De La Hoz', 'CC', '1129524244', 'marialeandreacharris@gmail.com', '3117126564', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-045', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Mariana Martínez Espitia', 'CC', '1023085612', 'caro1151187@hotmail.com', '3104763623', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-046', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Luz Elena Vergara Niño', 'CC', '45487451', 'luzelenavergara_01@hotmail.com', '3176681251', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-047', 'OBSEQUIO', now(), gen_random_uuid()),
  ('CLAUDIA PATRICIA GÓMEZ MERCADO', 'CC', '22466837', 'ingclagomez@gmail.com', '3187075308', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-048', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Maria Paula cabarcas olivero', 'CC', '1050955845', 'mpaulacabarcas@gmail.com', '3207381973', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-049', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Shantal Guzmán Arce', 'CC', '1052701906', 'arceshantal765@gmail.com', '3011264226', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-050', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Samuel Esteban Orozco hoyos', 'CC', '1013016283', 'junny@memo.com.co', '3125111111', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-051', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Guillermo yuri Orozco levi', 'CC', '12552483', 'junny@memo.com.co', '3102109044', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-052', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Brianna Rojas', 'CC', '1084073458', 'barbysalome.25@icloud.com', '3243155288', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-053', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Tatiana Tovar', 'CC', '1129572278', 'tatianatovarc.tt@gmail.com', '3157907696', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-054', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Daniela Rivera Bustamante', 'CC', '55237815', 'mundotelecomunicaciines@gmail.com', '3228970475', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-055', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Mario Andrés Rueda Oyaga', 'CC', '1129582613', 'mariorueda11@gmail.com', '3006483016', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-056', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Catalina Rueda Rivera', 'CC', '1046729279', 'danriv@directvla.com.co', '3144117587', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-057', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Silvana Peñate', 'CC', '22494100', 'spenates@hotmail.com', '3044341350', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-058', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Alberto Thomas', 'CC', '72002090', 'mipublicidada2@gmail.com', '3044341350', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-059', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Daniel manzanera Salcedo', 'CC', '79948623', 'damanza2011@hotmail.com', '3125123149', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-060', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Alfonso José Calvo Velásquez', 'CC', '1140834558', 'acalvovelsquez@gmail.com', '3116613276', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-061', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Edgleana Jiménez', 'CC', '5474983', 'edgleanaj@gmail.com', '3004447940', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-062', 'OBSEQUIO', now(), gen_random_uuid()),
  ('Jesus Rodriguez', 'CC', '5241290', 'jrodriguez@elicogrp.com', '3235020674', 'publico_general', 'networking', 'general', 'recomendacion', 'pago', NULL, 'OBSEQUIO-GEN-063', 'OBSEQUIO', now(), gen_random_uuid());

SELECT count(*) AS creados
FROM public.attendee_registrations
WHERE payment_reference LIKE 'OBSEQUIO-GEN-%';

-- ############################################################
-- PASO 2 — envía las boletas (Run solo esto)
-- Pega el service_role (eyJ...) en LOS DOS sitios.
-- ############################################################

SELECT net.http_post(
  url := 'https://jcrjvtpylprlcvojxuvw.supabase.co/functions/v1/resend-ticket',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || 'PEGAR_SERVICE_ROLE_AQUI',
    'apikey', 'PEGAR_SERVICE_ROLE_AQUI'
  ),
  body := jsonb_build_object('attendeeId', id)
) AS request_id
FROM public.attendee_registrations
WHERE payment_reference LIKE 'OBSEQUIO-GEN-%'
  AND status = 'pago';

-- ############################################################
-- PASO 3 — espera unos segundos y revisa
-- Esperado: un 200 con "ok": true por cada boleta
-- ############################################################

SELECT status_code, count(*) AS cantidad
FROM net._http_response
WHERE created > now() - interval '15 minutes'
GROUP BY status_code
ORDER BY status_code;

-- ############################################################
-- PASO 4 — reenvía 4 pendientes por ejecución, una por una
-- El editor de Supabase corta si la consulta dura demasiado.
-- Espera la respuesta de cada envío antes del siguiente.
-- No vuelvas a correr el paso 2. Pega el service_role en LOS DOS sitios.
-- Corre este bloque unas 8 veces, hasta que el conteo de abajo dé 0.
-- ############################################################

DO $$
DECLARE
  pendiente uuid;
  req_id bigint;
  intento int;
  listo int;
BEGIN
  FOR pendiente IN
    SELECT a.id
    FROM public.attendee_registrations a
    WHERE a.payment_reference LIKE 'OBSEQUIO-GEN-%'
      AND a.status = 'pago'
      AND NOT EXISTS (
        SELECT 1
        FROM net._http_response resp
        WHERE resp.status_code = 200
          AND resp.created > now() - interval '12 hours'
          AND resp.content::text LIKE '%"ticket_number":' || a.ticket_number::text || '}%'
      )
    ORDER BY a.ticket_number
    LIMIT 4
  LOOP
    req_id := net.http_post(
      url := 'https://jcrjvtpylprlcvojxuvw.supabase.co/functions/v1/resend-ticket',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'PEGAR_SERVICE_ROLE_AQUI',
        'apikey', 'PEGAR_SERVICE_ROLE_AQUI'
      ),
      body := jsonb_build_object('attendeeId', pendiente)
    );

    listo := NULL;
    FOR intento IN 1..8 LOOP
      PERFORM pg_sleep(0.4);
      SELECT resp.status_code INTO listo
      FROM net._http_response resp
      WHERE resp.id = req_id;
      EXIT WHEN listo IS NOT NULL;
    END LOOP;

    PERFORM pg_sleep(0.3);
  END LOOP;
END $$;

-- ############################################################
-- PASO 5 — verificación. No envía correos.
-- Un 200 significa que Resend aceptó el envío de esa boleta.
-- ############################################################

SELECT
  count(*) AS personas,
  count(*) FILTER (WHERE enviado.ticket_number IS NOT NULL) AS con_200,
  count(*) FILTER (WHERE enviado.ticket_number IS NULL) AS sin_200
FROM public.attendee_registrations a
LEFT JOIN LATERAL (
  SELECT a.ticket_number
  FROM net._http_response resp
  WHERE resp.status_code = 200
    AND resp.created > now() - interval '12 hours'
    AND resp.content::text LIKE '%"ticket_number":' || a.ticket_number::text || '}%'
  LIMIT 1
) enviado ON true
WHERE a.payment_reference LIKE 'OBSEQUIO-GEN-%'
  AND a.status = 'pago';

SELECT
  a.ticket_number,
  a.full_name,
  a.email,
  CASE WHEN enviado.ticket_number IS NULL THEN 'sin 200' ELSE 'aceptado' END AS envio,
  enviado.enviado_en
FROM public.attendee_registrations a
LEFT JOIN LATERAL (
  SELECT a.ticket_number, resp.created AS enviado_en
  FROM net._http_response resp
  WHERE resp.status_code = 200
    AND resp.created > now() - interval '12 hours'
    AND resp.content::text LIKE '%"ticket_number":' || a.ticket_number::text || '}%'
  ORDER BY resp.created
  LIMIT 1
) enviado ON true
WHERE a.payment_reference LIKE 'OBSEQUIO-GEN-%'
  AND a.status = 'pago'
ORDER BY a.ticket_number;
