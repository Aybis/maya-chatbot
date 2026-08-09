"""Code execution sandbox (Phase B5).

Runs user code in a subprocess with resource limits and no network intent.
Python uses the current interpreter; JS uses ``node`` if available. Output
is capped; wall-clock and rlimits bound CPU/memory. This is a best-effort
local sandbox — for stronger isolation run it inside a container.
"""
import asyncio
import os
import resource
import shutil
import tempfile
from typing import Optional

MAX_OUTPUT = 64 * 1024  # 64 KB cap on stdout/stderr each
DEFAULT_TIMEOUT = 10    # seconds
MAX_TIMEOUT = 30

LANG_RUNNERS = {
    "python": {"ext": ".py", "cmd": ["python3"]},
    "py": {"ext": ".py", "cmd": ["python3"]},
    "javascript": {"ext": ".js", "cmd": ["node"]},
    "js": {"ext": ".js", "cmd": ["node"]},
    "node": {"ext": ".js", "cmd": ["node"]},
}


def _apply_limits():
    """Set rlimits in the child process (pre-exec). Each limit is best-effort —
    macOS in particular disallows/ignores several of these, so never raise."""
    def _try(limit, soft, hard):
        try:
            resource.setrlimit(limit, (soft, hard))
        except Exception:
            pass

    # CPU time
    _try(resource.RLIMIT_CPU, MAX_TIMEOUT + 5, MAX_TIMEOUT + 5)
    # Address space: 512 MB (not supported on macOS — guarded)
    mem = 512 * 1024 * 1024
    _try(resource.RLIMIT_AS, mem, mem)
    # Max file size: 1 MB
    _try(resource.RLIMIT_FSIZE, 1024 * 1024, 1024 * 1024)
    # No core dumps
    _try(resource.RLIMIT_CORE, 0, 0)
    # Limit processes
    if hasattr(resource, "RLIMIT_NPROC"):
        _try(resource.RLIMIT_NPROC, 64, 64)


async def execute_code(language: str, code: str, timeout: int = DEFAULT_TIMEOUT) -> dict:
    """Execute ``code`` and return {stdout, stderr, exit_code, timed_out}."""
    lang = (language or "").lower().strip()
    runner = LANG_RUNNERS.get(lang)
    if not runner:
        return {"error": f"Unsupported language '{language}'. Allowed: python, javascript."}

    cmd0 = runner["cmd"][0]
    resolved = shutil.which(cmd0)
    if not resolved:
        return {"error": f"Runtime '{cmd0}' not available on this host."}

    timeout = max(1, min(int(timeout or DEFAULT_TIMEOUT), MAX_TIMEOUT))

    tmpdir = tempfile.mkdtemp(prefix="maya_exec_")
    path = os.path.join(tmpdir, "main" + runner["ext"])
    try:
        with open(path, "w") as f:
            f.write(code)

        # Keep the runtime's own directory on PATH so node/python resolve, while
        # still providing a minimal, predictable environment to the subprocess.
        runtime_dir = os.path.dirname(resolved)
        env = {
            "PATH": f"{runtime_dir}:/usr/bin:/bin:/usr/local/bin",
            "HOME": tmpdir,
            "LANG": "C.UTF-8",
        }

        proc = await asyncio.create_subprocess_exec(
            resolved, path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=tmpdir,
            env=env,
            preexec_fn=_apply_limits if os.name == "posix" else None,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            timed_out = False
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            stdout, stderr = b"", b""
            timed_out = True

        return {
            "stdout": stdout.decode("utf-8", errors="replace")[:MAX_OUTPUT],
            "stderr": stderr.decode("utf-8", errors="replace")[:MAX_OUTPUT],
            "exit_code": proc.returncode if not timed_out else None,
            "timed_out": timed_out,
        }
    finally:
        try:
            shutil.rmtree(tmpdir, ignore_errors=True)
        except Exception:
            pass
