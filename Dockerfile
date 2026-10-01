# -- Base image: slim Python 3.11 ----------------------------------------------
FROM python:3.11-slim

# -- System dependencies (OpenCV + build tools) --------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# -- Create a non-root user (required by Hugging Face Spaces) ------------------
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# -- Working directory ---------------------------------------------------------
WORKDIR /app

# -- Install Python dependencies -----------------------------------------------
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# -- Copy application source ---------------------------------------------------
COPY --chown=user . .

# -- Ensure the data/sessions directory exists (writable in the container) -----
RUN mkdir -p /app/data/sessions

# -- Hugging Face Spaces exposes port 7860 -------------------------------------
EXPOSE 7860

# -- Start the FastAPI server --------------------------------------------------
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
