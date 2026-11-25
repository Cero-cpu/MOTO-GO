/**
 * Datos iniciales de demostración basados en seed.sql.
 * Permiten que la web y el panel funcionen inmediatamente aun sin conexión a Postgres.
 */
export const INITIAL_SITE_DATA = {
  "categories": [
    {
      "id": "passola",
      "label": "Passolas & Scooters"
    },
    {
      "id": "cg",
      "label": "Utilitarias / CG"
    },
    {
      "id": "cross",
      "label": "Enduro / Cross"
    },
    {
      "id": "deportivas",
      "label": "Sport / Deportivas"
    }
  ],
  "branches": [
    {
      "id": "la-vega",
      "name": "La Vega",
      "short": "La Vega",
      "fullName": "",
      "tag": "Casa matriz",
      "description": "Exhibición central, departamento de financiamiento express y taller oficial."
    },
    {
      "id": "bonao",
      "name": "Bonao",
      "short": "Bonao",
      "fullName": "",
      "tag": "Monseñor Nouel",
      "description": "Venta por mayor y detalle, inventario completo de passolas y accesorios."
    },
    {
      "id": "sfm",
      "name": "San Francisco (SFM)",
      "short": "SFM",
      "fullName": "San Francisco de Macorís",
      "tag": "Provincia Duarte",
      "description": "Atención comercial para negocios, flotas comerciales y motos de alta cilindrada."
    },
    {
      "id": "moca",
      "name": "Moca",
      "short": "Moca",
      "fullName": "",
      "tag": "Provincia Espaillat",
      "description": "Venta, financiamiento y repuestos para toda la provincia Espaillat."
    }
  ],
  "offers": [
    {
      "id": "oferta-1",
      "title": "Financiamiento express con cuotas flexibles",
      "tag": "OFERTA ESPECIAL",
      "description": "Monta tu moto hoy mismo con aprobación en 15 minutos y tasa preferencial.",
      "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75",
      "buttonText": "Consultar financiamiento",
      "waMessage": "Hola Motogo, me interesa la oferta de financiamiento express.",
      "startsAt": null,
      "endsAt": null,
      "active": true
    }
  ],
  "bikes": [
    {
      "id": "bike-1",
      "name": "Súper Gato Cg200cc",
      "category": "cg",
      "badge": "2ble disco",
      "description": "2ble disco de freno, motor balanceado 200cc de alta potencia.",
      "price": 85000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:53:59.683Z",
      "updatedAt": "2026-11-18T23:53:59.683Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-2",
      "name": "Gacela Tekken 300cc",
      "category": "deportivas",
      "badge": "300 cc Sport",
      "description": "Dual Sport 300cc 2026, suspensión invertida y chasis reforzado.",
      "price": 100000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:52:59.683Z",
      "updatedAt": "2026-11-18T23:52:59.683Z",
      "images": [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-3",
      "name": "Suzuki Address 1th",
      "category": "passola",
      "badge": "110 cc CVT",
      "description": "Address 110cc 1th de primera calidad, ahorradora de gasolina.",
      "price": 115000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:51:59.683Z",
      "updatedAt": "2026-11-18T23:51:59.683Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-4",
      "name": "Black Panther Avenix",
      "category": "passola",
      "badge": "Nueva 0km",
      "description": "Avenix 0km, diseño aerodinámico y baúl amplio.",
      "price": 130000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:50:59.683Z",
      "updatedAt": "2026-11-18T23:50:59.683Z",
      "images": [
        "https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-5",
      "name": "Suzuki Address 110cc",
      "category": "passola",
      "badge": "Todos colores",
      "description": "Todos los colores disponibles, 1t edición especial.",
      "price": 145000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:49:59.683Z",
      "updatedAt": "2026-11-18T23:49:59.683Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-6",
      "name": "Suzuki Address 125cc",
      "category": "passola",
      "badge": "125 cc",
      "description": "Address 125cc con mayor torque y aceleración suave.",
      "price": 85000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:48:59.683Z",
      "updatedAt": "2026-11-18T23:48:59.683Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-7",
      "name": "Yamaha XTZ",
      "category": "cross",
      "badge": "Enduro",
      "description": "Enduro pura sangre, suspensión de largo recorrido.",
      "price": 100000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:47:59.683Z",
      "updatedAt": "2026-11-18T23:47:59.683Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-8",
      "name": "Gacela KTR 140cc",
      "category": "cross",
      "badge": "Dirt Cross",
      "description": "Motocross 140cc para terreno exigente.",
      "price": 115000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:46:59.683Z",
      "updatedAt": "2026-11-18T23:46:59.683Z",
      "images": [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-9",
      "name": "Gacela Poppy 150cc",
      "category": "passola",
      "badge": "Urban 150",
      "description": "Diseño urbano moderno, motor 150cc ágil.",
      "price": 130000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:45:59.683Z",
      "updatedAt": "2026-11-18T23:45:59.683Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-10",
      "name": "X1000 X-Road 200cc",
      "category": "deportivas",
      "badge": "Dual Sport",
      "description": "Dual Sport 200cc, llantas de tacos y barras protegidas.",
      "price": 145000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:44:59.684Z",
      "updatedAt": "2026-11-18T23:44:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-11",
      "name": "Tauro Fénix 105cc Rojo",
      "category": "cg",
      "badge": "Inicial RD$15k",
      "description": "Súper económica para trabajo rudo.",
      "price": 85000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:43:59.684Z",
      "updatedAt": "2026-11-18T23:43:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-12",
      "name": "Gacela Bullet 180cc",
      "category": "passola",
      "badge": "180 cc Passola",
      "description": "Passola de alto rendimiento 180cc.",
      "price": 100000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:42:59.684Z",
      "updatedAt": "2026-11-18T23:42:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-13",
      "name": "Tauro Address 0Km",
      "category": "passola",
      "badge": "Nueva 0km",
      "description": "Tauro Address 110cc completamente nueva.",
      "price": 115000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:41:59.684Z",
      "updatedAt": "2026-11-18T23:41:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-14",
      "name": "Tauro Súper Cub 110cc",
      "category": "cg",
      "badge": "Clásica Cuba",
      "description": "Estilo clásico legendario con baúl de carga.",
      "price": 130000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:40:59.684Z",
      "updatedAt": "2026-11-18T23:40:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-15",
      "name": "Gacela Addresse 180cc",
      "category": "passola",
      "badge": "Max Passola",
      "description": "Potencia extra para ciudad y carretera.",
      "price": 145000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:39:59.684Z",
      "updatedAt": "2026-11-18T23:39:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-16",
      "name": "Loncin CR5 Pro 250cc",
      "category": "deportivas",
      "badge": "250 cc Naked",
      "description": "Naked Sport 250cc, enfriamiento por radiador.",
      "price": 85000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:38:59.684Z",
      "updatedAt": "2026-11-18T23:38:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-17",
      "name": "Gacela KTR 110",
      "category": "cross",
      "badge": "Pitbike 110",
      "description": "Cross ligera 110cc para aprendizaje y diversión.",
      "price": 100000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:37:59.684Z",
      "updatedAt": "2026-11-18T23:37:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-18",
      "name": "X1000 CRF-250cc 0km",
      "category": "cross",
      "badge": "CRF 250 Cross",
      "description": "Enduro pura de 250cc 0km con frenos de disco ondulados.",
      "price": 115000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:36:59.684Z",
      "updatedAt": "2026-11-18T23:36:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-19",
      "name": "Apache 4v 200cc",
      "category": "deportivas",
      "badge": "Racing 4V",
      "description": "Tecnología TVS Racing 200cc 4 válvulas.",
      "price": 130000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:35:59.684Z",
      "updatedAt": "2026-11-18T23:35:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-20",
      "name": "Kayo Tt125",
      "category": "cross",
      "badge": "Garantía oficial",
      "description": "0km con 2 meses de garantía de fábrica.",
      "price": 145000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:34:59.684Z",
      "updatedAt": "2026-11-18T23:34:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-21",
      "name": "Baja Pulsar",
      "category": "deportivas",
      "badge": "Pulsar Tech",
      "description": "Tablero digital, aceleración rápida.",
      "price": 85000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:33:59.684Z",
      "updatedAt": "2026-11-18T23:33:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-22",
      "name": "Tauro Nitro 125cc",
      "category": "cg",
      "badge": "Utilitaria",
      "description": "Utilitaria Nitro 125cc duradera.",
      "price": 100000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:32:59.684Z",
      "updatedAt": "2026-11-18T23:32:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-23",
      "name": "Black Panther Avenís Red",
      "category": "passola",
      "badge": "Edición roja",
      "description": "Passola Avenís color rojo fuego.",
      "price": 115000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:31:59.684Z",
      "updatedAt": "2026-11-18T23:31:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-24",
      "name": "Honda Dio 110 Moderna",
      "category": "passola",
      "badge": "Honda original",
      "description": "Passola Honda Dio 110cc inyección suave.",
      "price": 130000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:30:59.684Z",
      "updatedAt": "2026-11-18T23:30:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-25",
      "name": "Yamaha Bj 50cc",
      "category": "passola",
      "badge": "Ultra compacta",
      "description": "Passola compacta 50cc ideal para mandados.",
      "price": 145000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:29:59.684Z",
      "updatedAt": "2026-11-18T23:29:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-26",
      "name": "Tauro Cg150cc",
      "category": "cg",
      "badge": "CG trabajo",
      "description": "CG 150cc con parrilla de carga trasera.",
      "price": 85000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:28:59.684Z",
      "updatedAt": "2026-11-18T23:28:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-27",
      "name": "KTM Duke 200cc",
      "category": "deportivas",
      "badge": "Ready to race",
      "description": "Naked de alta cilindrada con suspensión WP.",
      "price": 100000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:27:59.684Z",
      "updatedAt": "2026-11-18T23:27:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-28",
      "name": "KTM Duke 390cc",
      "category": "deportivas",
      "badge": "Duke 390",
      "description": "La bestia de 390cc con acelerador Ride-by-Wire.",
      "price": 115000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:26:59.684Z",
      "updatedAt": "2026-11-18T23:26:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-29",
      "name": "Kayo K2 150cc",
      "category": "cross",
      "badge": "Enduro K2",
      "description": "Enduro ligera de 150cc para pistas.",
      "price": 130000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:25:59.684Z",
      "updatedAt": "2026-11-18T23:25:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-30",
      "name": "Kymco Agility Clásica",
      "category": "passola",
      "badge": "Kymco clásica",
      "description": "Disponible en todos los colores.",
      "price": 145000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:24:59.684Z",
      "updatedAt": "2026-11-18T23:24:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-31",
      "name": "Yamaha Artística",
      "category": "passola",
      "badge": "Edición especial",
      "description": "Passola icónica Yamaha Artística en excelente estado.",
      "price": 85000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:23:59.684Z",
      "updatedAt": "2026-11-18T23:23:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-32",
      "name": "Súper Gato V150",
      "category": "passola",
      "badge": "SG V150",
      "description": "Passola de motor 150cc resistente.",
      "price": 100000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:22:59.684Z",
      "updatedAt": "2026-11-18T23:22:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-34",
      "name": "Súper Gato Furia 250",
      "category": "cross",
      "badge": "Furia 250",
      "description": "Enduro 250cc Furia con escape deportivo.",
      "price": 130000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:20:59.684Z",
      "updatedAt": "2026-11-18T23:20:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-35",
      "name": "SYM GR150",
      "category": "passola",
      "badge": "SYM Taiwan",
      "description": "Passola deportiva SYM GR 150cc color turquesa.",
      "price": 145000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:19:59.684Z",
      "updatedAt": "2026-11-18T23:19:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-36",
      "name": "Honda Today 50cc",
      "category": "passola",
      "badge": "Honda Today",
      "description": "Súper económica de combustible.",
      "price": 85000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:18:59.684Z",
      "updatedAt": "2026-11-18T23:18:59.684Z",
      "images": [],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    },
    {
      "id": "bike-37",
      "name": "Súper Gato Vengala 250cc",
      "category": "cross",
      "badge": "Vengala 250",
      "description": "Cross 250cc Vengala con aros de aluminio decorados.",
      "price": 100000,
      "status": "disponible",
      "published": true,
      "createdAt": "2026-11-18T23:17:59.684Z",
      "updatedAt": "2026-11-18T23:17:59.684Z",
      "images": [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=75"
      ],
      "branches": [
        "la-vega",
        "bonao",
        "sfm",
        "moca"
      ]
    }
  ],
  "settings": {
    "contact": {
      "whatsapp": "18093870532",
      "phoneDisplay": "+1 (809) 387-0532"
    },
    "finance": {
      "monthlyRate": 0.018,
      "terms": [
        6,
        12,
        18,
        24
      ],
      "defaultTerm": 12,
      "price": {
        "min": 30000,
        "max": 450000,
        "step": 5000,
        "default": 85000
      },
      "downPayment": {
        "min": 10,
        "max": 60,
        "step": 5,
        "default": 25
      }
    }
  }
};
