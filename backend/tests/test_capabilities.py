"""Provider capability inference — guard against multimodal models being
mislabeled text-only when the provider returns no capability metadata."""
import pytest

from app.services.providers import infer_capabilities


@pytest.mark.parametrize("model_id", [
    "gpt-5.5", "gpt-5.6-luna", "gpt-4o",
    "claude-opus-5", "claude-sonnet-5", "claude-3-5-sonnet",
    "gemini-2.0-flash", "gemini-1.5-pro",
    "qwen-3.8-max", "qwen-vl-max",
    "kimi-k3", "glm-5.2",
])
def test_multimodal_models_get_vision(model_id):
    caps = infer_capabilities(model_id)
    assert caps["vision"] is True, f"{model_id} should infer vision"
    assert caps["multimodal"] is True


@pytest.mark.parametrize("model_id", [
    "deepseek-v4-flash", "deepseek-v4-pro", "shiteru-auto",
])
def test_text_models_stay_text_only(model_id):
    caps = infer_capabilities(model_id)
    assert caps["vision"] is False, f"{model_id} should be text-only"


def test_modalities_reflect_capabilities():
    caps = infer_capabilities("gpt-5.5")
    assert "image" in caps["modalities"]
    assert "text" in caps["modalities"]


def test_provider_metadata_overrides_heuristics():
    # Explicit provider metadata wins over name guessing.
    caps = infer_capabilities("some-random-model", raw={"capabilities": {"vision": True}})
    assert caps["vision"] is True
