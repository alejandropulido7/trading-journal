# Excepción base para nuestra aplicación
class AppDomainError(Exception):
    pass

# Excepciones específicas
class NotFoundError(AppDomainError):
    def __init__(self, entity_name: str, entity_id: int):
        self.entity_name = entity_name
        self.entity_id = entity_id
        self.message = f"{entity_name} con ID {entity_id} no fue encontrado/a."
        super().__init__(self.message)

class BusinessLogicError(AppDomainError):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)