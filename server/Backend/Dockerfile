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
RUN find /app/app -maxdepth 1 -name '_tmp_verify*' -delete

CMD ["python", "-m", "app.main"]
