from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectBase(BaseModel):
    name: str
    description: str = ""
    system_prompt: str = ""


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime


class ConversationBase(BaseModel):
    project_id: Optional[str] = None
    title: str = "New Chat"
    model: str = "gpt-4o"


class ConversationCreate(ConversationBase):
    pass


class Conversation(ConversationBase):
    id: str
    created_at: datetime
    updated_at: datetime


class MessageBase(BaseModel):
    role: str
    content: str
    artifacts: List[dict] = []
    attachments: List[dict] = []


class MessageCreate(MessageBase):
    conversation_id: str


class Message(MessageBase):
    id: str
    conversation_id: str
    created_at: datetime


class MemoryBase(BaseModel):
    content: str
    category: str = "general"


class Memory(MemoryBase):
    id: str
    created_at: datetime


class SkillBase(BaseModel):
    name: str
    description: str = ""
    prompt_template: str
    is_active: bool = True


class Skill(SkillBase):
    id: str
    created_at: datetime


class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    model: Optional[str] = None
    attachments: List[dict] = []
    stream: bool = True


class ArtifactData(BaseModel):
    type: str  # code, svg, html, markdown, json
    content: str
    language: Optional[str] = None
    title: Optional[str] = None


class PromptTemplateBase(BaseModel):
    name: str
    description: str = ""
    category: str = "general"
    content: str
    variables: List[str] = []
    is_public: bool = False


class PromptTemplateCreate(PromptTemplateBase):
    pass


class PromptTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    variables: Optional[List[str]] = None
    is_public: Optional[bool] = None


class PromptTemplate(PromptTemplateBase):
    id: str
    organization_id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ApiKeyCreate(BaseModel):
    name: str
    expires_at: Optional[datetime] = None


class ApiKeyCreated(BaseModel):
    """Returned once at creation — includes the plaintext key."""
    id: str
    name: str
    key: str            # plaintext — shown ONCE, never stored
    prefix: str
    expires_at: Optional[datetime] = None
    created_at: datetime


class ApiKey(BaseModel):
    """List view — never includes the plaintext or the hash."""
    id: str
    organization_id: str
    name: str
    prefix: str
    created_by: Optional[str] = None
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    revoked: bool
    created_at: datetime


class AuditLog(BaseModel):
    id: str
    organization_id: str
    user_id: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: dict = {}
    created_at: datetime


class McpServerBase(BaseModel):
    name: str
    url: str
    enabled: bool = True


class McpServerCreate(McpServerBase):
    pass


class McpServer(McpServerBase):
    id: str
    organization_id: str
    created_at: datetime
