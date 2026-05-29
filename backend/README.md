

backend/
├── main.py                 # (Punto de entrada súper limpio)
├── database.py             # (Conexión a BD - se queda igual)
├── models/                 # (M) Capa de Datos
│   ├── __init__.py
│   ├── base.py             # Base = declarative_base()
│   ├── account_model.py
│   └── trade_idea_model.py
├── schemas/                # (V) Capa de Validación / Vistas JSON
│   ├── __init__.py
│   ├── account_schema.py
│   └── trade_idea_schema.py
├── controllers/            # (C) Capa de Enrutamiento (Endpoints)
│   ├── __init__.py
│   ├── account_controller.py
│   └── trade_idea_controller.py
└── services/               # (Lógica de Negocio y BD)
    ├── __init__.py
    ├── account_service.py
    └── trade_idea_service.py