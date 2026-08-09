export interface Project {
  id: string
  name: string
  description: string
  system_prompt: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  project_id: string | null
  title: string
  model: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  artifacts: Artifact[]
  attachments: Attachment[]
  created_at: string
}

export interface Artifact {
  type: 'code' | 'svg' | 'html' | 'markdown' | 'json'
  content: string
  language?: string
  title?: string
}

export interface Attachment {
  id: string
  filename: string
  mime_type: string
  size: number
}

export interface Memory {
  id: string
  content: string
  category: string
  created_at: string
}

export interface Skill {
  id: string
  name: string
  description: string
  prompt_template: string
  is_active: boolean
  created_at: string
}

export interface PromptTemplate {
  id: string
  organization_id: string
  name: string
  description: string
  category: string
  content: string
  variables: string[]
  is_public: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  organization_id: string
  name: string
  prefix: string
  created_by: string | null
  last_used_at: string | null
  expires_at: string | null
  revoked: boolean
  created_at: string
}

export interface ApiKeyCreated {
  id: string
  name: string
  key: string
  prefix: string
  expires_at: string | null
  created_at: string
}
