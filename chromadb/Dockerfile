FROM python:3.10

WORKDIR /app
COPY . .
RUN pip install chromadb uvicorn

CMD ["uvicorn", "chromadb.app:app", "--host", "0.0.0.0", "--port", "8000"]
