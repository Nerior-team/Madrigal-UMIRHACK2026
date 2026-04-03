FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    pydantic-settings \
    sqlalchemy \
    psycopg[binary] \
    redis \
    argon2-cffi \
    pyotp \
    cryptography \
    email-validator \
    python-multipart

COPY app ./app

CMD ["python", "-m", "app.main"]
