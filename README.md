# OmniverseTV API 🌌📺

## (en) Project Description

OmniverseTV is the backend service for a fictional Interdimensional TV subscription platform. This portfolio project showcases a robust, scalable, and high-performance API built with a modern tech stack.

The core feature is a subscription management system for accessing TV channel packages from across the multiverse. A key technical challenge is the **asynchronous, on-demand translation engine**, which automatically translates channel names and descriptions into the user's preferred language, caching the results for optimal performance.

The entire application is containerized using Docker for consistency and ease of deployment.

### Key Features

* **User Authentication:** Secure user registration and login using JWT.
* **Subscription Management:** Logic for subscribing, upgrading, and viewing channel packages.
* **Dynamic Content Catalog:** API endpoints to browse dimensions, channel packages, and individual channels.
* **Asynchronous Translation Engine:** A smart system that provides translations without blocking the user experience, using a background worker process.
* **High-Performance Architecture:** Caching layer with Redis and optimized database queries with Sequelize.
* **Containerized Environment:** Fully configured with Docker and Docker Compose for development and production.

### Tech Stack

* **Language:** TypeScript
* **Framework:** Node.js with Express.js
* **Database:** MySQL with Sequelize (ORM)
* **Caching:** Redis
* **Job Queue:** BullMQ for background jobs (translations)
* **Containerization:** Docker & Docker Compose

---

## (es) Descripción del Proyecto

OmniverseTV es el servicio backend para una plataforma ficticia de suscripción a TV Interdimensional. Este proyecto de portfolio demuestra una API robusta, escalable y de alto rendimiento construida con un stack tecnológico moderno.

La funcionalidad principal es un sistema de gestión de suscripciones para acceder a paquetes de canales de TV de todo el multiverso. Uno de los desafíos técnicos clave es el **motor de traducción asíncrono bajo demanda**, que traduce automáticamente los nombres y descripciones de los canales al idioma preferido del usuario, guardando los resultados en caché para un rendimiento óptimo.

Toda la aplicación está contenerizada usando Docker para garantizar la consistencia y facilidad de despliegue.

### Funcionalidades Clave

* **Autenticación de Usuarios:** Registro e inicio de sesión seguros usando JWT.
* **Gestión de Suscripciones:** Lógica para suscribirse, cambiar de plan y ver los paquetes de canales.
* **Catálogo de Contenido Dinámico:** Endpoints para explorar dimensiones, paquetes de canales y canales individuales.
* **Motor de Traducción Asíncrono:** Un sistema inteligente que provee traducciones sin bloquear la experiencia de usuario, usando un proceso "worker" en segundo plano.
* **Arquitectura de Alto Rendimiento:** Capa de caché con Redis y consultas a base de datos optimizadas con Sequelize.
* **Entorno Contenerizado:** Totalmente configurado con Docker y Docker Compose para desarrollo y producción.

### Tecnologías Utilizadas

* **Lenguaje:** TypeScript
* **Framework:** Node.js con Express.js
* **Base de Datos:** MySQL con Sequelize (ORM)
* **Caché:** Redis
* **Cola de Tareas:** BullMQ para tareas en segundo plano (traducciones)
* **Contenerización:** Docker & Docker Compose