from pydantic import BaseModel, ConfigDict

class ServerBase(BaseModel):
    name: str
    alias: str

class ServerCreate(ServerBase):
    pass

class ServerResponse(ServerBase):
    id: int
    active: bool
    model_config = ConfigDict(from_attributes=True)
