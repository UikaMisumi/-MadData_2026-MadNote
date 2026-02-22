import os
from typing import Any

try:
    from dotenv import load_dotenv
except Exception:
    def load_dotenv(*args, **kwargs):
        return False

try:
    from openai import OpenAI
except Exception:
    OpenAI = None


DEFAULT_MODEL = "deepseek-chat"
DEFAULT_BASE_URL = "https://api.deepseek.com"


def _paper_context_block(paper: dict[str, Any]) -> str:
    title = str(paper.get("title") or "").strip()
    abstract = str(paper.get("abstract") or "").strip()
    ai_summary = str(paper.get("ai_summary") or "").strip()
    the_problem = str(paper.get("the_problem") or "").strip()
    the_method = str(paper.get("the_method") or "").strip()
    keywords = paper.get("keywords") or []
    authors = paper.get("authors") or []

    keywords_text = ", ".join([str(k).strip() for k in keywords if str(k).strip()][:12]) or "N/A"
    authors_text = ", ".join([str(a).strip() for a in authors if str(a).strip()][:12]) or "N/A"

    return (
        f"[Title]: {title or 'Unknown'}\n"
        f"[Authors]: {authors_text}\n"
        f"[Keywords]: {keywords_text}\n"
        f"[AI Summary]: {ai_summary or 'N/A'}\n"
        f"[Problem]: {the_problem or 'N/A'}\n"
        f"[Method]: {the_method or 'N/A'}\n"
        f"[Abstract]: {abstract or 'N/A'}"
    )


def _build_system_prompt(paper: dict[str, Any]) -> str:
    return (
        "You are an academic paper assistant.\n"
        "Answer only using the paper context below.\n"
        "If context is insufficient, say that clearly.\n"
        "Keep answers concise and precise.\n\n"
        "--- PAPER CONTEXT ---\n"
        f"{_paper_context_block(paper)}\n"
        "---------------------"
    )


def _sanitize_history(history: Any, max_turns: int = 8) -> list[dict[str, str]]:
    if not isinstance(history, list):
        return []
    cleaned: list[dict[str, str]] = []
    for item in history:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role") or "").strip().lower()
        content = str(item.get("content") or "").strip()
        if role not in {"user", "assistant"}:
            continue
        if not content:
            continue
        cleaned.append({"role": role, "content": content})
    if len(cleaned) > max_turns * 2:
        cleaned = cleaned[-max_turns * 2 :]
    return cleaned


def _build_messages(paper: dict[str, Any], user_message: str, history: Any = None) -> list[dict[str, str]]:
    messages = [{"role": "system", "content": _build_system_prompt(paper)}]
    messages.extend(_sanitize_history(history))
    messages.append({"role": "user", "content": str(user_message).strip()})
    return messages


def _create_client() -> Any:
    load_dotenv()
    api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY is not configured on backend.")
    if OpenAI is None:
        raise RuntimeError("Python package 'openai' is not installed.")
    return OpenAI(api_key=api_key, base_url=DEFAULT_BASE_URL)


def chat_with_paper(
    paper: dict[str, Any],
    user_message: str,
    history: Any = None,
    model_name: str = DEFAULT_MODEL,
) -> dict[str, Any]:
    prompt = str(user_message or "").strip()
    if not prompt:
        raise RuntimeError("message is required")

    client = _create_client()
    messages = _build_messages(paper, prompt, history)

    response = client.chat.completions.create(
        model=model_name,
        messages=messages,
        stream=False,
    )
    answer = (response.choices[0].message.content or "").strip()
    if not answer:
        answer = "No response generated."

    output_history = _sanitize_history(history)
    output_history.append({"role": "user", "content": prompt})
    output_history.append({"role": "assistant", "content": answer})

    return {
        "reply": answer,
        "history": output_history,
        "model": model_name,
    }


def run_chat():
    # Local CLI debug entry for quick manual tests.
    paper = {
        "title": "Sample Paper",
        "abstract": "This is a sample abstract for local testing.",
        "ai_summary": "Sample AI summary.",
    }
    history = []
    print("AI paper chat debug mode. Type q to quit.")
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in {"q", "quit", "exit"}:
            break
        if not user_input:
            continue
        try:
            result = chat_with_paper(paper, user_input, history)
            history = result["history"]
            print(f"AI: {result['reply']}\n")
        except Exception as err:
            print(f"Error: {err}\n")


if __name__ == "__main__":
    run_chat()
