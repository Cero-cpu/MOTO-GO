-- Datos de ejemplo de Motogo (generado por scripts/generate-seed.mjs)

insert into public.categories (id, label, sort_order) values
  ('passola', 'Passolas & Scooters', 0),
  ('cg', 'Utilitarias / CG', 1),
  ('cross', 'Enduro / Cross', 2),
  ('deportivas', 'Sport / Deportivas', 3);

insert into public.branches (id, name, short_name, full_name, tag, description, sort_order) values
  ('la-vega', 'La Vega', 'La Vega', '', 'Casa matriz', 'Exhibición central, departamento de financiamiento express y taller oficial.', 0),
  ('bonao', 'Bonao', 'Bonao', '', 'Monseñor Nouel', 'Venta por mayor y detalle, inventario completo de passolas y accesorios.', 1),
  ('sfm', 'San Francisco (SFM)', 'SFM', 'San Francisco de Macorís', 'Provincia Duarte', 'Atención comercial para negocios, flotas comerciales y motos de alta cilindrada.', 2),
  ('moca', 'Moca', 'Moca', '', 'Provincia Espaillat', 'Venta, financiamiento y repuestos para toda la provincia Espaillat.', 3);

insert into public.settings (id, whatsapp, phone_display, monthly_rate, terms, default_term, price_min, price_max, price_step, price_default, down_min, down_max, down_step, down_default) values
  (1, '18093870532', '+1 (809) 387-0532', 0.018, '{6,12,18,24}', 12, 30000, 450000, 5000, 85000, 10, 60, 5, 25);

-- El orden de created_at reproduce el orden del catálogo (la primera es la más reciente)
with data (n, name, category_id, badge, description, image) as (values
  (0, 'Súper Gato Cg200cc', 'cg', '2ble disco', '2ble disco de freno, motor balanceado 200cc de alta potencia.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (1, 'Gacela Tekken 300cc', 'deportivas', '300 cc Sport', 'Dual Sport 300cc 2026, suspensión invertida y chasis reforzado.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75'),
  (2, 'Suzuki Address 1th', 'passola', '110 cc CVT', 'Address 110cc 1th de primera calidad, ahorradora de gasolina.', null),
  (3, 'Black Panther Avenix', 'passola', 'Nueva 0km', 'Avenix 0km, diseño aerodinámico y baúl amplio.', 'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&q=75'),
  (4, 'Suzuki Address 110cc', 'passola', 'Todos colores', 'Todos los colores disponibles, 1t edición especial.', null),
  (5, 'Suzuki Address 125cc', 'passola', '125 cc', 'Address 125cc con mayor torque y aceleración suave.', null),
  (6, 'Yamaha XTZ', 'cross', 'Enduro', 'Enduro pura sangre, suspensión de largo recorrido.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (7, 'Gacela KTR 140cc', 'cross', 'Dirt Cross', 'Motocross 140cc para terreno exigente.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75'),
  (8, 'Gacela Poppy 150cc', 'passola', 'Urban 150', 'Diseño urbano moderno, motor 150cc ágil.', null),
  (9, 'X1000 X-Road 200cc', 'deportivas', 'Dual Sport', 'Dual Sport 200cc, llantas de tacos y barras protegidas.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (10, 'Tauro Fénix 105cc Rojo', 'cg', 'Inicial RD$15k', 'Súper económica para trabajo rudo.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75'),
  (11, 'Gacela Bullet 180cc', 'passola', '180 cc Passola', 'Passola de alto rendimiento 180cc.', null),
  (12, 'Tauro Address 0Km', 'passola', 'Nueva 0km', 'Tauro Address 110cc completamente nueva.', null),
  (13, 'Tauro Súper Cub 110cc', 'cg', 'Clásica Cuba', 'Estilo clásico legendario con baúl de carga.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75'),
  (14, 'Gacela Addresse 180cc', 'passola', 'Max Passola', 'Potencia extra para ciudad y carretera.', null),
  (15, 'Loncin CR5 Pro 250cc', 'deportivas', '250 cc Naked', 'Naked Sport 250cc, enfriamiento por radiador.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (16, 'Gacela KTR 110', 'cross', 'Pitbike 110', 'Cross ligera 110cc para aprendizaje y diversión.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75'),
  (17, 'X1000 CRF-250cc 0km', 'cross', 'CRF 250 Cross', 'Enduro pura de 250cc 0km con frenos de disco ondulados.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (18, 'Apache 4v 200cc', 'deportivas', 'Racing 4V', 'Tecnología TVS Racing 200cc 4 válvulas.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (19, 'Kayo Tt125', 'cross', 'Garantía oficial', '0km con 2 meses de garantía de fábrica.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75'),
  (20, 'Baja Pulsar', 'deportivas', 'Pulsar Tech', 'Tablero digital, aceleración rápida.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (21, 'Tauro Nitro 125cc', 'cg', 'Utilitaria', 'Utilitaria Nitro 125cc duradera.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75'),
  (22, 'Black Panther Avenís Red', 'passola', 'Edición roja', 'Passola Avenís color rojo fuego.', null),
  (23, 'Honda Dio 110 Moderna', 'passola', 'Honda original', 'Passola Honda Dio 110cc inyección suave.', null),
  (24, 'Yamaha Bj 50cc', 'passola', 'Ultra compacta', 'Passola compacta 50cc ideal para mandados.', null),
  (25, 'Tauro Cg150cc', 'cg', 'CG trabajo', 'CG 150cc con parrilla de carga trasera.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75'),
  (26, 'KTM Duke 200cc', 'deportivas', 'Ready to race', 'Naked de alta cilindrada con suspensión WP.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (27, 'KTM Duke 390cc', 'deportivas', 'Duke 390', 'La bestia de 390cc con acelerador Ride-by-Wire.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (28, 'Kayo K2 150cc', 'cross', 'Enduro K2', 'Enduro ligera de 150cc para pistas.', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75'),
  (29, 'Kymco Agility Clásica', 'passola', 'Kymco clásica', 'Disponible en todos los colores.', null),
  (30, 'Yamaha Artística', 'passola', 'Edición especial', 'Passola icónica Yamaha Artística en excelente estado.', null),
  (31, 'Súper Gato V150', 'passola', 'SG V150', 'Passola de motor 150cc resistente.', null),
  (32, 'Tauro Dio''s 110cc', 'passola', 'Tauro Dio', 'Passola suave y económica de mantenimiento.', null),
  (33, 'Súper Gato Furia 250', 'cross', 'Furia 250', 'Enduro 250cc Furia con escape deportivo.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75'),
  (34, 'SYM GR150', 'passola', 'SYM Taiwan', 'Passola deportiva SYM GR 150cc color turquesa.', null),
  (35, 'Honda Today 50cc', 'passola', 'Honda Today', 'Súper económica de combustible.', null),
  (36, 'Súper Gato Vengala 250cc', 'cross', 'Vengala 250', 'Cross 250cc Vengala con aros de aluminio decorados.', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75')
), ins as (
  insert into public.bikes (name, category_id, badge, description, created_at)
  select name, category_id, badge, description, now() - make_interval(mins => n) from data order by n
  returning id, name, created_at
)
insert into public.bike_images (bike_id, path, position)
select ins.id, data.image, 0
from ins join data on data.name = ins.name and ins.created_at = now() - make_interval(mins => data.n)
where data.image is not null;
