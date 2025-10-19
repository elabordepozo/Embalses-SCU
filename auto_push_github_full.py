import os
import subprocess
from datetime import datetime
import sys
import ctypes

# Ruta de tu proyecto local
REPO_PATH = r"C:\Users\Eduardo Laborde\Desktop\Dashboard"

def run(cmd, cwd=REPO_PATH):
    """Ejecuta un comando y devuelve código, salida y error."""
    result = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout.strip(), result.stderr.strip()

def message_box(text, title):
    """Muestra un mensaje emergente en Windows."""
    ctypes.windll.user32.MessageBoxW(0, text, title, 0x40)  # 0x40 = icono de información

def error_box(text, title):
    """Muestra un mensaje de error en Windows."""
    ctypes.windll.user32.MessageBoxW(0, text, title, 0x10)  # 0x10 = icono de error

def is_git_repo(path):
    return os.path.isdir(os.path.join(path, ".git"))

def current_branch():
    code, out, err = run("git rev-parse --abbrev-ref HEAD")
    return out if code == 0 else None

def has_changes():
    code, out, err = run("git status --porcelain")
    if code != 0:
        raise RuntimeError(f"Error verificando cambios: {err}")
    return bool(out.strip())

def safe_git_push(branch):
    """Intenta hacer push; si falla por conflicto remoto, resuelve automáticamente."""
    code, out, err = run(f"git push origin {branch}")
    if code == 0:
        print("✅ Push exitoso.")
        return True

    if "fetch first" in err or "non-fast-forward" in err:
        print("⚠️ El remoto tiene cambios no sincronizados. Intentando resolver automáticamente...")
        run("git fetch --all")
        run("git rebase --abort")
        run(f"git pull origin {branch} --rebase")
        code2, out2, err2 = run(f"git push origin {branch} --force")
        if code2 == 0:
            print("✅ Rebase y push forzado completados.")
            return True
        else:
            print(f"❌ Falló el push forzado:\n{err2}")
            return False
    else:
        print(f"❌ Error desconocido en push:\n{err}")
        return False

if __name__ == "__main__":
    try:
        if not is_git_repo(REPO_PATH):
            raise RuntimeError("Este directorio no es un repositorio Git. Inicialízalo primero.")

        os.chdir(REPO_PATH)
        branch = current_branch()
        if not branch:
            raise RuntimeError("No pude determinar la rama actual.")

        print(f"📂 Repositorio: {REPO_PATH}")
        print(f"🌿 Rama actual: {branch}")

        # Asegurar sincronización
        run("git fetch --all")
        run("git rebase --abort")
        run(f"git pull origin {branch} --rebase")

        # Commit automático si hay cambios
        if has_changes():
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            msg = f"Actualización automática {timestamp}"
            print(f"📝 Cambios detectados → commit '{msg}'")
            run("git add .")
            run(f'git commit -m "{msg}"')
        else:
            print("✅ No hay cambios nuevos para subir.")

        # Intentar subir con recuperación
        success = safe_git_push(branch)

        if success:
            message_box("Actualización Completada", "GitHub Dashboard")
        else:
            error_box("Error durante la actualización", "GitHub Dashboard")
            sys.exit(1)

    except Exception as e:
        print(f"❗ Error general: {e}")
        error_box(f"Error: {e}", "GitHub Dashboard")
        sys.exit(2)
