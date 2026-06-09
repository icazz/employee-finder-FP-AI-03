# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict
# pyrefly: ignore [missing-import]
from pydantic import Field, field_validator

class Settings(BaseSettings):
    # API Keys
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    hf_api_key: str = Field(default="", alias="HF_API_KEY")
    use_local_embeddings: bool = Field(default=False, alias="USE_LOCAL_EMBEDDINGS")
    
    # File Processing Settings
    allowed_extensions: str | set[str] = Field(default={"pdf", "docx"}, alias="ALLOWED_EXTENSIONS")
    max_file_size_mb: int = Field(default=25, alias="MAX_FILE_SIZE_MB")

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    @field_validator("allowed_extensions", mode="before")
    @classmethod
    def parse_allowed_extensions(cls, v):
        if isinstance(v, str):
            # Parse comma-separated string to set of extensions
            return {ext.strip().lower() for ext in v.split(",") if ext.strip()}
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True
    )

settings = Settings()
